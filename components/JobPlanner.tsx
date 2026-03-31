'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, ChevronRight, Clock3, ClipboardList, Plus, ShieldAlert, ShieldCheck, Sparkles, X } from 'lucide-react';
import {
    JobType,
    JobTypeLabels,
    JobTypeDescriptions,
    type PlannerJob,
    type PlannerJobStatus,
    type PlannerSafetyChecklistItem,
    type RefrigerantSafetyClass,
} from '@/types/index';
import { MOCK_TECHNICIANS } from '@/constants/registry';
import { MOCK_PLANNER_CLIENTS, MOCK_PLANNER_JOBS, MOCK_PLANNER_SAFETY_CHECKLIST } from '@/constants/job-planner';
import { useRouter } from 'next/navigation';
import { readCollection, STORAGE_KEYS, writeCollection } from '@/lib/platformStore';

interface PlannerFormState {
    clientId: string;
    clientName: string;
    location: string;
    jobType: JobType;
    refrigerantClass: RefrigerantSafetyClass;
    scheduledDate: string;
    technicianId: string;
    technicianName: string;
    preJobChecklistComplete: boolean;
    notes: string;
}

const REF_CLASSES: RefrigerantSafetyClass[] = ['A1', 'A2L', 'A3'];

function addDays(baseDate: string, offset: number) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
}

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat('en-ZW', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    }).format(new Date(dateString));
}

