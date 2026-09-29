import { config } from './config';
import { claimOutreachLead, findOutreachLead, finishOutreachSend } from './models/outreach.model';

export async function sendOutreachTemplate(id: number) {
  if (!config.outreach.accessToken || !config.outreach.phoneNumberId || !config.outreach.template) {
    throw new Error('WhatsApp Cloud API belum dikonfigurasi.');
  }
  if (!(await claimOutreachLead(id))) {
    throw new Error('Hanya kontak siap kirim dengan bukti opt-in yang dapat dikirim.');
  }
  try {
    const lead = await findOutreachLead(id);
    if (!lead?.whatsapp_number) throw new Error('Nomor WhatsApp tidak tersedia.');
    const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(config.outreach.phoneNumberId)}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.outreach.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: lead.whatsapp_number.replace(/\D/g, ''), type: 'template', template: { name: config.outreach.template, language: { code: config.outreach.templateLanguage } } }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`WhatsApp API HTTP ${response.status}`);
    await finishOutreachSend(id);
    return await findOutreachLead(id);
  } catch (error) {
    await finishOutreachSend(id, error instanceof Error ? error.message.slice(0, 500) : 'Pengiriman gagal');
    throw error;
  }
}
