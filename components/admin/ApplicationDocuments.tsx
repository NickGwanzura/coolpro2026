'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { FileText, Paperclip } from 'lucide-react';

interface DocumentSummary {
  id: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
}

const fetcher = async (url: string): Promise<DocumentSummary[]> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Could not load documents.');
  return res.json();
};

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Shows the proof documents an applicant uploaded, with a download link for each. */
export function ApplicationDocuments({
  entityType,
  entityId,
}: {
  entityType: 'technician_application' | 'student_application' | 'supplier_application' | 'registration_application';
  entityId: string;
}) {
  const [open, setOpen] = useState(false);
  const { data, error } = useSWR(
    open ? `/api/admin/application-documents?entityType=${entityType}&entityId=${entityId}` : null,
    fetcher,
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
      >
        <Paperclip className="h-3.5 w-3.5" />
        {open ? 'Hide documents' : 'View uploaded documents'}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {error && <p className="text-xs text-rose-600">{error.message}</p>}
          {!data && !error && <p className="text-xs text-gray-500">Loading…</p>}
          {data && data.length === 0 && <p className="text-xs text-gray-500">The applicant has not uploaded any documents.</p>}
          {data?.map((doc) => (
            <a
              key={doc.id}
              href={`/api/admin/application-documents/${doc.id}`}
              className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-800 hover:border-blue-300 hover:bg-white"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{doc.fileName}</span>
              <span className="ml-auto shrink-0 text-gray-500">{formatSize(doc.sizeBytes)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
