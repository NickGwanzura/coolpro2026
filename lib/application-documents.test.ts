import { describe, expect, it } from 'vitest';
import {
  checkDocumentFile,
  documentSlotsLeft,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENTS_PER_APPLICATION,
  PROOF_HINTS,
  safeDocumentName,
} from './application-documents';
import { APPLICANT_ROLES } from './application-roles';

describe('checkDocumentFile', () => {
  it('accepts a PDF, JPG or PNG within the size limit', () => {
    for (const type of ['application/pdf', 'image/jpeg', 'image/png']) {
      expect(checkDocumentFile({ name: 'id.pdf', type, size: 1000 })).toBeNull();
    }
    expect(checkDocumentFile({ name: 'big.pdf', type: 'application/pdf', size: MAX_DOCUMENT_BYTES })).toBeNull();
  });

  it('rejects other types, empty and oversized files', () => {
    expect(checkDocumentFile({ name: 'a.exe', type: 'application/x-msdownload', size: 10 })).toMatch(/PDF, JPG or PNG/);
    expect(checkDocumentFile({ name: 'a.html', type: 'text/html', size: 10 })).toMatch(/PDF, JPG or PNG/);
    expect(checkDocumentFile({ name: 'a.pdf', type: 'application/pdf', size: 0 })).toMatch(/empty/);
    expect(checkDocumentFile({ name: 'a.pdf', type: 'application/pdf', size: MAX_DOCUMENT_BYTES + 1 })).toMatch(/5 MB/);
    expect(checkDocumentFile({ name: '  ', type: 'application/pdf', size: 10 })).toMatch(/no name/);
  });
});

describe('safeDocumentName', () => {
  it('drops folders and unsafe characters', () => {
    expect(safeDocumentName('C:\\Users\\me\\ID card.pdf')).toBe('ID card.pdf');
    expect(safeDocumentName('../../etc/passwd')).toBe('passwd');
    expect(safeDocumentName('a"b<c>.pdf')).toBe('abc.pdf');
  });

  it('keeps the extension when shortening very long names', () => {
    const name = safeDocumentName(`${'x'.repeat(300)}.pdf`);
    expect(name.length).toBeLessThanOrEqual(120);
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('never returns an empty name', () => {
    expect(safeDocumentName('')).toBe('document');
    expect(safeDocumentName('///')).toBe('document');
  });
});

describe('document limits', () => {
  it('counts the slots left', () => {
    expect(documentSlotsLeft(0)).toBe(MAX_DOCUMENTS_PER_APPLICATION);
    expect(documentSlotsLeft(MAX_DOCUMENTS_PER_APPLICATION)).toBe(0);
    expect(documentSlotsLeft(99)).toBe(0);
  });

  it('has a proof hint for every role', () => {
    for (const role of Object.keys(APPLICANT_ROLES)) {
      expect(PROOF_HINTS[role as keyof typeof PROOF_HINTS]).toBeTruthy();
    }
  });
});
