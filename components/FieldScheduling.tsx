'use client';

import { useEffect, useMemo, useState } from 'react';
import { BellRing, ChevronRight, Plus, Search, TimerReset } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSession, type UserSession } from '@/lib/auth';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import {
    type EquipmentRecord,
    type EquipmentStatus,
    type PlannerJob,
    type PredictiveAlert,
} from '@/types/index';
import { MOCK_EQUIPMENT_RECORDS } from '@/constants/field-scheduling';
import { MOCK_PLANNER_JOBS, MOCK_PLANNER_SAFETY_CHECKLIST } from '@/constants/job-planner';
import { MOCK_REFRIGERANTS } from '@/constants/refrigerants';
import { readCollection, STORAGE_KEYS, writeCollection } from '@/lib/platformStore';

type ViewScope = 'own' | 'fleet';

function statusStyles(status: EquipmentStatus) {
    switch (status) {
        case 'normal':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'due-soon':
            return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'overdue':
            return 'bg-red-100 text-red-700 border-red-200';
    }
}

type LegacyServiceHistoryItem = {
    date: string;
    summary?: string;
    result?: string;
    notes?: string;
    technicianName?: string;
    status?: string;
};

type LegacyEquipmentRecord = Partial<EquipmentRecord> & {
    refrigerant?: string;
    lastService?: string;
    nextDue?: string;
    assignedTechnicianId?: string;
    history?: LegacyServiceHistoryItem[];
    predictedFailure?: string;
    recommendedAction?: string;
};

function normalizeEquipmentRecord(record: LegacyEquipmentRecord): EquipmentRecord {
    return {
        id: record.id ?? `eq-${Math.random().toString(36).slice(2, 8)}`,
        equipmentId: record.equipmentId ?? 'EQ-UNKNOWN',
        clientName: record.clientName ?? 'Unknown Client',
        province: record.province ?? 'Harare',
        refrigerantType: record.refrigerantType ?? record.refrigerant ?? 'R-290',
        ashraeSafetyClass:
            record.ashraeSafetyClass ??
            (MOCK_REFRIGERANTS[record.refrigerantType ?? record.refrigerant ?? 'R-290'] ?? MOCK_REFRIGERANTS['R-290']).ashraeSafetyClass,
        lastServiceDate: record.lastServiceDate ?? record.lastService ?? '2026-03-01',
        nextServiceDue: record.nextServiceDue ?? record.nextDue ?? '2026-04-01',
        status: record.status ?? 'normal',
        technicianName: record.technicianName ?? 'Demo Technician',
        serviceHistory: (record.serviceHistory ?? record.history ?? []).map(item => {
            const notes = 'notes' in item && item.notes ? item.notes : ('summary' in item && item.summary ? item.summary : 'Service record');
            const technicianName = 'technicianName' in item && item.technicianName ? item.technicianName : (record.technicianName ?? 'Demo Technician');
            const status = 'status' in item && item.status ? (item.status as PlannerJob['status']) : 'completed';

            return {
                id: `${record.id ?? 'eq'}-${item.date}`,
                date: item.date,
                notes,
                technicianName,
                status,
            };
        }),
        predictedFailureReason: record.predictedFailureReason ?? record.predictedFailure ?? 'Service interval exceeded.',
        recommendedAction: record.recommendedAction ?? 'Schedule follow-up service.',
    };
}

