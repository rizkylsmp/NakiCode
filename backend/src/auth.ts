import crypto from 'crypto';
import { promisify } from 'util';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config';

export type UserRole = 'user' | 'admin';

const scryptAsync = promisify(crypto.scrypt);

export type UserTokenPayload = {
  sub: string;
  userId: number;
  role: UserRole;
  exp: number;
};

type TokenPayload = UserTokenPayload;

export function createUserToken(user: {
  id: number;
  username: string;
  role?: UserRole;
}) {
  const payload: UserTokenPayload = {
    sub: user.username,
    userId: user.id,
    role: user.role ?? 'user',
    exp: Math.floor(Date.now() / 1000) + config.auth.tokenTtlSeconds,
  };

  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(body);

  return `${body}.${signature}`;
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = (await scryptAsync(password, salt, 64) as Buffer).toString('base64url');

  return `scrypt:${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(':');

  if (algorithm !== 'scrypt' || !salt || !hash) {
    return false;
  }

  const candidate = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, 'base64url');

  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

export function verifyAdminToken(token: string) {
  const payload = verifyToken(token);

  if (!payload || payload.role !== 'admin') {
    return null;
  }

  return payload;
}

export function verifyUserToken(token: string) {
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  return payload;
}

function verifyToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const [body, signature] = token.split('.');

  if (!body || !signature || !safeEqual(signature, sign(body))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as TokenPayload;

    if (
      !['admin', 'user'].includes(payload.role) ||
      typeof payload.userId !== 'number' ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  const token = request.header('authorization')?.replace(/^Bearer\s+/i, '');
  const payload = token ? verifyAdminToken(token) : null;

  if (!payload) {
    response.status(401).json({ message: 'Admin authorization required' });
    return;
  }

  response.locals.admin = payload;
  next();
}

export function requireUser(request: Request, response: Response, next: NextFunction) {
  const token = request.header('authorization')?.replace(/^Bearer\s+/i, '');
  const payload = token ? verifyUserToken(token) : null;

  if (!payload) {
    response.status(401).json({ message: 'User authorization required' });
    return;
  }

  response.locals.user = payload;
  next();
}

function sign(value: string) {
  return crypto
    .createHmac('sha256', config.auth.tokenSecret)
    .update(value)
    .digest('base64url');
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}
