'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Trash2, UploadCloud } from 'lucide-react';
import {
  checkDocumentFile,
  DOCUMENT_ACCEPT,
  MAX_DOCUMENT_BYTES,
} from '@/lib/application-documents';

interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Lets an applicant attach proof documents (ID, certificates, licences) to their application. The
 * token from their confirmation email proves the application is theirs, so no login is needed.
 */
export function ApplicationDocumentsPanel({ token }: { token: string }) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [limit, setLimit] = useState(4);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/applications/documents/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = (await res.json().catch(() => ({}))) as { documents?: UploadedDocument[]; limit?: number; hint?: string; error?: string };
      if (!res.ok) {
        setMessage({ tone: 'error', text: body.error ?? 'Could not load your documents.' });
      } else {
        setDocuments(body.documents ?? []);
        setLimit(body.limit ?? 4);
        setHint(body.hint ?? '');
      }
    } catch {
      setMessage({ tone: 'error', text: 'Could not load your documents. Check your connection and refresh.' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setMessage(null);
    setBusy(true);
    let added = 0;
    for (const file of Array.from(files)) {
      const problem = checkDocumentFile({ name: file.name, type: file.type, size: file.size });
      if (problem) {
        setMessage({ tone: 'error', text: `${file.name}: ${problem}` });
        continue;
      }
      const form = new FormData();
      form.set('token', token);
      form.set('file', file);
      try {
        const res = await fetch('/api/applications/documents', { method: 'POST', body: form });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setMessage({ tone: 'error', text: `${file.name}: ${body.error ?? 'Upload failed.'}` });
          break;
        }
        added += 1;
      } catch {
        setMessage({ tone: 'error', text: `${file.name}: upload failed. Check your connection and try again.` });
        break;
      }
    }
    if (inputRef.current) inputRef.current.value = '';
    await load();
    if (added > 0) setMessage((current) => current ?? { tone: 'ok', text: `${added} document${added === 1 ? '' : 's'} added.` });
    setBusy(false);
  }

  async function handleRemove(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/applications/documents/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id }),
      });
      if (!res.ok) setMessage({ tone: 'error', text: 'Could not remove that document.' });
    } finally {
      await load();
      setBusy(false);
    }
  }

  const full = documents.length >= limit;

  return (
    <section className="mt-6 border-t border-[#E5E0DB] pt-6 text-left" aria-labelledby="documents-heading">
      <h2 id="documents-heading" className="text-base font-bold text-[#1C1917]">Add your supporting documents</h2>
      <p className="mt-1 text-sm leading-6 text-gray-600">
        {hint || 'Reviewers look at these to verify your application.'} PDF, JPG or PNG, up to {MAX_DOCUMENT_BYTES / 1024 / 1024} MB each, {limit} files at most. You can come back to this page from your confirmation email any time before a decision is made.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          {documents.length > 0 && (
            <ul className="mt-4 space-y-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E0DB] bg-[#FAFAF9] px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-[#1C1917]">
                    <FileText className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                    <span className="truncate">{doc.fileName}</span>
                    <span className="shrink-0 text-xs text-gray-500">{formatSize(doc.sizeBytes)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(doc.id)}
                    disabled={busy}
                    className="shrink-0 text-gray-400 transition hover:text-rose-600 disabled:opacity-50"
                    aria-label={`Remove ${doc.fileName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition ${
              full || busy ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400' : 'border-[#D6D3D1] text-gray-600 hover:border-[#D97706] hover:bg-amber-50'
            }`}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
            <span className="font-semibold">{full ? 'You have added the maximum number of files' : busy ? 'Uploading…' : 'Choose files to upload'}</span>
            <input
              ref={inputRef}
              type="file"
              accept={DOCUMENT_ACCEPT}
              multiple
              disabled={full || busy}
              onChange={(e) => void handleFiles(e.target.files)}
              className="sr-only"
            />
          </label>
        </>
      )}

      {message && (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={`mt-3 text-sm ${message.tone === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
