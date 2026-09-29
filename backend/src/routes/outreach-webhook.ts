import { createHmac, timingSafeEqual } from 'node:crypto';
import express from 'express';
import { config } from '../config';
import { markOutreachReply } from '../models/outreach.model';

export const outreachWebhookRouter = express.Router();

outreachWebhookRouter.get('/', (req, res) => {
  if (!config.outreach.webhookVerifyToken || req.query['hub.mode'] !== 'subscribe' || req.query['hub.verify_token'] !== config.outreach.webhookVerifyToken) {
    return res.sendStatus(403);
  }
  return res.status(200).send(String(req.query['hub.challenge'] ?? ''));
});

outreachWebhookRouter.post('/', async (req, res) => {
  if (!config.outreach.appSecret || !Buffer.isBuffer(req.body)) return res.sendStatus(403);
  const signature = String(req.header('x-hub-signature-256') ?? '');
  const expected = `sha256=${createHmac('sha256', config.outreach.appSecret).update(req.body).digest('hex')}`;
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.sendStatus(403);
  try {
    const payload = JSON.parse(req.body.toString('utf8')) as { entry?: Array<{ changes?: Array<{ value?: { metadata?: { phone_number_id?: string }; messages?: Array<{ from?: string }> } }> }> };
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.value?.metadata?.phone_number_id !== config.outreach.phoneNumberId) continue;
        for (const message of change.value?.messages ?? []) {
          if (message.from && /^\d{8,15}$/.test(message.from)) await markOutreachReply(message.from);
        }
      }
    }
    return res.sendStatus(200);
  } catch { return res.sendStatus(400); }
});
