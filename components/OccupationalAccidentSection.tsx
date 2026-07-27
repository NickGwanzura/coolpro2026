import React, { useMemo, useState } from 'react';
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Download,
    Eye,
    FileWarning,
    Filter,
    MapPin,
    Plus,
    Search,
    ShieldCheck,
    User,
    X,
} from 'lucide-react';
import { OccupationalAccident, RootCauseCategories, SeverityCategories } from '../types';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import { createOccupationalAccident, submitAccidentInvestigation, useOccupationalAccidents } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

type InvestigationStatus = 'Open' | 'Under Investigation' | 'Closed';

interface InvestigationData {
    rootCause: keyof typeof RootCauseCategories;
    investigationDate: string;
    investigatorName: string;
    correctiveActions: string;
    preventiveMeasures: string;
    status: InvestigationStatus;
}

interface OccupationalAccidentSectionProps {
    isAdmin?: boolean;
}

const severityOrder: Record<OccupationalAccident['severity'], number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
};

const statusStyles: Record<InvestigationStatus, string> = {
    Open: 'border-red-200 bg-red-50 text-red-700',
    'Under Investigation': 'border-amber-200 bg-amber-50 text-amber-700',
    Closed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const severityStyles: Record<OccupationalAccident['severity'], string> = {
    Critical: 'border-red-200 bg-red-50 text-red-700',
    High: 'border-orange-200 bg-orange-50 text-orange-700',
    Medium: 'border-amber-200 bg-amber-50 text-amber-700',
    Low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function emptyInvestigation(): InvestigationData {
    return {
        rootCause: 'NEGLIGENCE',
        investigationDate: new Date().toISOString().split('T')[0],
        investigatorName: '',
        correctiveActions: '',
        preventiveMeasures: '',
        status: 'Open',
    };
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value));
}

function accidentStatus(accident: OccupationalAccident): InvestigationStatus {
    return accident.status ?? 'Open';
}

function getRegionForAccident(accident: OccupationalAccident) {
    const haystack = `${accident.jobSite} ${accident.clientName}`.toLowerCase();

    for (const province of ZIMBABWE_PROVINCES) {
        if (haystack.includes(province.name.toLowerCase())) return province.name;
        const district = province.districts.find(item => haystack.includes(item.toLowerCase()));
        if (district) return province.name;
    }

    return 'Other';
}

function investigationFromAccident(accident: OccupationalAccident): InvestigationData {
    return {
        rootCause: (accident.rootCause as keyof typeof RootCauseCategories) || 'NEGLIGENCE',
        investigationDate: accident.investigationDate || new Date().toISOString().split('T')[0],
        investigatorName: accident.investigatorName || '',
        correctiveActions: accident.correctiveActions || '',
        preventiveMeasures: accident.preventiveMeasures || '',
        status: accidentStatus(accident),
    };
}

