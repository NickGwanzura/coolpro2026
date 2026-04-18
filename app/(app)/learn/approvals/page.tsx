'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
    useCourses,
    approveCourse,
    rejectCourse,
    type ManagedCourse,
} from '@/lib/platformStore';
import { StatusBadge } from '@/components/ui/StatusBadge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
    return new Intl.DateTimeFormat('en-ZW', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

// ---------------------------------------------------------------------------
// Review panel
// ---------------------------------------------------------------------------

function ReviewPanel({
    course,
    canAct,
    onClose,
    onApproved,
    onRejected,
}: {
    course: ManagedCourse;
    canAct: boolean;
    onClose: () => void;
    onApproved: (updated: ManagedCourse) => void;
    onRejected: (updated: ManagedCourse) => void;
}) {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleApprove() {
        setSaving(true);
        try {
            const updated = await approveCourse(course.id);
            onApproved(updated);
            setNotice('Course approved.');
        } catch (err) {
            setNotice((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function handleReject() {
        if (!rejectReason.trim()) { setNotice('A rejection reason is required.'); return; }
        setSaving(true);
        try {
            const updated = await rejectCourse(course.id, rejectReason.trim());
            onRejected(updated);
            setNotice('Course rejected.');
        } catch (err) {
            setNotice((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Course Review</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">{course.title}</h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                        By {course.lecturerName} — submitted {formatDate(course.updatedAt)}
                    </p>
                </div>
                <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">Close</button>
            </div>

            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Description</p>
                    <p className="text-sm text-gray-700 leading-6">{course.description || <span className="italic text-gray-400">No description provided.</span>}</p>
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Modules ({course.modules.length})
                    </p>
                    {course.modules.map((mod, i) => (
                        <div key={i} className="border border-gray-200 bg-gray-50 p-4 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900">
                                    {i + 1}. {mod.title}
                                </p>
                                <span className="text-xs text-gray-400">{mod.minutes} min</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-6">{mod.content}</p>
                        </div>
                    ))}
                </div>

                {canAct && (
                    <div className="space-y-4 border-t border-gray-200 pt-5">
                        {!showRejectForm ? (
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleApprove}
                                    disabled={saving}
                                    className="bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRejectForm(true)}
                                    className="border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                    Reject
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                                    Rejection Reason (required)
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    rows={3}
                                    placeholder="Explain why this course is being rejected so the lecturer can revise it."
                                    className="w-full border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400"
                                />
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={handleReject}
                                        disabled={saving}
                                        className="bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                                    >
                                        Confirm Rejection
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                                        className="border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        {notice && (
                            <div className="border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{notice}</div>
                        )}
                    </div>
                )}

                {!canAct && (
                    <div className="border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        You have read-only access to course approvals. Only NOU regulators can approve or reject courses.
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LearnApprovalsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { data: allCourses, error } = useCourses();

    const [selected, setSelected] = useState<ManagedCourse | null>(null);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || (user.role !== 'regulator' && user.role !== 'org_admin')) {
        router.replace('/dashboard');
        return null;
    }

    if (error) {
        return <div className="p-8 text-sm text-red-600">Failed to load. {error.message}</div>;
    }

    if (allCourses === undefined) {
        return <div className="p-8 text-sm text-slate-500">Loading...</div>;
    }

    const courses = allCourses.filter(c => c.status === 'pending_nou');
    const canAct = user.role === 'regulator';

    function handleApproved(updated: ManagedCourse) {
        void updated;
        setSelected(null);
    }

    function handleRejected(updated: ManagedCourse) {
        void updated;
        setSelected(null);
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">NOU Oversight</p>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">Course Approvals</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {canAct
                        ? 'Review trainer and lecturer course submissions. Approve or reject with a mandatory reason.'
                        : 'View pending course submissions awaiting NOU review.'}
                </p>
            </div>

            {selected && (
                <ReviewPanel
                    course={selected}
                    canAct={canAct}
                    onClose={() => setSelected(null)}
                    onApproved={handleApproved}
                    onRejected={handleRejected}
                />
            )}

            <div className="border border-gray-200 bg-white shadow-sm overflow-x-auto">
                <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Pending Review — {courses.length} course{courses.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Course Title</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Lecturer</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Submitted</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modules</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {courses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                                    No courses are pending NOU review.
                                </td>
                            </tr>
                        )}
                        {courses.map(course => (
                            <tr key={course.id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3 font-medium text-gray-900">{course.title}</td>
                                <td className="px-4 py-3 text-gray-600">{course.lecturerName}</td>
                                <td className="px-4 py-3 text-gray-500">{formatDate(course.updatedAt)}</td>
                                <td className="px-4 py-3 text-gray-600">{course.modules.length}</td>
                                <td className="px-4 py-3">
                                    <StatusBadge status="pending" label="Pending NOU" />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => setSelected(course)}
                                        className="text-sm font-semibold text-blue-600 hover:underline"
                                    >
                                        Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
