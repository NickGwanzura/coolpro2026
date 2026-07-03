/**
 * Canonical site origin, used as a fallback when `window` isn't available (SSR/first paint).
 * Override via NEXT_PUBLIC_SITE_URL if this app is ever deployed under a different domain
 * (staging, a rename, etc.) without needing a code change.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zimhvacregistry.org';