export default function OccupationalAccidentSection({ isAdmin = false }: OccupationalAccidentSectionProps) {
    const { success, error: toastError } = useToast();
    const { data: accidents = [] } = useOccupationalAccidents();
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isInvestigating, setIsInvestigating] = useState(false);
    const [selectedAccident, setSelectedAccident] = useState<OccupationalAccident | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedSeverity, setSelectedSeverity] = useState<'all' | OccupationalAccident['severity']>('all');
    const [selectedStatus, setSelectedStatus] = useState<'all' | InvestigationStatus>('all');
    const [investigationData, setInvestigationData] = useState<InvestigationData>(emptyInvestigation);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        jobSite: '',
        clientName: '',
        severity: 'Medium' as OccupationalAccident['severity'],
        description: '',
        refrigerantInvolved: '',
        nearMissFlag: false,
        nouNotified: false,
    });

    const filteredAccidents = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return accidents
            .filter(accident => {
                const region = getRegionForAccident(accident);
                const status = accidentStatus(accident);
                const matchesSearch =
                    !term ||
                    [
                        accident.jobSite,
                        accident.clientName,
                        accident.description,
                        accident.technicianName,
                        accident.refrigerantInvolved,
                        region,
                    ]
                        .join(' ')
                        .toLowerCase()
                        .includes(term);

                return (
                    matchesSearch &&
                    (selectedRegion === 'all' || region === selectedRegion) &&
                    (selectedSeverity === 'all' || accident.severity === selectedSeverity) &&
                    (selectedStatus === 'all' || status === selectedStatus)
                );
            })
            .sort((a, b) => {
                const severityDelta = severityOrder[a.severity] - severityOrder[b.severity];
                if (severityDelta !== 0) return severityDelta;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [accidents, searchTerm, selectedRegion, selectedSeverity, selectedStatus]);

    const summary = useMemo(() => {
        const open = filteredAccidents.filter(item => accidentStatus(item) !== 'Closed');
        return {
            total: filteredAccidents.length,
            urgent: filteredAccidents.filter(item => item.severity === 'Critical' || item.severity === 'High').length,
            open: open.length,
            nearMisses: filteredAccidents.filter(item => item.nearMissFlag).length,
            nouNotified: filteredAccidents.filter(item => item.nouNotified).length,
        };
    }, [filteredAccidents]);

    const newestOpen = filteredAccidents.filter(item => accidentStatus(item) !== 'Closed').slice(0, 8);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (formData.description.trim().length < 20) {
            toastError('Add at least 20 characters describing what happened.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createOccupationalAccident({
                date: formData.date,
                jobSite: formData.jobSite.trim(),
                clientName: formData.clientName.trim(),
                severity: formData.severity,
                description: formData.description.trim(),
                refrigerantInvolved: formData.refrigerantInvolved.trim() || undefined,
                nearMissFlag: formData.nearMissFlag,
                nouNotified: formData.nouNotified,
            });
            success('Incident report submitted.');
            setShowForm(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                jobSite: '',
                clientName: '',
                severity: 'Medium',
                description: '',
                refrigerantInvolved: '',
                nearMissFlag: false,
                nouNotified: false,
            });
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to submit incident report.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleInvestigationSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedAccident) return;
        if (
            investigationData.status === 'Closed' &&
            (!investigationData.investigatorName.trim() ||
                !investigationData.correctiveActions.trim() ||
                !investigationData.preventiveMeasures.trim())
        ) {
            toastError('Add investigator, corrective actions, and preventive measures before closing.');
            return;
        }

        setIsInvestigating(true);
        try {
            await submitAccidentInvestigation(selectedAccident.id, {
                ...investigationData,
                investigatorName: investigationData.investigatorName.trim(),
                correctiveActions: investigationData.correctiveActions.trim(),
                preventiveMeasures: investigationData.preventiveMeasures.trim(),
            });
            success('Investigation report saved.');
            setSelectedAccident(null);
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to save investigation report.');
        } finally {
            setIsInvestigating(false);
        }
    }

    async function exportPDF() {
        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('HEVACRAZ Occupational Accident Triage Report', 14, 18);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString('en-ZW')}`, 14, 26);
        doc.text(`Filtered incidents: ${filteredAccidents.length}`, 14, 32);

        autoTable(doc, {
            startY: 42,
            head: [['Date', 'Severity', 'Status', 'Region', 'Site', 'Client', 'Reported By', 'NOU']],
            body: filteredAccidents.map(accident => [
                accident.date,
                accident.severity,
                accidentStatus(accident),
                getRegionForAccident(accident),
                accident.jobSite,
                accident.clientName,
                accident.technicianName,
                accident.nouNotified ? 'Yes' : 'No',
            ]),
            headStyles: { fillColor: [44, 36, 32] },
        });

        doc.save(`occupational-accidents-${Date.now()}.pdf`);
    }

    function openInvestigation(accident: OccupationalAccident) {
        setSelectedAccident(accident);
        setInvestigationData(investigationFromAccident(accident));
    }

    return (
        <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-200 bg-stone-950 px-5 py-5 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-red-500/15 p-2 text-red-200">
                            <FileWarning className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                                {isAdmin ? 'Incident command desk' : 'Field incident log'}
                            </p>
                            <h2 className="mt-1 text-xl font-semibold">
                                {isAdmin ? 'Accident Triage & Investigations' : 'Report an Occupational Accident'}
                            </h2>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-300">
                                {isAdmin
                                    ? 'Prioritise critical cases, track open investigations, and keep NOU notification visibility close to the review queue.'
                                    : 'Capture site incidents, near misses, refrigerant involvement, and any NOU notification while details are still fresh.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {isAdmin && accidents.length > 0 && (
                            <button
                                type="button"
                                onClick={exportPDF}
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </button>
                        )}
                        {!isAdmin && (
                            <button
                                type="button"
                                onClick={() => setShowForm(current => !current)}
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                            >
                                {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {showForm ? 'Close Form' : 'New Incident'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 border-b border-stone-200 bg-stone-50 p-4 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryTile label="Incidents" value={summary.total} icon={Activity} tone="stone" />
                <SummaryTile label="Critical / High" value={summary.urgent} icon={AlertOctagon} tone="red" />
                <SummaryTile label="Open Cases" value={summary.open} icon={ClipboardCheck} tone="amber" />
                <SummaryTile label="Near Misses" value={summary.nearMisses} icon={ShieldCheck} tone="blue" />
                <SummaryTile label="NOU Notified" value={summary.nouNotified} icon={CheckCircle2} tone="emerald" />
            </div>

            {isAdmin && (
                <div className="border-b border-stone-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
                        <Filter className="h-4 w-4 text-stone-500" />
                        Triage filters
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
                        <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Search</span>
                            <span className="relative block">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                <input
                                    value={searchTerm}
                                    onChange={event => setSearchTerm(event.target.value)}
                                    placeholder="Site, client, technician, refrigerant..."
                                    className="min-h-11 w-full rounded-lg border border-stone-200 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                                />
                            </span>
                        </label>
                        <FilterSelect
                            label="Region"
                            value={selectedRegion}
                            onChange={setSelectedRegion}
                            options={['all', ...ZIMBABWE_PROVINCES.map(province => province.name), 'Other']}
                        />
                        <FilterSelect
                            label="Severity"
                            value={selectedSeverity}
                            onChange={value => setSelectedSeverity(value as 'all' | OccupationalAccident['severity'])}
                            options={['all', 'Critical', 'High', 'Medium', 'Low']}
                        />
                        <FilterSelect
                            label="Status"
                            value={selectedStatus}
                            onChange={value => setSelectedStatus(value as 'all' | InvestigationStatus)}
                            options={['all', 'Open', 'Under Investigation', 'Closed']}
                        />
                    </div>
                </div>
            )}

            {showForm && (
                <IncidentForm
                    formData={formData}
                    setFormData={setFormData}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                />
            )}

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 divide-y divide-stone-100">
                    {filteredAccidents.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <AlertTriangle className="mx-auto h-9 w-9 text-stone-300" />
                            <p className="mt-3 text-sm font-semibold text-stone-700">No incidents match this view.</p>
                            <p className="mt-1 text-sm text-stone-500">
                                {isAdmin ? 'Adjust the filters to widen the triage queue.' : 'Use New Incident when an event needs to be logged.'}
                            </p>
                        </div>
                    ) : (
                        filteredAccidents.map(accident => (
                            <AccidentRow
                                key={accident.id}
                                accident={accident}
                                isAdmin={isAdmin}
                                onInvestigate={() => openInvestigation(accident)}
                            />
                        ))
                    )}
                </div>

                <aside className="border-t border-stone-200 bg-stone-50 p-4 lg:border-l lg:border-t-0">
                    <h3 className="text-sm font-semibold text-stone-900">
                        {isAdmin ? 'Open Priority Queue' : 'Severity Guide'}
                    </h3>
                    {isAdmin ? (
                        <div className="mt-3 space-y-2">
                            {newestOpen.length === 0 ? (
                                <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                                    No open investigations in this view.
                                </p>
                            ) : (
                                newestOpen.map(accident => (
                                    <button
                                        key={accident.id}
                                        type="button"
                                        onClick={() => openInvestigation(accident)}
                                        className="block min-h-11 w-full rounded-lg border border-stone-200 bg-white p-3 text-left transition-colors hover:border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100"
                                    >
                                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${severityStyles[accident.severity]}`}>
                                            {accident.severity}
                                        </span>
                                        <span className="mt-2 block truncate text-sm font-semibold text-stone-900">{accident.jobSite}</span>
                                        <span className="mt-0.5 block text-xs text-stone-500">{formatDate(accident.date)} · {accidentStatus(accident)}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {Object.entries(SeverityCategories).map(([key, category]) => (
                                <div key={key} className="rounded-lg border border-stone-200 bg-white p-3">
                                    <p className="text-sm font-semibold" style={{ color: category.color }}>
                                        {category.label}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-stone-600">{category.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>
            </div>

            {selectedAccident && (
                <InvestigationModal
                    accident={selectedAccident}
                    data={investigationData}
                    setData={setInvestigationData}
                    isSubmitting={isInvestigating}
                    onSubmit={handleInvestigationSubmit}
                    onClose={() => setSelectedAccident(null)}
                />
            )}
        </section>
    );
}

function SummaryTile({
    label,
    value,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number;
    icon: typeof Activity;
    tone: 'stone' | 'red' | 'amber' | 'blue' | 'emerald';
}) {
    const tones = {
        stone: 'bg-stone-100 text-stone-700',
        red: 'bg-red-100 text-red-700',
        amber: 'bg-amber-100 text-amber-700',
        blue: 'bg-blue-100 text-blue-700',
        emerald: 'bg-emerald-100 text-emerald-700',
    };

    return (
        <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
                <span className={`rounded-lg p-2 ${tones[tone]}`}>
                    <Icon className="h-4 w-4" />
                </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
        </div>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
}) {
    return (
        <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
            <select
                value={value}
                onChange={event => onChange(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            >
                {options.map(option => (
                    <option key={option} value={option}>
                        {option === 'all' ? `All ${label}` : option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function IncidentForm({
    formData,
    setFormData,
    isSubmitting,
    onSubmit,
}: {
    formData: {
        date: string;
        jobSite: string;
        clientName: string;
        severity: OccupationalAccident['severity'];
        description: string;
        refrigerantInvolved: string;
        nearMissFlag: boolean;
        nouNotified: boolean;
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        date: string;
        jobSite: string;
        clientName: string;
        severity: OccupationalAccident['severity'];
        description: string;
        refrigerantInvolved: string;
        nearMissFlag: boolean;
        nouNotified: boolean;
    }>>;
    isSubmitting: boolean;
    onSubmit: (event: React.FormEvent) => void;
}) {
    return (
        <form onSubmit={onSubmit} className="border-b border-red-100 bg-red-50/60 p-4">
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-white p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                <div>
                    <p className="text-sm font-semibold text-red-900">Capture only factual incident details.</p>
                    <p className="mt-1 text-sm text-red-700">
                        Use the description for what happened, immediate harm or near miss, equipment involved, and any first response taken.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Incident Date">
                    <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={event => setFormData(current => ({ ...current, date: event.target.value }))}
                        className="min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                </Field>
                <Field label="Severity">
                    <select
                        value={formData.severity}
                        onChange={event => setFormData(current => ({ ...current, severity: event.target.value as OccupationalAccident['severity'] }))}
                        className="min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    >
                        {Object.keys(SeverityCategories).map(key => (
                            <option key={key} value={key}>{key}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Job Site / Location">
                    <input
                        required
                        value={formData.jobSite}
                        onChange={event => setFormData(current => ({ ...current, jobSite: event.target.value }))}
                        placeholder="Harare cold-room site"
                        className="min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                </Field>
                <Field label="Client / Site Owner">
                    <input
                        required
                        value={formData.clientName}
                        onChange={event => setFormData(current => ({ ...current, clientName: event.target.value }))}
                        placeholder="Client name"
                        className="min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                </Field>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_260px]">
                <Field label="Description">
                    <textarea
                        required
                        rows={5}
                        value={formData.description}
                        onChange={event => setFormData(current => ({ ...current, description: event.target.value }))}
                        placeholder="What happened, who was affected, what equipment/refrigerant was involved, and what immediate action was taken?"
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                </Field>
                <div className="space-y-4">
                    <Field label="Refrigerant Involved">
                        <input
                            value={formData.refrigerantInvolved}
                            onChange={event => setFormData(current => ({ ...current, refrigerantInvolved: event.target.value }))}
                            placeholder="R-32, R-290..."
                            className="min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        />
                    </Field>
                    <label className="flex min-h-11 items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                        <input
                            type="checkbox"
                            checked={formData.nearMissFlag}
                            onChange={event => setFormData(current => ({ ...current, nearMissFlag: event.target.checked }))}
                            className="h-4 w-4 rounded border-stone-300 text-red-600 focus:ring-red-500"
                        />
                        Near miss, no injury
                    </label>
                    <label className="flex min-h-11 items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                        <input
                            type="checkbox"
                            checked={formData.nouNotified}
                            onChange={event => setFormData(current => ({ ...current, nouNotified: event.target.checked }))}
                            className="h-4 w-4 rounded border-stone-300 text-red-600 focus:ring-red-500"
                        />
                        NOU has been notified
                    </label>
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
                <FileWarning className="h-4 w-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
            </button>
        </form>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">{label}</span>
            {children}
        </label>
    );
}

function AccidentRow({
    accident,
    isAdmin,
    onInvestigate,
}: {
    accident: OccupationalAccident;
    isAdmin: boolean;
    onInvestigate: () => void;
}) {
    const status = accidentStatus(accident);
    const region = getRegionForAccident(accident);

    return (
        <article className="bg-white px-4 py-4 transition-colors hover:bg-stone-50 sm:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${severityStyles[accident.severity]}`}>
                            {accident.severity}
                        </span>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
                            {status}
                        </span>
                        {accident.nearMissFlag && (
                            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                Near miss
                            </span>
                        )}
                        {accident.nouNotified && (
                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                NOU notified
                            </span>
                        )}
                    </div>
                    <h3 className="mt-3 truncate text-base font-semibold text-stone-950">{accident.jobSite}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-stone-600">{accident.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(accident.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {region}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {isAdmin ? accident.technicianName : accident.clientName}
                        </span>
                        {accident.refrigerantInvolved && (
                            <span className="font-semibold text-stone-700">Refrigerant: {accident.refrigerantInvolved}</span>
                        )}
                    </div>
                </div>

                {isAdmin && (
                    <button
                        type="button"
                        onClick={onInvestigate}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        {status === 'Closed' ? <Eye className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
                        {status === 'Closed' ? 'Review' : 'Investigate'}
                    </button>
                )}
            </div>
        </article>
    );
}

function InvestigationModal({
    accident,
    data,
    setData,
    isSubmitting,
    onSubmit,
    onClose,
}: {
    accident: OccupationalAccident;
    data: InvestigationData;
    setData: React.Dispatch<React.SetStateAction<InvestigationData>>;
    isSubmitting: boolean;
    onSubmit: (event: React.FormEvent) => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
                <div className="sticky top-0 z-10 border-b border-stone-200 bg-white px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Investigation file</p>
                            <h3 className="mt-1 text-lg font-semibold text-stone-950">{accident.jobSite}</h3>
                            <p className="mt-1 text-sm text-stone-500">
                                {formatDate(accident.date)} · {accident.clientName} · {accident.severity}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-200"
                            aria-label="Close investigation"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-5 p-5">
                    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                        <p className="text-sm font-semibold text-stone-900">Reported incident</p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">{accident.description}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Investigation Date">
                            <input
                                type="date"
                                value={data.investigationDate}
                                onChange={event => setData(current => ({ ...current, investigationDate: event.target.value }))}
                                className="min-h-11 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </Field>
                        <Field label="Status">
                            <select
                                value={data.status}
                                onChange={event => setData(current => ({ ...current, status: event.target.value as InvestigationStatus }))}
                                className="min-h-11 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="Open">Open</option>
                                <option value="Under Investigation">Under Investigation</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </Field>
                    </div>

                    <Field label="Investigator Name">
                        <input
                            value={data.investigatorName}
                            onChange={event => setData(current => ({ ...current, investigatorName: event.target.value }))}
                            placeholder="Safety officer or reviewer"
                            className="min-h-11 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </Field>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">Root Cause</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {Object.entries(RootCauseCategories).map(([key, category]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setData(current => ({ ...current, rootCause: key as keyof typeof RootCauseCategories }))}
                                    className={`min-h-11 rounded-lg border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                                        data.rootCause === key
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-stone-200 bg-white hover:border-stone-300'
                                    }`}
                                >
                                    <span className="block text-sm font-semibold" style={{ color: category.color }}>
                                        {category.label}
                                    </span>
                                    <span className="mt-1 block text-xs leading-5 text-stone-500">{category.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Field label="Corrective Actions">
                        <textarea
                            rows={4}
                            value={data.correctiveActions}
                            onChange={event => setData(current => ({ ...current, correctiveActions: event.target.value }))}
                            placeholder="Immediate controls, repairs, medical response, isolation, or retraining already done."
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </Field>

                    <Field label="Preventive Measures">
                        <textarea
                            rows={4}
                            value={data.preventiveMeasures}
                            onChange={event => setData(current => ({ ...current, preventiveMeasures: event.target.value }))}
                            placeholder="Longer-term process, training, PPE, equipment, or supervision changes."
                            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </Field>

                    <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ClipboardCheck className="h-4 w-4" />
                            {isSubmitting ? 'Saving...' : 'Save Investigation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
