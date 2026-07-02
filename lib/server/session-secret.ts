const DEV_FALLBACK_SECRET = 'dev-secret-change-me-in-prod';

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET environment variable must be set in production. Refusing to start with a known, publicly-visible fallback secret.',
    );
  }

  console.warn(
    '[auth] SESSION_SECRET is not set — using an insecure development fallback. Set SESSION_SECRET before deploying.',
  );
  return DEV_FALLBACK_SECRET;
}
