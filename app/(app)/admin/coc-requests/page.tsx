'use client';

import { useState } from 'react';
import { Check, X, FileText, Clock, AlertCircle } from 'lucide-react';
import { useCocRequests, reviewCocRequest } from '@/lib/api';
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

    const handleReview = async (id: string, action: 'approve' | 'reject') => {
        setError(null);
        setBusyId(id);
        try {
            await reviewCocRequest(id, action);
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
                <div className="flex items-center gap-2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="border border-gray-200 bg-white shadow-sm">
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
                                    <div className="flex shrink-0 items-center gap-2">
                                        <button
                                            onClick={() => handleReview(request.id, 'approve')}
                                            disabled={busyId === request.id}
                                            className="inline-flex items-center gap-1.5 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <Check className="h-3.5 w-3.5" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleReview(request.id, 'reject')}
                                            disabled={busyId === request.id}
                                            className="inline-flex items-center gap-1.5 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                        >
                                            <X className="h-3.5 w-3.5" /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-900">Reviewed ({reviewed.length})</h2>
                </div>
                {reviewed.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">No reviewed requests yet.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {reviewed.map(request => (
                            <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-900">{request.clientName}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {request.certificateNumber} · {request.technicianName} · reviewed by {request.reviewedBy}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <span className={`border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLE[request.status]}`}>
                                        {request.status}
                                    </span>
                                    {request.status === 'approved' && <CocPdfButton request={request} />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
