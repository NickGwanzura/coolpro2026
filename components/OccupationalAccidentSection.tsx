
import React, { useState } from 'react';
import { AlertTriangle, Clock, MapPin, User, ChevronDown, ChevronUp, Download, Plus, X } from 'lucide-react';
import { OccupationalAccident } from '../types';

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
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        jobSite: '',
        clientName: '',
        severity: 'Medium' as OccupationalAccident['severity'],
        description: ''
    });

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

    const exportPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('CoolPro 2026 - Occupational Accident Report', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        // Summary by Severity
        const summary = accidents.reduce((acc, curr) => {
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
            head: [['Date', 'Job Site', 'Client', 'Severity', 'Description', 'Reported By']],
            body: accidents.map(a => [
                a.date,
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Occupational Accidents</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {isAdmin ? 'Monitoring safety performance across all sites' : 'Log and view safety incidents'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && accidents.length > 0 && (
                        <button
                            onClick={exportPDF}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Export Report
                        </button>
                    )}
                    {!isAdmin && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                        >
                            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {showForm ? 'Cancel' : 'Log Accident'}
                        </button>
                    )}
                </div>
            </div>

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
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Severity</label>
                                <select
                                    value={formData.severity}
                                    onChange={e => setFormData({ ...formData, severity: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Job Site / Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Harare North Substation"
                                    required
                                    value={formData.jobSite}
                                    onChange={e => setFormData({ ...formData, jobSite: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
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
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
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
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                        >
                            Submit Incident Report
                        </button>
                    </form>
                </div>
            )}

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
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {accidents.length === 0 ? (
                            <tr>
                                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-gray-400">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                    No accidents recorded for this period
                                </td>
                            </tr>
                        ) : (
                            accidents.map((accident) => (
                                <tr key={accident.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            {new Date(accident.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getSeverityColor(accident.severity)}`}>
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
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OccupationalAccidentSection;
