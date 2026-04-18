import { createHmac, timingSafeEqual } from 'crypto';
import type { SessionPayload } from './auth-edge';

export type { SessionPayload };

const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-me-in-prod';
const SESSION_COOKIE = 'coolpro_session';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function base64urlEncode(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function base64urlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

export function signSession(payload: Omit<SessionPayload, 'exp'>): string {
  const full: SessionPayload = { ...payload, exp: Date.now() + MAX_AGE_MS };
  const header = base64urlEncode(JSON.stringify(full));
  const sig = createHmac('sha256', SECRET).update(header).digest('base64url');
  return `${header}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const header = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac('sha256', SECRET).update(header).digest('base64url');
    if (!timingSafeEqual(Buffer.from(sig, 'base64url'), Buffer.from(expected, 'base64url'))) return null;
    const payload = JSON.parse(base64urlDecode(header)) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readSessionFromRequest(req: Request): SessionPayload | null {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const token = match.slice(SESSION_COOKIE.length + 1);
  return verifySession(token);
}

export function requireRole(req: Request, allowedRoles: string[]): SessionPayload {
  const session = readSessionFromRequest(req);
  if (!session) throw new Response('Unauthorized', { status: 401 });
  if (!allowedRoles.includes(session.role)) throw new Response('Forbidden', { status: 403 });
  return session;
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
