'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
    useReorders,
    hevacrazApproveReorder,
    hevacrazRejectReorder,
    nouApproveReorder,
    nouRejectReorder,
} from '@/lib/api';
import type { SupplierReorder, ReorderStatus } from '@/lib/platformStore';

const STATUS_LABEL: Record<ReorderStatus, string> = {
    pending_hevacraz: 'Pending HEVACRAZ',
    pending_nou: 'Pending NOU',
    approved: 'Approved',
    rejected: 'Rejected',
};

const STATUS_STYLE: Record<ReorderStatus, string> = {
    pending_hevacraz: 'bg-amber-50 text-amber-700 border-amber-200',
    pending_nou: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function Badge({ status }: { status: ReorderStatus }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${STATUS_STYLE[status]}`}>
            {STATUS_LABEL[status]}
        </span>
    );
}

function RejectModal({
    reorderGas,
    onConfirm,
    onCancel,
}: {
    reorderGas: string;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}) {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md border border-gray-200 bg-white p-6 shadow-xl">
                <h3 className="text-base font-semibold text-gray-900">Reject reorder: {reorderGas}</h3>
                <p className="mt-2 text-sm text-gray-500">Provide a reason. This will be visible to the vendor.</p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={4}
                    placeholder="Rejection reason..."
                    className="mt-4 w-full border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="mt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (reason.trim()) onConfirm(reason.trim());
                        }}
                        disabled={!reason.trim()}
                        className="bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                        Confirm rejection
                    </button>
                </div>
            </div>
        </div>
    );
}

function ReorderRow({
    reorder,
    actions,
}: {
    reorder: SupplierReorder;
    actions?: React.ReactNode;
}) {
    return (
        <div className="border border-gray-200 bg-gray-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">{reorder.vendorName}</span>
                        <span className="text-sm font-semibold text-blue-700">{reorder.gasType}</span>
                        <span className="text-sm text-gray-600">{reorder.quantityKg} kg</span>
                        <Badge status={reorder.status} />
                    </div>
                    <p className="text-sm text-gray-600">{reorder.purpose}</p>
                    {reorder.supplierNotes && (
                        <p className="text-xs text-gray-400 italic">Note: {reorder.supplierNotes}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-1">
                        <span>Submitted {formatDate(reorder.createdAt)}</span>
                        {reorder.hevacrazReviewedAt && (
                            <span>HEVACRAZ reviewed {formatDate(reorder.hevacrazReviewedAt)}</span>
                        )}
                        {reorder.nouReviewedAt && (
                            <span>NOU reviewed {formatDate(reorder.nouReviewedAt)}</span>
                        )}
                    </div>
                    {reorder.status === 'rejected' && reorder.rejectionReason && (
                        <div className="mt-2 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                            <span className="font-semibold">Rejected by {reorder.rejectedBy === 'hevacraz' ? 'HEVACRAZ' : 'NOU'}:</span> {reorder.rejectionReason}
                        </div>
                    )}
                </div>

                {actions && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ApprovalsPage() {
    const { user: session, isLoading } = useAuth();
    const { data: reorders, error } = useReorders();

    const [rejectTarget, setRejectTarget] = useState<{ id: string; gas: string; role: 'hevacraz' | 'nou' } | null>(null);
    const [acting, setActing] = useState(false);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!session || (session.role !== 'org_admin' && session.role !== 'regulator')) {
        return (
            <div className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                Access restricted. This page is for HEVACRAZ (org_admin) and NOU (regulator) reviewers only.
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-sm text-red-600">Failed to load. {error.message}</div>;
    }

    if (reorders === undefined) {
        return <div className="p-8 text-sm text-slate-500">Loading...</div>;
    }

    const isHevacraz = session.role === 'org_admin';
    const isNou = session.role === 'regulator';

    async function handleHevacrazApprove(id: string) {
        setActing(true);
        try {
            await hevacrazApproveReorder(id);
        } finally {
            setActing(false);
        }
    }

    async function handleNouApprove(id: string) {
        setActing(true);
        try {
            await nouApproveReorder(id);
        } finally {
            setActing(false);
        }
    }

    async function handleRejectConfirm(reason: string) {
        if (!rejectTarget) return;
        setActing(true);
        try {
            if (rejectTarget.role === 'hevacraz') {
                await hevacrazRejectReorder(rejectTarget.id, reason);
            } else {
                await nouRejectReorder(rejectTarget.id, reason);
            }
        } finally {
            setRejectTarget(null);
            setActing(false);
        }
    }

    const pendingHevacraz = reorders.filter(r => r.status === 'pending_hevacraz');
    const pendingNou = reorders.filter(r => r.status === 'pending_nou');
    const history = reorders.filter(r => r.status === 'approved' || r.status === 'rejected');

    return (
        <div className="space-y-8">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                        {isHevacraz ? 'HEVACRAZ admin' : 'NOU regulator'}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">Gas Reorder Approvals</h1>
                    <p className="max-w-2xl text-sm leading-6 text-gray-600">
                        {isHevacraz
                            ? 'Review vendor reorder requests. Approved requests move to NOU for final sign-off.'
                            : 'Review requests that have passed HEVACRAZ review. Your approval is the final step.'}
                    </p>
                </div>
            </div>

            {isHevacraz && (
                <div className="border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Pending HEVACRAZ review</h2>
                            <p className="mt-1 text-sm text-gray-500">{pendingHevacraz.length} request{pendingHevacraz.length !== 1 ? 's' : ''} awaiting your review</p>
                        </div>
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${pendingHevacraz.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                            {pendingHevacraz.length}
                        </span>
                    </div>

                    {pendingHevacraz.length === 0 ? (
                        <div className="mt-6 border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                            No pending requests at this stage.
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {pendingHevacraz.map(reorder => (
                                <ReorderRow
                                    key={reorder.id}
                                    reorder={reorder}
                                    actions={
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleHevacrazApprove(reorder.id)}
                                                disabled={acting}
                                                className="inline-flex items-center gap-1.5 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                            >
                                                Approve send to NOU
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRejectTarget({ id: reorder.id, gas: reorder.gasType, role: 'hevacraz' })}
                                                disabled={acting}
                                                className="inline-flex items-center gap-1.5 border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isNou && (
                <div className="border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Pending NOU review</h2>
                            <p className="mt-1 text-sm text-gray-500">{pendingNou.length} request{pendingNou.length !== 1 ? 's' : ''} approved by HEVACRAZ and awaiting NOU sign-off</p>
                        </div>
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${pendingNou.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {pendingNou.length}
                        </span>
                    </div>

                    {pendingNou.length === 0 ? (
                        <div className="mt-6 border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                            No requests awaiting NOU review at this time.
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {pendingNou.map(reorder => (
                                <ReorderRow
                                    key={reorder.id}
                                    reorder={reorder}
                                    actions={
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleNouApprove(reorder.id)}
                                                disabled={acting}
                                                className="inline-flex items-center gap-1.5 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRejectTarget({ id: reorder.id, gas: reorder.gasType, role: 'nou' })}
                                                disabled={acting}
                                                className="inline-flex items-center gap-1.5 border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isHevacraz && pendingNou.length > 0 && (
                <div className="border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-900">Pending NOU review (read-only)</h2>
                    <p className="mt-1 text-sm text-gray-500">These requests have been approved by HEVACRAZ and are waiting for NOU sign-off.</p>
                    <div className="mt-6 space-y-4">
                        {pendingNou.map(reorder => (
                            <ReorderRow key={reorder.id} reorder={reorder} />
                        ))}
                    </div>
                </div>
            )}

            <div className="border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">Completed reorders</h2>
                <p className="mt-1 text-sm text-gray-500">{history.length} completed (approved + rejected) across all vendors</p>

                {history.length === 0 ? (
                    <div className="mt-6 border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                        No completed reorders yet.
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {history.map(reorder => (
                            <ReorderRow key={reorder.id} reorder={reorder} />
                        ))}
                    </div>
                )}
            </div>

            {rejectTarget && (
                <RejectModal
                    reorderGas={rejectTarget.gas}
                    onConfirm={handleRejectConfirm}
                    onCancel={() => setRejectTarget(null)}
                />
            )}
        </div>
    );
}
