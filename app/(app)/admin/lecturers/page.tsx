'use client';

import { useMemo, useState } from 'react';
import { useUsers, type AppUser } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { GraduationCap, Mail, Phone, Search, MapPin } from 'lucide-react';

export default function LecturerDirectoryPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { data: allUsers, error, isLoading } = useUsers();
    const [searchTerm, setSearchTerm] = useState('');

    const lecturers = useMemo(() => {
        const users = allUsers ?? [];
        const filtered = users.filter(u => u.role === 'lecturer' || u.role === 'trainer');
        const term = searchTerm.trim().toLowerCase();
        if (!term) return filtered;
        return filtered.filter(u =>
            [u.name, u.email, u.region, u.role].join(' ').toLowerCase().includes(term)
        );
    }, [allUsers, searchTerm]);

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
                    <h1 className="text-2xl font-bold text-gray-900">Lecturer & Trainer Directory</h1>
                    <p className="mt-1 text-gray-500">
                        All registered lecturers and trainers across the HEVACRAZ network.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <SummaryCard label="Total Lecturers" value={lecturers.filter(u => u.role === 'lecturer').length} />
                <SummaryCard label="Total Trainers" value={lecturers.filter(u => u.role === 'trainer').length} />
                <SummaryCard label="Active" value={lecturers.filter(u => u.status !== 'inactive').length} />
                <SummaryCard label="Regions" value={new Set(lecturers.map(u => u.region)).size} />
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Search</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, region..."
                        className="w-full border border-gray-300 py-2.5 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {lecturers.map((lecturer) => (
                    <div
                        key={lecturer.id}
                        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-blue-300 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 flex items-center justify-center bg-amber-100 text-amber-700 flex-shrink-0">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-base font-bold text-gray-900">{lecturer.name}</h3>
                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                                            lecturer.role === 'lecturer'
                                                ? 'bg-cyan-100 text-cyan-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {lecturer.role.replace('_', ' ')}
                                        </span>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                            lecturer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {lecturer.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                                            {lecturer.email}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                            {lecturer.region}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {lecturers.length === 0 && (
                    <div className="border border-dashed border-gray-200 bg-gray-50 p-12 text-center text-sm text-gray-500">
                        <GraduationCap className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                        No lecturers or trainers found.
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
