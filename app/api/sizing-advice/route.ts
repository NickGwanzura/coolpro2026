import { NextResponse } from 'next/server';
import { readSessionFromRequest } from '@/lib/server/auth';
import { getTechnicalAdvice } from '@/services/groq';

export async function POST(req: Request) {
  if (!readSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { prompt?: string };
  if (!body.prompt || typeof body.prompt !== 'string') {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const advice = await getTechnicalAdvice(body.prompt);
  return NextResponse.json({ advice });
}