function seedPlannerJob(record: EquipmentRecord) {
    if (typeof window === 'undefined') {
        return;
    }

    const plannerJobs = readCollection<PlannerJob>(STORAGE_KEYS.plannerJobs, MOCK_PLANNER_JOBS);

    const refrigerantDefinition = MOCK_REFRIGERANTS[record.refrigerantType] ?? MOCK_REFRIGERANTS['R-290'];
    const plannerJob: PlannerJob = {
        id: `job-plan-${Date.now()}`,
        clientId: record.id,
        clientName: record.clientName,
        location: record.province,
        province: record.province,
        jobType: 'COLD_ROOM',
        refrigerantClass: refrigerantDefinition.ashraeSafetyClass,
        status: 'scheduled',
        scheduledDate: record.nextServiceDue,
        technicianId: getSession()?.id ?? 'tech-001',
        technicianName: getSession()?.name ?? 'Demo Technician',
        preJobChecklistComplete: record.status === 'normal',
        checklistItems: MOCK_PLANNER_SAFETY_CHECKLIST.map(item => ({
            ...item,
            completed: record.status === 'normal'
        })),
        notes: `Scheduled from ${record.equipmentId} predictive maintenance alert.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    writeCollection(STORAGE_KEYS.plannerJobs, [plannerJob, ...plannerJobs]);
}

export default function FieldScheduling() {
    const router = useRouter();
    const [session, setSession] = useState<UserSession | null>(null);
    const [scope, setScope] = useState<ViewScope>('own');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<EquipmentStatus | ''>('');
    const [provinceFilter, setProvinceFilter] = useState('');
    const [refrigerantFilter, setRefrigerantFilter] = useState('');
    const [records, setRecords] = useState<EquipmentRecord[]>(MOCK_EQUIPMENT_RECORDS);
    const [selectedRecord, setSelectedRecord] = useState<EquipmentRecord | null>(MOCK_EQUIPMENT_RECORDS[0]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const currentSession = getSession();
        setSession(currentSession);
        setScope(currentSession?.role === 'org_admin' ? 'fleet' : 'own');

        const parsed = readCollection<LegacyEquipmentRecord>(STORAGE_KEYS.fieldSchedulingRecords, MOCK_EQUIPMENT_RECORDS as LegacyEquipmentRecord[]);
        setRecords(parsed.map(normalizeEquipmentRecord));
    }, []);

    useEffect(() => {
        writeCollection(STORAGE_KEYS.fieldSchedulingRecords, records);
    }, [records]);

    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const searchMatch =
                !searchTerm ||
                record.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.province.toLowerCase().includes(searchTerm.toLowerCase());

            const scopeMatch =
                scope === 'fleet' ||
                !session ||
                record.technicianName === session.name;

            const statusMatch = !statusFilter || record.status === statusFilter;
            const provinceMatch = !provinceFilter || record.province === provinceFilter;
            const refrigerantMatch = !refrigerantFilter || record.refrigerantType === refrigerantFilter;

            return searchMatch && scopeMatch && statusMatch && provinceMatch && refrigerantMatch;
        });
    }, [records, scope, session, searchTerm, statusFilter, provinceFilter, refrigerantFilter]);

    const stats = [
        { label: 'Total Equipment', value: filteredRecords.length },
        { label: 'Due Soon', value: filteredRecords.filter(record => record.status === 'due-soon').length },
        { label: 'Overdue', value: filteredRecords.filter(record => record.status === 'overdue').length }
    ];

    const alerts: PredictiveAlert[] = filteredRecords
        .filter(record => record.status !== 'normal')
        .map(record => ({
            id: record.id,
            equipmentId: record.equipmentId,
            clientName: record.clientName,
            province: record.province,
            predictedFailureReason: record.predictedFailureReason ?? 'Service interval exceeded.',
            recommendedAction: record.recommendedAction ?? 'Schedule follow-up service.',
            urgency: record.status === 'overdue' ? 'high' : 'medium',
            status: record.status,
        }));

    const handleScheduleService = (entry: EquipmentRecord | PredictiveAlert) => {
        const record =
            'refrigerantType' in entry
                ? entry
                : records.find(item => item.id === entry.id || item.equipmentId === entry.equipmentId) ?? records[0];

        seedPlannerJob(record);
        setMessage(`Scheduled a planner job from ${record.equipmentId}.`);
        router.push('/job-planner');
    };

    const handleViewHistory = (record: EquipmentRecord) => {
        setSelectedRecord(record);
        setMessage(`Showing service history for ${record.equipmentId}.`);
    };

    const uniqueRefrigerants = Array.from(new Set(records.map(record => record.refrigerantType))).sort();

    return (
        <div className="space-y-6">
            {message && (
                <div className="border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {stats.map(stat => (
                    <div key={stat.label} className="border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
                        <p className="mt-3 text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-8">
                    <div className="border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search client, ID, or province..."
                                        value={searchTerm}
                                        onChange={event => setSearchTerm(event.target.value)}
                                        className="w-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={event => setStatusFilter(event.target.value as EquipmentStatus | '')}
                                    className="w-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white"
                                >
                                    <option value="">All status</option>
                                    <option value="normal">Normal</option>
                                    <option value="due-soon">Due Soon</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Scope</label>
                                <button
                                    type="button"
                                    onClick={() => setScope(prev => (prev === 'own' ? 'fleet' : 'own'))}
                                    className="flex w-full items-center justify-between border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-white"
                                >
                                    {scope === 'own' ? 'Own equipment' : 'Fleet view'}
                                    <TimerReset className="h-4 w-4 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Province</label>
                                <select
                                    value={provinceFilter}
                                    onChange={event => setProvinceFilter(event.target.value)}
                                    className="w-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white"
                                >
                                    <option value="">All provinces</option>
                                    {ZIMBABWE_PROVINCES.map(province => (
                                        <option key={province.id} value={province.name}>
                                            {province.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Refrigerant</label>
                                <select
                                    value={refrigerantFilter}
                                    onChange={event => setRefrigerantFilter(event.target.value)}
                                    className="w-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white"
                                >
                                    <option value="">All refrigerants</option>
                                    {uniqueRefrigerants.map(refrigerant => (
                                        <option key={refrigerant} value={refrigerant}>
                                            {refrigerant}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-gray-900">Equipment Register</h2>
                            <p className="text-sm text-gray-500">Mock maintenance view with predictive actions.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Equipment ID</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Client</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Refrigerant</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Last Service</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Next Due</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredRecords.map(record => (
                                        <tr key={record.id} className="hover:bg-gray-50/80">
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">{record.equipmentId}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">{record.clientName}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">{record.refrigerantType}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">{record.lastServiceDate}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">{record.nextServiceDue}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusStyles(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleScheduleService(record)}
                                                        className="inline-flex items-center gap-2 border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Schedule Service
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewHistory(record)}
                                                        className="inline-flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                                    >
                                                        View History
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {!filteredRecords.length && (
                            <div className="px-5 py-8 text-center text-sm text-gray-500">
                                No equipment matches the current filters.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6 xl:col-span-4">
                    <div className="border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2">
                            <BellRing className="h-5 w-5 text-blue-600" />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Predictive Alerts</h2>
                                <p className="text-sm text-gray-500">Issues that should move into the planner.</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {alerts.map(alert => (
                                <details key={alert.id} className="border border-gray-200 bg-gray-50/80 p-4">
                                    <summary className="cursor-pointer list-none">
                                        <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{alert.equipmentId}</p>
                                            <p className="text-xs text-gray-500">{alert.clientName}</p>
                                        </div>
                                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusStyles(alert.status)}`}>
                                                {alert.status}
                                            </span>
                                        </div>
                                    </summary>
                                    <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Predicted failure</p>
                                            <p className="mt-1 text-sm text-gray-700">{alert.predictedFailureReason}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recommended action</p>
                                            <p className="mt-1 text-sm text-gray-700">{alert.recommendedAction}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleScheduleService(alert)}
                                            className="inline-flex w-full items-center justify-center gap-2 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                        >
                                            Create Job
                                        </button>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>

                    {selectedRecord && (
                        <div className="border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900">Service History</h2>
                            <p className="text-sm text-gray-500">{selectedRecord.equipmentId}</p>
                            <div className="mt-4 space-y-3">
                                {selectedRecord.serviceHistory.map(item => (
                                    <div key={`${selectedRecord.id}-${item.date}`} className="border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-gray-900">{item.notes}</p>
                                            <span className="text-xs text-gray-400">{item.date}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">{item.status} by {item.technicianName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
