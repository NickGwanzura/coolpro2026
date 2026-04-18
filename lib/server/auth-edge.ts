export interface SessionPayload {
  id: string;
  role: string;
  email: string;
  name: string;
  region: string;
  exp: number;
}

const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-me-in-prod';

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - (str.length % 4)) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function importKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signSessionEdge(payload: SessionPayload): Promise<string> {
  const enc = new TextEncoder();
  const header = base64urlEncode(enc.encode(JSON.stringify(payload)).buffer as ArrayBuffer);
  const key = await importKey();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(header));
  return `${header}.${base64urlEncode(sig)}`;
}

export async function verifySessionEdge(token: string): Promise<SessionPayload | null> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const header = token.slice(0, dot);
    const sigStr = token.slice(dot + 1);
    const enc = new TextEncoder();
    const key = await importKey();
    const valid = await crypto.subtle.verify('HMAC', key, base64urlDecode(sigStr).buffer as ArrayBuffer, enc.encode(header));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(header))) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function readSessionFromRequestEdge(req: Request): Promise<SessionPayload | null> {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('coolpro_session='));
  if (!match) return null;
  const token = match.slice('coolpro_session='.length);
  return verifySessionEdge(token);
}
