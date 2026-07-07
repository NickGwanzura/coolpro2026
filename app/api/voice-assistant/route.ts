import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { VALID_ROLES } from '@/lib/roles';
import { getVoiceAssistantResponse, type ChatTurn } from '@/services/gemini';

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const MAX_HISTORY_TURNS = 6;

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, [...VALID_ROLES]);
  } catch (e) {
    return e as Response;
  }

  if (!checkRateLimit(`voice-assistant:${session.id}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as { message?: string; history?: ChatTurn[] };
  if (!body.message || typeof body.message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_TURNS) : [];
  const answer = await getVoiceAssistantResponse(body.message, history);

  if (answer === null) {
    return NextResponse.json({ answer: null, fallback: true });
  }

  return NextResponse.json({ answer, fallback: false });
}
