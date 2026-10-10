// Placeholder addresses that can never receive mail. Sending to them only produces bounces, which
// hurts the sender's reputation with Gmail and others. Pure, so it can be tested.

const RESERVED_SUFFIXES = ['.demo', '.test', '.example', '.invalid', '.localhost'];
const RESERVED_DOMAINS = ['example.com', 'example.org', 'example.net'];

export function isUndeliverableAddress(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1] ?? '';
  if (!domain || !domain.includes('.')) return true;
  return RESERVED_DOMAINS.includes(domain) || RESERVED_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}
