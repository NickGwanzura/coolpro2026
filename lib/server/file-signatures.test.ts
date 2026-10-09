import { describe, expect, it } from 'vitest';
import { matchesDeclaredType } from './file-signatures';

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

describe('matchesDeclaredType', () => {
  it('accepts files whose leading bytes match the declared type', () => {
    expect(matchesDeclaredType(text('%PDF-1.7 ...'), 'application/pdf')).toBe(true);
    expect(matchesDeclaredType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0), 'image/png')).toBe(true);
    expect(matchesDeclaredType(bytes(0xff, 0xd8, 0xff, 0xe0), 'image/jpeg')).toBe(true);
    expect(matchesDeclaredType(text('RIFF\u0000\u0000\u0000\u0000WEBPVP8 '), 'image/webp')).toBe(true);
    expect(matchesDeclaredType(text('\u0000\u0000\u0000\u0018ftypmp42'), 'video/mp4')).toBe(true);
    expect(matchesDeclaredType(bytes(0x1a, 0x45, 0xdf, 0xa3, 1), 'video/webm')).toBe(true);
    expect(matchesDeclaredType(bytes(0x50, 0x4b, 0x03, 0x04), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
    expect(matchesDeclaredType(bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1), 'application/msword')).toBe(true);
    expect(matchesDeclaredType(text('name,score\nA,1'), 'text/csv')).toBe(true);
  });

  it('rejects an executable or script labelled as something safe', () => {
    const windowsExe = text('MZ\u0090\u0000\u0003');
    const shellScript = text('#!/bin/sh\nrm -rf /');
    expect(matchesDeclaredType(windowsExe, 'application/pdf')).toBe(false);
    expect(matchesDeclaredType(windowsExe, 'image/png')).toBe(false);
    expect(matchesDeclaredType(shellScript, 'application/pdf')).toBe(false);
    expect(matchesDeclaredType(windowsExe, 'text/plain')).toBe(false);
  });

  it('rejects mismatched pairs, empty files and unknown types', () => {
    expect(matchesDeclaredType(text('%PDF-1.7'), 'image/png')).toBe(false);
    expect(matchesDeclaredType(new Uint8Array(), 'application/pdf')).toBe(false);
    expect(matchesDeclaredType(new Uint8Array(), 'text/plain')).toBe(false);
    expect(matchesDeclaredType(text('%PDF-1.7'), 'text/html')).toBe(false);
  });
});