function statusStyles(status: PlannerJobStatus) {
    switch (status) {
        case 'completed':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'in-progress':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'follow-up':
            return 'bg-amber-100 text-amber-700 border-amber-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
}

function refrigerantClassStyles(value: RefrigerantSafetyClass) {
    switch (value) {
        case 'A2L':
            return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'A3':
            return 'bg-red-100 text-red-700 border-red-200';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

type LegacyPlannerJob = Partial<PlannerJob> & {
    date?: string;
    technician?: string;
    checklistComplete?: boolean;
};

function normalizePlannerJob(job: LegacyPlannerJob): PlannerJob {
    const scheduledDate = job.scheduledDate ?? job.date ?? '2026-04-01';
    const technicianName = job.technicianName ?? job.technician ?? 'Demo Technician';
    const checklistItems = job.checklistItems ?? MOCK_PLANNER_SAFETY_CHECKLIST.map(item => ({
        ...item,
        completed: Boolean(job.preJobChecklistComplete ?? job.checklistComplete)
    }));

    return {
        id: job.id ?? `job-plan-${Math.random().toString(36).slice(2, 9)}`,
        clientId: job.clientId ?? MOCK_PLANNER_CLIENTS[0].id,
        clientName: job.clientName ?? MOCK_PLANNER_CLIENTS[0].name,
        location: job.location ?? MOCK_PLANNER_CLIENTS[0].location,
        province: job.province ?? MOCK_PLANNER_CLIENTS[0].province,
        district: job.district,
        technicianId: job.technicianId ?? MOCK_TECHNICIANS[0]?.id ?? 'tech-001',
        technicianName,
        jobType: job.jobType ?? 'COLD_ROOM',
        refrigerantClass: job.refrigerantClass ?? 'A1',
        scheduledDate,
        status: job.status ?? 'scheduled',
        preJobChecklistComplete: job.preJobChecklistComplete ?? job.checklistComplete ?? false,
        checklistItems,
        notes: job.notes ?? '',
        createdAt: job.createdAt ?? new Date().toISOString(),
        updatedAt: job.updatedAt ?? new Date().toISOString(),
    };
}

export default function JobPlanner() {
    const router = useRouter();
    const [jobs, setJobs] = useState<PlannerJob[]>(MOCK_PLANNER_JOBS);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [startDate, setStartDate] = useState('2026-03-29');
    const [endDate, setEndDate] = useState('2026-04-03');
    const [activeClientId, setActiveClientId] = useState(MOCK_PLANNER_CLIENTS[0].id);
    const [showModal, setShowModal] = useState(false);
    const [notice, setNotice] = useState('');
    const [formData, setFormData] = useState<PlannerFormState>({
        clientId: MOCK_PLANNER_CLIENTS[0].id,
        clientName: MOCK_PLANNER_CLIENTS[0].name,
        location: MOCK_PLANNER_CLIENTS[0].location,
        jobType: 'COLD_ROOM',
        refrigerantClass: 'A1',
        scheduledDate: '2026-04-04',
        technicianId: MOCK_TECHNICIANS[0]?.id ?? 'tech-001',
        technicianName: MOCK_TECHNICIANS[0]?.name ?? 'Demo Technician',
        preJobChecklistComplete: false,
        notes: ''
    });

    useEffect(() => {
        const parsed = readCollection<LegacyPlannerJob>(STORAGE_KEYS.plannerJobs, MOCK_PLANNER_JOBS as LegacyPlannerJob[]);
        setJobs(parsed.map(normalizePlannerJob));
    }, []);

    useEffect(() => {
        writeCollection(STORAGE_KEYS.plannerJobs, jobs);
    }, [jobs]);

    const safetyChecklistRequired = formData.refrigerantClass === 'A2L' || formData.refrigerantClass === 'A3';
    const safetyChecklistComplete = formData.preJobChecklistComplete;

    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const searchMatch =
                !searchTerm ||
                job.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.technicianName.toLowerCase().includes(searchTerm.toLowerCase());

            const clientMatch = !selectedClient || job.clientId === selectedClient;
            const statusMatch = !selectedStatus || job.status === selectedStatus;
            const dateMatch = job.scheduledDate >= startDate && job.scheduledDate <= endDate;

            return searchMatch && clientMatch && statusMatch && dateMatch;
        });
    }, [jobs, searchTerm, selectedClient, selectedStatus, startDate, endDate]);

    const jobsByDate = useMemo(() => {
        return filteredJobs.reduce<Record<string, PlannerJob[]>>((acc, job) => {
            if (!acc[job.scheduledDate]) {
                acc[job.scheduledDate] = [];
            }
            acc[job.scheduledDate].push(job);
            return acc;
        }, {});
    }, [filteredJobs]);

    const sortedDates = useMemo(() => {
        return Object.keys(jobsByDate).sort((a, b) => a.localeCompare(b));
    }, [jobsByDate]);

    const selectedClientInfo = MOCK_PLANNER_CLIENTS.find(client => client.id === activeClientId) ?? MOCK_PLANNER_CLIENTS[0];

    const stats = [
        { label: 'Total Jobs', value: jobs.length, icon: ClipboardList },
        { label: 'Scheduled', value: jobs.filter(job => job.status === 'scheduled').length, icon: CalendarDays },
        { label: 'In Progress', value: jobs.filter(job => job.status === 'in-progress').length, icon: Clock3 },
        { label: 'Follow-up', value: jobs.filter(job => job.status === 'follow-up').length, icon: ShieldAlert }
    ];

    const openClient = (clientId: string) => {
        setActiveClientId(clientId);
        const client = MOCK_PLANNER_CLIENTS.find(item => item.id === clientId);
        if (client) {
            setFormData(prev => ({
                ...prev,
                clientId: client.id,
                clientName: client.name,
                location: client.location
            }));
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (safetyChecklistRequired && !safetyChecklistComplete) {
            setNotice('A2L and A3 jobs require the pre-job safety checklist before scheduling.');
            return;
        }

        const newJob: PlannerJob = {
            id: `job-plan-${Date.now()}`,
            clientId: formData.clientId,
            clientName: formData.clientName,
            location: formData.location,
            province: selectedClientInfo.province,
            jobType: formData.jobType,
            refrigerantClass: formData.refrigerantClass,
            status: 'scheduled',
            scheduledDate: formData.scheduledDate,
            technicianId: formData.technicianId,
            technicianName: formData.technicianName,
            preJobChecklistComplete: formData.preJobChecklistComplete,
            checklistItems: MOCK_PLANNER_SAFETY_CHECKLIST.map((item): PlannerSafetyChecklistItem => ({
                ...item,
                completed: formData.preJobChecklistComplete
            })),
            notes: formData.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setJobs(prev => [newJob, ...prev]);
        setShowModal(false);
        setNotice(`Planner job created for ${newJob.clientName}.`);
        setFormData({
            clientId: formData.clientId,
            clientName: formData.clientName,
            location: formData.location,
            jobType: 'COLD_ROOM',
            refrigerantClass: 'A1',
            scheduledDate: addDays(formData.scheduledDate, 1),
            technicianId: formData.technicianId,
            technicianName: formData.technicianName,
            preJobChecklistComplete: false,
            notes: ''
        });
    };

    return (
        <div className="space-y-6">
            {notice && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                    {notice}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
                                <span className="rounded-lg bg-gray-100 p-2 text-gray-500">
                                    <Icon className="h-4 w-4" />
                                </span>
                            </div>
                            <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Clients</h2>
                                <p className="text-sm text-gray-500">Expandable service history</p>
                            </div>
                        </div>
                        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Focused Client</p>
                            <h3 className="mt-1 text-sm font-bold text-gray-900">{selectedClientInfo.name}</h3>
                            <p className="text-xs text-gray-500">{selectedClientInfo.location}</p>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <p className="font-semibold uppercase tracking-wide text-gray-400">Owner</p>
                                    <p className="mt-1 font-medium text-gray-900">{selectedClientInfo.contactPerson}</p>
                                </div>
                                <div>
                                    <p className="font-semibold uppercase tracking-wide text-gray-400">Province</p>
                                    <p className="mt-1 font-medium text-gray-900">{selectedClientInfo.province}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {MOCK_PLANNER_CLIENTS.map(client => (
                                <details
                                    key={client.id}
                                    open={client.id === activeClientId}
                                    className="group rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
                                    onClick={() => openClient(client.id)}
                                >
                                    <summary className="cursor-pointer list-none">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900">{client.name}</h3>
                                                <p className="text-xs text-gray-500">{client.location}</p>
                                            </div>
                                            <ChevronRight className="mt-0.5 h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
                                        </div>
                                    </summary>
                                    <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <p className="font-semibold text-gray-500 uppercase tracking-wide">Province</p>
                                                <p className="mt-1 font-medium text-gray-900">{client.province}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-500 uppercase tracking-wide">Contact</p>
                                                <p className="mt-1 font-medium text-gray-900">{client.contactNumber}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Service History</p>
                                            <div className="mt-2 space-y-2">
                                                {client.serviceHistory.map(item => (
                                                    <div key={`${client.id}-${item.date}`} className="rounded-xl border border-gray-200 bg-white p-3">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-xs font-semibold text-gray-900">{item.notes}</p>
                                                            <span className="text-[11px] text-gray-400">{formatDate(item.date)}</span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {item.status} by {item.technicianName}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 xl:col-span-8">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={event => setSearchTerm(event.target.value)}
                                    placeholder="Search client, location, or technician..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Client</label>
                                <select
                                    value={selectedClient}
                                    onChange={event => setSelectedClient(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white"
                                >
                                    <option value="">All clients</option>
                                    {MOCK_PLANNER_CLIENTS.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={event => setSelectedStatus(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white"
                                >
                                    <option value="">All statuses</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="follow-up">Follow-up</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={event => setStartDate(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={event => setEndDate(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-gray-500">
                                Showing {filteredJobs.length} jobs across {sortedDates.length || 0} active dates.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                New Job
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {sortedDates.map(date => (
                            <div key={date} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Schedule</p>
                                        <h3 className="mt-1 text-lg font-bold text-gray-900">{formatDate(date)}</h3>
                                    </div>
                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                        {jobsByDate[date].length} jobs
                                    </span>
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {jobsByDate[date].map(job => (
                                        <div key={job.id} className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">{job.clientName}</h4>
                                    <p className="text-xs text-gray-500">{job.location}</p>
                                            </div>
                                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusStyles(job.status)}`}>
                                                    {job.status}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <p className="font-semibold uppercase tracking-wide text-gray-400">Job Type</p>
                                                    <p className="mt-1 font-medium text-gray-900">{JobTypeLabels[job.jobType]}</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold uppercase tracking-wide text-gray-400">Refrigerant</p>
                                                    <p className="mt-1 font-medium text-gray-900">{job.refrigerantClass}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                <div className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${refrigerantClassStyles(job.refrigerantClass)}`}>
                                                    {job.refrigerantClass}
                                                </div>
                                                <span className="text-xs text-gray-500">{job.technicianName}</span>
                                            </div>
                                            <p className="mt-3 text-sm text-gray-600">{job.notes}</p>
                                            {job.refrigerantClass === 'A2L' || job.refrigerantClass === 'A3' ? (
                                                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                                    <ShieldAlert className="h-4 w-4" />
                                                    Safety checklist required for this refrigerant class.
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {!sortedDates.length && (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                                No jobs match the current filters.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Create Planner Job</h2>
                                <p className="text-sm text-gray-500">Add a mock schedule item to the shared planner store.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Client</label>
                                    <select
                                        value={formData.clientId}
                                        onChange={event => openClient(event.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                                    >
                                        {MOCK_PLANNER_CLIENTS.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Location</label>
                                    <input
                                        value={formData.location}
                                        onChange={event => setFormData(prev => ({ ...prev, location: event.target.value }))}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Job Type</label>
                                    <select
                                        value={formData.jobType}
                                        onChange={event => setFormData(prev => ({ ...prev, jobType: event.target.value as JobType }))}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                                    >
                                        {Object.keys(JobTypeLabels).map(type => (
                                            <option key={type} value={type}>
                                                {JobTypeLabels[type as JobType]}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {JobTypeDescriptions[formData.jobType]}
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Refrigerant Class</label>
                                    <select
                                        value={formData.refrigerantClass}
                                        onChange={event => setFormData(prev => ({ ...prev, refrigerantClass: event.target.value as RefrigerantSafetyClass, preJobChecklistComplete: event.target.value === 'A1' ? prev.preJobChecklistComplete : false }))}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                                    >
                                        {REF_CLASSES.map(item => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Date</label>
                                    <input
                                        type="date"
                                        value={formData.scheduledDate}
                                        onChange={event => setFormData(prev => ({ ...prev, scheduledDate: event.target.value }))}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Technician</label>
                                    <select
                                        value={formData.technicianName}
                                        onChange={event => setFormData(prev => ({ ...prev, technicianName: event.target.value }))}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                                    >
                                        {MOCK_TECHNICIANS.map(tech => (
                                            <option key={tech.id} value={tech.name}>
                                                {tech.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {safetyChecklistRequired && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-700" />
                                        <div className="space-y-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-amber-900">Mandatory Safety Checklist</h3>
                                                <p className="text-xs text-amber-800">
                                                    A2L and A3 jobs must confirm PPE, ventilation, and leak-response readiness before scheduling.
                                                </p>
                                            </div>
                                            <label className="flex items-center gap-3 text-sm font-medium text-amber-900">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.preJobChecklistComplete}
                                                    onChange={event => setFormData(prev => ({ ...prev, preJobChecklistComplete: event.target.checked }))}
                                                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                                />
                                                PPE, ventilation, and gas detection checklist confirmed
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={event => setFormData(prev => ({ ...prev, notes: event.target.value }))}
                                    className="min-h-[110px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                                    placeholder="Scope, parts required, or follow-up notes..."
                                />
                            </div>

                            {safetyChecklistRequired && !safetyChecklistComplete && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    The safety checklist must be completed before this job can be saved.
                                </div>
                            )}

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={safetyChecklistRequired && !safetyChecklistComplete}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Save Planner Job
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
