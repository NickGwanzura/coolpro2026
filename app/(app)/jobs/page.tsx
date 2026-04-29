'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    ClipboardList,
    FileText,
    Filter,
    MapPin,
    Plus,
    Search,
} from 'lucide-react';
import { getSession, type UserSession } from '@/lib/auth';
import { STORAGE_KEYS, readCollection } from '@/lib/platformStore';
import { JobTypeLabels } from '@/types/index';
import type { Installation, PlannerJob, RefrigerantLog } from '@/types/index';

type AdminRecord = {
    id: string;
    recordType: 'job' | 'installation' | 'refrigerant-log';
    clientName: string;
    location: string;
    date: string;
    status: string;
    technicianName: string;
    equipmentType: string;
    detail: string;
};

function buildAdminRecords(
    plannerJobs: PlannerJob[],
    installations: Installation[],
    logs: RefrigerantLog[],
): AdminRecord[] {
    const jobRecords: AdminRecord[] = plannerJobs.map(job => ({
        id: job.id,
        recordType: 'job',
        clientName: job.clientName,
        location: job.location,
        date: job.scheduledDate,
        status: job.status,
        technicianName: job.technicianName,
        equipmentType: JobTypeLabels[job.jobType] ?? job.jobType,
        detail: job.notes?.slice(0, 80) ?? `${job.province}${job.district ? ' · ' + job.district : ''}`,
    }));

    const installationRecords: AdminRecord[] = installations.map(installation => ({
        id: installation.id,
        recordType: 'installation',
        clientName: installation.clientName,
        location: installation.technicianName,
        date: installation.installationDate,
        status: installation.status,
        technicianName: installation.technicianName,
        equipmentType: installation.jobType,
        detail: installation.jobDetails,
    }));

    const logRecords: AdminRecord[] = logs.map(log => ({
        id: log.id,
        recordType: 'refrigerant-log',
        clientName: log.clientName,
        location: log.location,
        date: log.timestamp.slice(0, 10),
        status: log.actionType,
        technicianName: log.technicianName,
        equipmentType: log.refrigerantType,
        detail: `${log.amount} kg · ${log.supplierVerified ? 'Verified supplier' : 'Unverified supplier'}`,
    }));

    return [...jobRecords, ...installationRecords, ...logRecords].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export default function JobsPage() {
    const router = useRouter();
    const [session, setSession] = useState<UserSession | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [selectedRecordType, setSelectedRecordType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [plannerJobs, setPlannerJobs] = useState<PlannerJob[]>([]);
    const [installations, setInstallations] = useState<Installation[]>([]);
    const [logs, setLogs] = useState<RefrigerantLog[]>([]);

    useEffect(() => {
        const userSession = getSession();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSession(userSession);
    }, []);

    // Hydrate localStorage-backed collections after mount (SSR-safe).
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        setPlannerJobs(readCollection<PlannerJob>(STORAGE_KEYS.plannerJobs, []));
        setInstallations(readCollection<Installation>(STORAGE_KEYS.fieldToolkitInstallations, []));
        setLogs(readCollection<RefrigerantLog>(STORAGE_KEYS.fieldToolkitLogs, []));
        /* eslint-enable react-hooks/set-state-in-effect */
    }, []);

    const isAdmin = session?.role === 'org_admin';
    const adminRecords = useMemo(
        () => buildAdminRecords(plannerJobs, installations, logs),
        [plannerJobs, installations, logs]
    );

    const filteredAdminRecords = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return adminRecords.filter(record => {
            const matchesSearch =
                !term ||
                [
                    record.clientName,
                    record.location,
                    record.equipmentType,
                    record.technicianName,
                    record.detail,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(term);

            const matchesTechnician = !selectedTechnician || record.technicianName === selectedTechnician;
            const matchesType = !selectedRecordType || record.recordType === selectedRecordType;
            const matchesStatus = !selectedStatus || record.status === selectedStatus;

            return matchesSearch && matchesTechnician && matchesType && matchesStatus;
        });
    }, [adminRecords, searchTerm, selectedTechnician, selectedRecordType, selectedStatus]);

    const myPlannerJobs = session
        ? plannerJobs.filter(job => job.technicianId === session.id)
        : plannerJobs;
    const term = searchTerm.toLowerCase();
    const filteredJobs = myPlannerJobs.filter(job =>
        job.clientName.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        (JobTypeLabels[job.jobType] ?? job.jobType).toLowerCase().includes(term)
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed':
            case 'approved':
            case 'Charge':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'in-progress':
            case 'pending':
            case 'pending-review':
            case 'Recovery':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'scheduled':
            case 'submitted':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'rejected':
            case 'Leak Repair':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    if (isAdmin) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Jobs & Logs Overview</h1>
                        <p className="text-gray-500 mt-1">
                            All technician jobs, installations, and refrigerant charge and recovery register entries in one filterable admin view.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <OverviewCard label="All Records" value={filteredAdminRecords.length} />
                    <OverviewCard label="Jobs" value={filteredAdminRecords.filter(record => record.recordType === 'job').length} />
                    <OverviewCard label="Installations" value={filteredAdminRecords.filter(record => record.recordType === 'installation').length} />
                    <OverviewCard label="Charge / Recovery Register" value={filteredAdminRecords.filter(record => record.recordType === 'refrigerant-log').length} />
                </div>

                <div className="bg-white border border-gray-200 shadow-sm p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="xl:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search client, location, refrigerant, technician..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            value={selectedTechnician}
                            onChange={event => setSelectedTechnician(event.target.value)}
                            className="px-3 py-2.5 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">All Technicians</option>
                            {Array.from(new Set(adminRecords.map(record => record.technicianName))).sort().map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={selectedRecordType}
                                onChange={event => setSelectedRecordType(event.target.value)}
                                className="px-3 py-2.5 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">All Types</option>
                                <option value="job">Jobs</option>
                                <option value="installation">Installations</option>
                                <option value="refrigerant-log">Logs</option>
                            </select>
                            <select
                                value={selectedStatus}
                                onChange={event => setSelectedStatus(event.target.value)}
                                className="px-3 py-2.5 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">All Status</option>
                                {Array.from(new Set(adminRecords.map(record => record.status))).sort().map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
                  <div className="min-w-[700px]">
                    <div className="grid grid-cols-[0.8fr_1.2fr_1fr_1fr_1fr_1.2fr] gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                        <span>Type</span>
                        <span>Client</span>
                        <span>Technician</span>
                        <span>Location</span>
                        <span>Status</span>
                        <span>Detail</span>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {filteredAdminRecords.map(record => (
                            <div key={record.id} className="grid grid-cols-[0.8fr_1.2fr_1fr_1fr_1fr_1.2fr] gap-4 px-6 py-4 text-sm">
                                <span className="font-semibold capitalize text-gray-700">{record.recordType.replace('-', ' ')}</span>
                                <div>
                                    <p className="font-semibold text-gray-900">{record.clientName}</p>
                                    <p className="text-xs text-gray-500">{record.date}</p>
                                </div>
                                <span className="text-gray-700">{record.technicianName}</span>
                                <span className="text-gray-600">{record.location}</span>
                                <div>
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(record.status)}`}>
                                        {record.status}
                                    </span>
                                </div>
                                <span className="text-gray-600">{record.detail}</span>
                            </div>
                        ))}
                        {filteredAdminRecords.length === 0 && (
                            <div className="px-6 py-10 text-center text-sm text-gray-500">
                                No records match the current filters.
                            </div>
                        )}
                    </div>
                  </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Jobs & Logs</h1>
                    <p className="text-gray-500 mt-1">Track your installations, service calls, and compliance records</p>
                </div>
                <button
                    onClick={() => router.push('/job-planner')}
                    className="flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2.5 font-bold text-sm hover:bg-[#e55a25] transition-all shadow-lg shadow-orange-500/20"
                >
                    <Plus className="h-4 w-4" />
                    Record New Job
                </button>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by client, location, or equipment..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter className="h-4 w-4" />
                        Refine Search
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredJobs.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-200 px-6 py-12 text-center">
                        <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm text-gray-600">
                            {myPlannerJobs.length === 0
                                ? 'No jobs recorded yet. Use the Job Planner to schedule or log work.'
                                : 'No jobs match the current search.'}
                        </p>
                        <button
                            onClick={() => router.push('/job-planner')}
                            className="mt-4 inline-flex items-center gap-2 bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e55a25]"
                        >
                            <Plus className="h-4 w-4" />
                            Open Job Planner
                        </button>
                    </div>
                ) : (
                    filteredJobs.map((job) => (
                        <div key={job.id} className="bg-white border border-gray-200 p-6 shadow-sm hover:border-blue-300 transition-all group">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-gray-900">{job.clientName}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getStatusStyle(job.status)}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            {job.location}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                                            <ClipboardList className="h-4 w-4 text-gray-400" />
                                            {JobTypeLabels[job.jobType] ?? job.jobType}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                                            <FileText className="h-3.5 w-3.5" />
                                            Scheduled: {job.scheduledDate}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                                            Refrigerant class: {job.refrigerantClass}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {job.status === 'completed' && (
                                        <button
                                            onClick={() => router.push(`/jobs/request-coc?jobId=${job.id}`)}
                                            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 font-bold text-sm hover:bg-blue-100 transition-all border border-blue-100"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Request CoC
                                        </button>
                                    )}
                                    <button
                                        onClick={() => router.push('/job-planner')}
                                        className="flex items-center gap-2 text-gray-500 px-4 py-2 font-bold text-sm hover:bg-gray-100 transition-all"
                                    >
                                        View in Planner
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function OverviewCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
    );
}
