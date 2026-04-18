import React, { useMemo, useState } from 'react';
import { AlertTriangle, Clock, MapPin, User, Download, Plus, X, Search, ClipboardCheck } from 'lucide-react';
import { OccupationalAccident, SeverityCategories, RootCauseCategories } from '../types';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';

interface InvestigationData {
    rootCause: keyof typeof RootCauseCategories;
    investigationDate: string;
    investigatorName: string;
    correctiveActions: string;
    preventiveMeasures: string;
    status: 'Open' | 'Under Investigation' | 'Closed';
}

interface OccupationalAccidentSectionProps {
    isAdmin?: boolean;
    initialAccidents?: OccupationalAccident[];
}

const OccupationalAccidentSection: React.FC<OccupationalAccidentSectionProps> = ({
    isAdmin = false,
    initialAccidents = [
        {
            id: 'demo1',
            date: '2026-01-15',
            jobSite: 'Harare Central Hospital',
            clientName: 'Ministry of Health',
            severity: 'Low',
            description: 'Minor slip on wet floor during routine maintenance. No injury.',
            technicianName: 'John Moyo'
        },
        {
            id: 'demo2',
            date: '2026-02-02',
            jobSite: 'Bulawayo Industrial Park',
            clientName: 'Delta Corporation',
            severity: 'Medium',
            description: 'Small refrigerant leak detected in compressor room B. Repaired immediately.',
            technicianName: 'Sarah Miller'
        },
        {
            id: 'demo3',
            date: '2026-02-18',
            jobSite: 'Mutare Logistics Hub',
            clientName: 'Swift Transport',
            severity: 'High',
            description: 'Power surge damaged control panel. Sparking observed. Replacement required.',
            technicianName: 'Peter Dube'
        }
    ]
}) => {
    const [accidents, setAccidents] = useState<OccupationalAccident[]>(initialAccidents);
    const [showForm, setShowForm] = useState(false);
    const [selectedAccident, setSelectedAccident] = useState<OccupationalAccident | null>(null);
    const [showInvestigation, setShowInvestigation] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedSeverity, setSelectedSeverity] = useState<'all' | OccupationalAccident['severity']>('all');
    const [selectedInvestigationStatus, setSelectedInvestigationStatus] = useState<'all' | 'Open' | 'Under Investigation' | 'Closed'>('all');
    const [investigationData, setInvestigationData] = useState<InvestigationData>({
        rootCause: 'NEGLIGENCE',
        investigationDate: new Date().toISOString().split('T')[0],
        investigatorName: '',
        correctiveActions: '',
        preventiveMeasures: '',
        status: 'Open'
    });
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        jobSite: '',
        clientName: '',
        severity: 'Medium' as OccupationalAccident['severity'],
        description: ''
    });

    const handleInvestigationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAccident) {
            const updatedAccidents = accidents.map(acc =>
                acc.id === selectedAccident.id
                    ? { ...acc, ...investigationData }
                    : acc
            );
            setAccidents(updatedAccidents);
            setShowInvestigation(false);
            setSelectedAccident(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newAccident: OccupationalAccident = {
            id: Math.random().toString(36).substr(2, 9),
            ...formData,
            technicianName: 'Demo Technician' // In a real app, this would come from session
        };
        setAccidents([newAccident, ...accidents]);
        setShowForm(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            jobSite: '',
            clientName: '',
            severity: 'Medium',
            description: ''
        });
    };

    const getRegionForAccident = (accident: OccupationalAccident) => {
        const haystack = `${accident.jobSite} ${accident.clientName}`.toLowerCase();

        for (const province of ZIMBABWE_PROVINCES) {
            if (haystack.includes(province.name.toLowerCase())) {
                return province.name;
            }

            const matchingDistrict = province.districts.find(district => haystack.includes(district.toLowerCase()));
            if (matchingDistrict) {
                return province.name;
            }
        }

        return 'Other';
    };

    const filteredAccidents = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return accidents.filter(accident => {
            const region = getRegionForAccident(accident);
            const matchesSearch =
                !term ||
                [
                    accident.jobSite,
                    accident.clientName,
                    accident.description,
                    accident.technicianName,
                    region,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(term);

            const matchesRegion = selectedRegion === 'all' || region === selectedRegion;
            const matchesSeverity = selectedSeverity === 'all' || accident.severity === selectedSeverity;
            const matchesInvestigationStatus =
                selectedInvestigationStatus === 'all' ||
                (accident.status ?? 'Open') === selectedInvestigationStatus;

            return matchesSearch && matchesRegion && matchesSeverity && matchesInvestigationStatus;
        });
    }, [accidents, searchTerm, selectedRegion, selectedSeverity, selectedInvestigationStatus]);

    const oversightSummary = useMemo(() => {
        return {
            total: filteredAccidents.length,
            criticalHigh: filteredAccidents.filter(accident => accident.severity === 'Critical' || accident.severity === 'High').length,
            openCases: filteredAccidents.filter(accident => (accident.status ?? 'Open') !== 'Closed').length,
            regions: new Set(filteredAccidents.map(accident => getRegionForAccident(accident))).size,
        };
    }, [filteredAccidents]);

    const exportPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('HEVACRAZ 2026 - Occupational Accident Report', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        // Summary by Severity
        const summary = filteredAccidents.reduce((acc, curr) => {
            acc[curr.severity] = (acc[curr.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Summary by Severity', 14, 45);

        let y = 55;
        Object.entries(summary).forEach(([severity, count]) => {
            doc.setFontSize(11);
            doc.text(`${severity}: ${count}`, 20, y);
            y += 7;
        });

        // Detailed Table
        autoTable(doc, {
            startY: y + 10,
            head: [['Date', 'Region', 'Job Site', 'Client', 'Severity', 'Description', 'Reported By']],
            body: filteredAccidents.map(a => [
                a.date,
                getRegionForAccident(a),
                a.jobSite,
                a.clientName,
                a.severity,
                a.description,
                a.technicianName
            ]),
            headStyles: { fillColor: [30, 41, 59] }, // slate-800
        });

        doc.save(`Occupational_Accidents_${Date.now()}.pdf`);
    };

    const getSeverityColor = (severity: OccupationalAccident['severity']) => {
        switch (severity) {
            case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        {isAdmin ? 'Occupational Accident Oversight' : 'Occupational Accidents'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {isAdmin ? 'Monitor logged accidents by region, severity, and investigation status' : 'Log and view safety incidents'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && accidents.length > 0 && (
                        <button
                            onClick={exportPDF}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Export Report
                        </button>
                    )}
                    {!isAdmin && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                        >
                            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {showForm ? 'Cancel' : 'Log Accident'}
                        </button>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="border-b border-gray-100 bg-white px-6 py-5">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <SummaryTile label="Filtered Incidents" value={oversightSummary.total} />
                        <SummaryTile label="Critical / High" value={oversightSummary.criticalHigh} />
                        <SummaryTile label="Open Cases" value={oversightSummary.openCases} />
                        <SummaryTile label="Regions" value={oversightSummary.regions} />
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="xl:col-span-2">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={searchTerm}
                                    onChange={event => setSearchTerm(event.target.value)}
                                    placeholder="Search site, client, technician, region..."
                                    className="w-full border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
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
                            label="Investigation"
                            value={selectedInvestigationStatus}
                            onChange={value => setSelectedInvestigationStatus(value as 'all' | 'Open' | 'Under Investigation' | 'Closed')}
                            options={['all', 'Open', 'Under Investigation', 'Closed']}
                        />
                    </div>
                </div>
            )}

            {showForm && (
                <div className="p-6 bg-red-50/50 border-b border-red-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Date of Incident</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Severity</label>
                                <select
                                    value={formData.severity}
                                    onChange={e => setFormData({ ...formData, severity: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">{SeverityCategories[formData.severity as keyof typeof SeverityCategories]?.description}</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Job Site / Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Harare North Substation"
                                    required
                                    value={formData.jobSite}
                                    onChange={e => setFormData({ ...formData, jobSite: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Client Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. OK Zimbabwe"
                                    required
                                    value={formData.clientName}
                                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Description of Incident</label>
                            <textarea
                                placeholder="Briefly describe what happened..."
                                required
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                        >
                            Submit Incident Report
                        </button>
                    </form>
                </div>
            )}

            {/* Severity Legend */}
            <div className="p-6 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-700 mb-4">Severity Classification Guide</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {Object.entries(SeverityCategories).map(([key, category]) => (
                        <div
                            key={key}
                            className="p-3 border"
                            style={{ backgroundColor: category.bgColor, borderColor: category.color }}
                        >
                            <p className="font-bold text-sm" style={{ color: category.color }}>{category.label}</p>
                            <p className="text-xs mt-1 text-gray-600">{category.description}</p>
                            <p className="text-xs mt-2 font-semibold text-gray-500">Examples:</p>
                            <p className="text-xs text-gray-500 italic">{category.examples.join(', ')}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Severity</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location / Site</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                            {isAdmin && <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reported By</th>}
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                            {isAdmin && <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Investigation</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {accidents.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 7 : 5} className="px-6 py-12 text-center text-gray-400">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                    No accidents recorded for this period
                                </td>
                            </tr>
                        ) : (
                            filteredAccidents.map((accident) => (
                                <tr key={accident.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            {new Date(accident.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 text-xs font-bold border ${getSeverityColor(accident.severity)}`}>
                                            {accident.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            {accident.jobSite}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {accident.clientName}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {accident.technicianName}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={accident.description}>
                                        {accident.description}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => {
                                                    setSelectedAccident(accident);
                                                    setInvestigationData({
                                                        rootCause: (accident.rootCause as keyof typeof RootCauseCategories) || 'NEGLIGENCE',
                                                        investigationDate: accident.investigationDate || new Date().toISOString().split('T')[0],
                                                        investigatorName: accident.investigatorName || '',
                                                        correctiveActions: accident.correctiveActions || '',
                                                        preventiveMeasures: accident.preventiveMeasures || '',
                                                        status: accident.status || 'Open'
                                                    });
                                                    setShowInvestigation(true);
                                                }}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                                            >
                                                <ClipboardCheck className="h-3 w-3" />
                                                {accident.status ? 'View' : 'Investigate'}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {isAdmin && filteredAccidents.length === 0 && accidents.length > 0 && (
                    <div className="px-6 py-8 text-center text-sm text-gray-500">
                        No incidents match the current oversight filters.
                    </div>
                )}
            </div>

            {/* Investigation Modal */}
            {selectedAccident && (
                <InvestigationModal
                    accident={selectedAccident}
                    isOpen={showInvestigation}
                    onClose={() => {
                        setShowInvestigation(false);
                        setSelectedAccident(null);
                    }}
                    data={investigationData}
                    setData={setInvestigationData}
                    onSubmit={handleInvestigationSubmit}
                />
            )}
        </div>
    );
};

const SummaryTile = ({ label, value }: { label: string; value: number }) => (
    <div className="border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
);

const FilterSelect = ({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
}) => (
    <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>
        <select
            value={value}
            onChange={event => onChange(event.target.value)}
            className="w-full border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-purple-500"
        >
            {options.map(option => (
                <option key={option} value={option}>
                    {option === 'all' ? `All ${label}` : option}
                </option>
            ))}
        </select>
    </div>
);

// Investigation Modal
const InvestigationModal = ({
    accident,
    isOpen,
    onClose,
    data,
    setData,
    onSubmit
}: {
    accident: OccupationalAccident;
    isOpen: boolean;
    onClose: () => void;
    data: InvestigationData;
    setData: React.Dispatch<React.SetStateAction<InvestigationData>>;
    onSubmit: (e: React.FormEvent) => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Incident Investigation</h3>
                        <p className="text-sm text-gray-500">{accident.jobSite} - {accident.date}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-6">
                    {/* Root Cause Analysis */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700">Root Cause Category</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(RootCauseCategories).map(([key, category]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setData({ ...data, rootCause: key as any })}
                                    className={`p-3 border-2 text-left transition-all ${
                                        data.rootCause === key
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <p className="font-semibold text-sm" style={{ color: category.color }}>{category.label}</p>
                                    <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Investigation Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase">Investigation Date</label>
                            <input
                                type="date"
                                value={data.investigationDate}
                                onChange={e => setData({ ...data, investigationDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase">Status</label>
                            <select
                                value={data.status}
                                onChange={e => setData({ ...data, status: e.target.value as any })}
                                className="w-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="Open">Open</option>
                                <option value="Under Investigation">Under Investigation</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase">Investigator Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Safety Manager"
                            value={data.investigatorName}
                            onChange={e => setData({ ...data, investigatorName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase">Immediate Corrective Actions</label>
                        <textarea
                            placeholder="What immediate actions were taken?"
                            rows={3}
                            value={data.correctiveActions}
                            onChange={e => setData({ ...data, correctiveActions: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase">Preventive Measures (Long-term Solutions)</label>
                        <textarea
                            placeholder="What will prevent this from happening again?"
                            rows={3}
                            value={data.preventiveMeasures}
                            onChange={e => setData({ ...data, preventiveMeasures: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                    >
                        Save Investigation Report
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OccupationalAccidentSection;
