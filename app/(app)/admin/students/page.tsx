'use client';

import { useMemo, useState } from 'react';
import { useStudentApplications } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Users, Mail, Phone, Search, GraduationCap, Calendar } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
    submitted: 'bg-amber-50 text-amber-800 border-amber-200',
    'under-review': 'bg-blue-50 text-blue-800 border-blue-200',
    approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-800 border-rose-200',
};

export default function StudentDirectoryPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { data: students, error, isLoading } = useStudentApplications();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const filteredStudents = useMemo(() => {
        const data = students ?? [];
        const term = searchTerm.trim().toLowerCase();
        return data.filter(s => {
            const matchesSearch = !term ||
                [s.firstName, s.lastName, s.email, s.polytech, s.fieldOfStudy, s.studentIdNumber]
                    .join(' ').toLowerCase().includes(term);
            const matchesStatus = !filterStatus || s.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [students, searchTerm, filterStatus]);

    if (authLoading || isLoading) {
        return <div className="p-8 text-sm text-slate-500">Loading…</div>;
    }

    if (!user || user.role !== 'org_admin') {
        return (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                Access restricted to org admins only.
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-sm text-red-600">Failed to load. {(error as Error).message}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
                    <p className="mt-1 text-gray-500">
                        All enrolled students and their application status across the network.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <SummaryCard label="Total Students" value={(students ?? []).length} />
                <SummaryCard label="Approved" value={(students ?? []).filter(s => s.status === 'approved').length} />
                <SummaryCard label="Pending Review" value={(students ?? []).filter(s => s.status === 'submitted' || s.status === 'under-review').length} />
                <SummaryCard label="Institutions" value={new Set((students ?? []).map(s => s.polytech)).size} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, email, institution..."
                                className="w-full border border-gray-300 py-2.5 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="submitted">Submitted</option>
                            <option value="under-review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredStudents.map((student) => (
                    <div
                        key={student.id}
                        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-blue-300 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-base font-bold text-gray-900">
                                        {student.firstName} {student.lastName}
                                    </h3>
                                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${STATUS_BADGE[student.status] || 'bg-gray-50 text-gray-600'}`}>
                                        {student.status.replace('-', ' ')}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                        {student.email}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                                        {student.phone}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                                        {student.polytech} · {student.fieldOfStudy}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                        Enrolled {student.enrolmentYear}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Student ID: {student.studentIdNumber} · Submitted {new Date(student.submittedAt).toLocaleDateString()}
                                </p>
                                {student.reviewNote && (
                                    <div className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                        <span className="font-semibold">Review note:</span> {student.reviewNote}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredStudents.length === 0 && (
                    <div className="border border-dashed border-gray-200 bg-gray-50 p-12 text-center text-sm text-gray-500">
                        <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                        No student records found.
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}
