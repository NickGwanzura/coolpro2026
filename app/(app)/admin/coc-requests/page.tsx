'use client';

import { useState } from 'react';
import { Check, X, FileText, Clock, AlertCircle, ChevronDown, Image as ImageIcon, ListChecks } from 'lucide-react';
import { useCocRequests, reviewCocRequest } from '@/lib/api';
import type { CocRequest } from '@/types/index';
import { CocPdfButton } from '@/components/CocPdfButton';

const STATUS_STYLE: Record<string, string> = {
    submitted: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export default function AdminCocRequestsPage() {
    const { data: requests, isLoading } = useCocRequests();
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectNote, setRejectNote] = useState('');

    const handleReview = async (id: string, action: 'approve' | 'reject', notes?: string) => {
        setError(null);
        if (action === 'reject' && !notes?.trim()) {
            setError('A rejection note is required so the technician knows what to correct.');
            return;
        }
        setBusyId(id);
        try {
            await reviewCocRequest(id, action, notes);
            setRejectingId(null);
            setRejectNote('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update request');
        } finally {
            setBusyId(null);
        }
    };

    const pending = requests?.filter(r => r.status === 'submitted') ?? [];
    const reviewed = requests?.filter(r => r.status !== 'submitted') ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Certificate of Conformity Requests</h1>
                <p className="mt-1 text-gray-500">
                    Review technician-submitted installation compliance requests. Approving generates a
                    verifiable certificate with QR code.
                </p>
            </div>

            {error && (
                <div className="rounded-lg flex items-center gap-2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <h2 className="text-sm font-semibold text-gray-900">Pending review ({pending.length})</h2>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
                ) : pending.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No pending requests.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {pending.map(request => (
                            <div key={request.id} className="px-5 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900">{request.clientName}</p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {request.certificateNumber} · {request.technicianName} · {request.location}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-400">
                                            {request.equipmentType} {request.serialNumber ? `· S/N ${request.serialNumber}` : ''} · Submitted {formatDate(request.submittedAt)}
                                        </p>
                                        {request.details && (
                                            <p className="mt-2 max-w-xl text-xs text-gray-600">{request.details}</p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            <ChevronDown className={`h-3.5 w-3.5 transition ${expandedId === request.id ? 'rotate-180' : ''}`} />
                                            Review file
                                        </button>
                                        <button
                                            onClick={() => handleReview(request.id, 'approve')}
                                            disabled={busyId === request.id}
                                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <Check className="h-3.5 w-3.5" /> Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                setRejectingId(rejectingId === request.id ? null : request.id);
                                                setExpandedId(request.id);
                                            }}
                                            disabled={busyId === request.id}
                                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                        >
                                            <X className="h-3.5 w-3.5" /> Reject
                                        </button>
                                    </div>
                                </div>
                                {expandedId === request.id && (
                                    <CocReviewDrilldown
                                        request={request}
                                        rejecting={rejectingId === request.id}
                                        rejectNote={rejectNote}
                                        onRejectNoteChange={setRejectNote}
                                        onCancelReject={() => {
                                            setRejectingId(null);
                                            setRejectNote('');
                                        }}
                                        onConfirmReject={() => handleReview(request.id, 'reject', rejectNote)}
                                        busy={busyId === request.id}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-900">Reviewed ({reviewed.length})</h2>
                </div>
                {reviewed.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No reviewed requests yet.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {reviewed.map(request => (
                            <div key={request.id} className="px-5 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900">{request.clientName}</p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {request.certificateNumber} · {request.technicianName} · reviewed by {request.reviewedBy}
                                        </p>
                                        {request.reviewNote && (
                                            <p className="mt-1 text-xs text-rose-600">Review note: {request.reviewNote}</p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                        >
                                            <ChevronDown className={`h-3.5 w-3.5 transition ${expandedId === request.id ? 'rotate-180' : ''}`} />
                                            Details
                                        </button>
                                        <span className={`border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLE[request.status]}`}>
                                            {request.status}
                                        </span>
                                        {request.status === 'approved' && <CocPdfButton request={request} />}
                                    </div>
                                </div>
                                {expandedId === request.id && <CocReviewDrilldown request={request} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CocReviewDrilldown({
    request,
    rejecting = false,
    rejectNote = '',
    onRejectNoteChange,
    onCancelReject,
    onConfirmReject,
    busy,
}: {
    request: CocRequest;
    rejecting?: boolean;
    rejectNote?: string;
    onRejectNoteChange?: (value: string) => void;
    onCancelReject?: () => void;
    onConfirmReject?: () => void;
    busy?: boolean;
}) {
    const checked = request.checklistSnapshot?.items.filter(item => item.checked).length ?? 0;
    const total = request.checklistSnapshot?.items.length ?? 0;

    return (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-white bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Application drilldown</p>
                    <dl className="mt-3 space-y-2 text-sm">
                        <div><dt className="text-gray-400">Installation</dt><dd className="font-medium text-gray-900">{request.installationId ?? 'Manual COC request'}</dd></div>
                        <div><dt className="text-gray-400">Planner job</dt><dd className="font-medium text-gray-900">{request.plannerJobId ?? 'Not linked'}</dd></div>
                        <div><dt className="text-gray-400">Serial number</dt><dd className="font-medium text-gray-900">{request.serialNumber ?? 'Not provided'}</dd></div>
                        <div><dt className="text-gray-400">Compliance attestation</dt><dd className="font-medium text-gray-900">{request.complianceCheck ? 'Confirmed by technician' : 'Missing'}</dd></div>
                    </dl>
                </div>

                <div className="rounded-lg border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Checklist evidence</p>
                    </div>
                    {request.checklistSnapshot ? (
                        <div className="mt-3">
                            <p className="text-sm font-semibold text-gray-900">
                                {checked}/{total} checks completed · {request.checklistSnapshot.checklistType}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">Saved {formatDate(request.checklistSnapshot.completedAt)}</p>
                            <ul className="mt-3 max-h-36 space-y-1 overflow-auto text-xs text-gray-600">
                                {request.checklistSnapshot.items.slice(0, 12).map(item => (
                                    <li key={item.id} className={item.checked ? 'text-emerald-700' : 'text-gray-400'}>
                                        {item.checked ? '✓' : '○'} {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-amber-700">No checklist snapshot attached.</p>
                    )}
                </div>

                <div className="rounded-lg border border-white bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Evidence images</p>
                    </div>
                    {request.evidenceImages?.length ? (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {request.evidenceImages.slice(0, 6).map((image, index) => (
                                <img
                                    key={`${request.id}-evidence-${index}`}
                                    src={image}
                                    alt={`COC evidence ${index + 1}`}
                                    className="h-16 w-full rounded-lg border border-gray-200 object-cover"
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-gray-500">No evidence images attached.</p>
                    )}
                </div>
            </div>

            {request.details && (
                <div className="mt-4 rounded-lg border border-white bg-white p-4 text-sm text-gray-700 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Technician notes</p>
                    <p className="mt-2 whitespace-pre-wrap leading-6">{request.details}</p>
                </div>
            )}

            {rejecting && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-white p-4">
                    <label className="text-sm font-semibold text-gray-800" htmlFor={`reject-note-${request.id}`}>
                        Rejection note
                    </label>
                    <textarea
                        id={`reject-note-${request.id}`}
                        value={rejectNote}
                        onChange={(event) => onRejectNoteChange?.(event.target.value)}
                        className="mt-2 min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        placeholder="Explain what the technician must correct before resubmitting."
                    />
                    <div className="mt-3 flex justify-end gap-2">
                        <button type="button" onClick={onCancelReject} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="button" onClick={onConfirmReject} disabled={busy} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                            Confirm rejection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
