'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
    useReorders,
    createReorder,
} from '@/lib/api';
import type { SupplierReorder, ReorderStatus } from '@/lib/platformStore';

const GAS_TYPES = ['R-410A', 'R-32', 'R-22', 'R-134a', 'R-404A', 'R-290', 'R-600a', 'R-744'] as const;

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

export default function ReorderPage() {
    const { user: session, isLoading } = useAuth();
    const { data: reorders, error } = useReorders();

    const [gasType, setGasType] = useState<string>(GAS_TYPES[0]);
    const [quantityKg, setQuantityKg] = useState<string>('');
    const [purpose, setPurpose] = useState('');
    const [supplierNotes, setSupplierNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!session || session.role !== 'vendor') {
        return (
            <div className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                Access restricted. This page is for vendors only.
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-sm text-red-600">Failed to load. {error.message}</div>;
    }

    function validate() {
        const next: Record<string, string> = {};
        if (!gasType) next.gasType = 'Select a gas type.';
        const qty = parseFloat(quantityKg);
        if (!quantityKg || isNaN(qty) || qty <= 0) next.quantityKg = 'Enter a valid quantity greater than zero.';
        if (!purpose.trim()) next.purpose = 'Provide a purpose for this reorder.';
        return next;
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});
        setSubmitting(true);

        try {
            await createReorder({
                gasType,
                quantityKg: parseFloat(quantityKg),
                purpose: purpose.trim(),
                supplierNotes: supplierNotes.trim(),
            });
            setGasType(GAS_TYPES[0]);
            setQuantityKg('');
            setPurpose('');
            setSupplierNotes('');
            setSuccessMsg('Reorder request submitted. Status: Pending HEVACRAZ review.');
            setTimeout(() => setSuccessMsg(''), 6000);
        } catch (err) {
            setErrors({ submit: (err as Error).message });
        } finally {
            setSubmitting(false);
        }
    }

    const myReorders: SupplierReorder[] = reorders ?? [];

    return (
        <div className="space-y-8">
            <div className="border border-gray-200 bg-white p-6 shadow-sm">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Vendor workspace</p>
                    <h1 className="text-2xl font-bold text-gray-900">Gas Reorder Requests</h1>
                    <p className="max-w-2xl text-sm leading-6 text-gray-600">
                        Submit a refrigerant reorder request. Each request goes through HEVACRAZ review, then NOU approval before it is cleared.
                    </p>
                </div>
            </div>

            <div className="border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">Submit reorder request</h2>
                <p className="mt-1 text-sm text-gray-500">All fields except supplier notes are required.</p>

                {successMsg && (
                    <div className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        {successMsg}
                    </div>
                )}

                {errors.submit && (
                    <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Gas type
                        </label>
                        <select
                            value={gasType}
                            onChange={e => setGasType(e.target.value)}
                            className="mt-2 w-full border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {GAS_TYPES.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                        {errors.gasType && <p className="mt-1 text-xs text-rose-600">{errors.gasType}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Quantity (kg)
                        </label>
                        <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={quantityKg}
                            onChange={e => setQuantityKg(e.target.value)}
                            placeholder="e.g. 50"
                            className="mt-2 w-full border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {errors.quantityKg && <p className="mt-1 text-xs text-rose-600">{errors.quantityKg}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Purpose
                        </label>
                        <input
                            type="text"
                            value={purpose}
                            onChange={e => setPurpose(e.target.value)}
                            placeholder="Brief description of intended use"
                            className="mt-2 w-full border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {errors.purpose && <p className="mt-1 text-xs text-rose-600">{errors.purpose}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Supplier notes <span className="normal-case font-normal text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            value={supplierNotes}
                            onChange={e => setSupplierNotes(e.target.value)}
                            rows={3}
                            placeholder="Any additional notes for the reviewer"
                            className="mt-2 w-full border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                            {submitting ? 'Submitting...' : 'Submit reorder request'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">Your reorder history</h2>
                <p className="mt-1 text-sm text-gray-500">{myReorders.length} request{myReorders.length !== 1 ? 's' : ''} linked to your account.</p>

                {myReorders === undefined ? (
                    <div className="p-8 text-sm text-slate-500">Loading...</div>
                ) : myReorders.length === 0 ? (
                    <div className="mt-6 border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                        No reorder requests yet. Submit your first request above.
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {myReorders.map(reorder => (
                            <div key={reorder.id} className="border border-gray-200 bg-gray-50 p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="text-sm font-bold text-gray-900">{reorder.gasType}</span>
                                            <span className="text-sm text-gray-600">{reorder.quantityKg} kg</span>
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${STATUS_STYLE[reorder.status]}`}>
                                                {STATUS_LABEL[reorder.status]}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{reorder.purpose}</p>
                                        {reorder.supplierNotes && (
                                            <p className="text-xs text-gray-400 italic">Note: {reorder.supplierNotes}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        Submitted {formatDate(reorder.createdAt)}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                                    <span>
                                        <span className="font-semibold text-gray-700">Submitted:</span> {formatDate(reorder.createdAt)}
                                    </span>
                                    {reorder.hevacrazReviewedAt && (
                                        <span>
                                            <span className="font-semibold text-gray-700">HEVACRAZ reviewed:</span> {formatDate(reorder.hevacrazReviewedAt)}
                                        </span>
                                    )}
                                    {reorder.nouReviewedAt && (
                                        <span>
                                            <span className="font-semibold text-gray-700">NOU reviewed:</span> {formatDate(reorder.nouReviewedAt)}
                                        </span>
                                    )}
                                </div>

                                {reorder.status === 'rejected' && reorder.rejectionReason && (
                                    <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        <span className="font-semibold">Rejection reason</span>
                                        {reorder.rejectedBy && (
                                            <span className="ml-1 text-xs text-rose-500">({reorder.rejectedBy === 'hevacraz' ? 'HEVACRAZ' : 'NOU'})</span>
                                        )}
                                        : {reorder.rejectionReason}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
