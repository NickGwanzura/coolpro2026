// Content check for uploaded course materials. The declared MIME type comes from the browser, so
// after upload we read the first bytes of the stored file and confirm they match that type. This
// stops an executable or script being uploaded under a PDF or image label. It is not a virus scan.

export const SIGNATURE_BYTES_NEEDED = 16;

type Check = (head: Uint8Array) => boolean;

function startsWith(head: Uint8Array, bytes: number[], offset = 0): boolean {
  if (head.length < offset + bytes.length) return false;
  return bytes.every((byte, i) => head[offset + i] === byte);
}

const ascii = (text: string) => Array.from(text, (ch) => ch.charCodeAt(0));

const ZIP: Check = (head) => startsWith(head, [0x50, 0x4b, 0x03, 0x04]);
const OLE: Check = (head) => startsWith(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
// Plain text and CSV have no signature; they must simply contain no NUL bytes (binary content).
const TEXT: Check = (head) => head.length > 0 && !head.includes(0x00);

const CHECKS: Record<string, Check> = {
  'application/pdf': (head) => startsWith(head, ascii('%PDF-')),
  'image/png': (head) => startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/jpeg': (head) => startsWith(head, [0xff, 0xd8, 0xff]),
  'image/webp': (head) => startsWith(head, ascii('RIFF')) && startsWith(head, ascii('WEBP'), 8),
  'video/mp4': (head) => startsWith(head, ascii('ftyp'), 4),
  'video/webm': (head) => startsWith(head, [0x1a, 0x45, 0xdf, 0xa3]),
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ZIP,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ZIP,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ZIP,
  'application/msword': OLE,
  'application/vnd.ms-powerpoint': OLE,
  'application/vnd.ms-excel': OLE,
  'text/plain': TEXT,
  'text/csv': TEXT,
};

/** True when the file's leading bytes are consistent with the declared type. Unknown types fail. */
export function matchesDeclaredType(head: Uint8Array, mimeType: string): boolean {
  const check = CHECKS[mimeType];
  return check ? check(head) : false;
}
