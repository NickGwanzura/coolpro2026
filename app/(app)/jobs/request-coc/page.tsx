'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    FileText,
    CheckCircle,
    AlertCircle,
    Send,
    ClipboardList,
    ShieldCheck
} from 'lucide-react';
import { MOCK_JOBS, Job } from '@/constants/jobs';

function RequestCoCForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('jobId');

    const [job, setJob] = useState<Job | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        equipmentType: '',
        serialNumber: '',
        installationDate: '',
        details: '',
        complianceCheck: false
    });

    useEffect(() => {
        if (jobId) {
            const foundJob = MOCK_JOBS.find(j => j.id === jobId);
            if (foundJob) {
                setJob(foundJob);
                setFormData(prev => ({
                    ...prev,
                    equipmentType: foundJob.equipmentType,
                    serialNumber: foundJob.serialNumber || '',
                    installationDate: foundJob.date
                }));
            }
        }
    }, [jobId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Mock API call
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
            setTimeout(() => {
                router.push('/jobs');
            }, 3000);
        }, 1500);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h1>
                <p className="text-gray-500 text-center max-w-md">
                    Your Certificate of Conformity request has been sent to the National Admin for review.
                    You will be notified once it is issued.
                </p>
                <p className="text-sm text-blue-600 mt-6 font-medium animate-pulse">
                    Redirecting to jobs board...
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-xl hover:bg-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Request Certificate of Conformity</h1>
                    <p className="text-gray-500 text-sm">Submit installation details for professional verification</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Job Summary Card */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-blue-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Compliance Verification</span>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Client / Project</p>
                            <h2 className="text-xl font-bold">{job?.clientName || 'Manual Entry'}</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-400">Location</p>
                                <p className="text-sm font-medium">{job?.location || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Job ID</p>
                                <p className="text-sm font-medium font-mono text-blue-300">{jobId || 'NEW-SUBMISSION'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <FileText className="h-24 w-24" />
                    </div>
                </div>

                {/* Form Sections */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Equipment Type</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.equipmentType}
                                onChange={e => setFormData({ ...formData, equipmentType: e.target.value })}
                                placeholder="e.g. R-744 Transcritical"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Serial Number</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.serialNumber}
                                onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                placeholder="Unit Serial Number"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Completion Date</label>
                            <input
                                required
                                type="date"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.installationDate}
                                onChange={e => setFormData({ ...formData, installationDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Installation Details & Safety Measures</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]"
                            value={formData.details}
                            onChange={e => setFormData({ ...formData, details: e.target.value })}
                            placeholder="Describe the installation, pressure tests performed, and leak checks conducted..."
                        />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <div className="pt-0.5">
                            <input
                                type="checkbox"
                                required
                                id="compliance"
                                className="h-4 w-4 text-blue-600 border-amber-300 rounded focus:ring-amber-500"
                                checked={formData.complianceCheck}
                                onChange={e => setFormData({ ...formData, complianceCheck: e.target.checked })}
                            />
                        </div>
                        <label htmlFor="compliance" className="text-sm text-amber-900 font-medium">
                            I certify that this installation complies with the Zimbabwe National Refrigeration
                            Standards and all safety protocols for high-pressure systems were followed.
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all"
                    >
                        {submitting ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting Request...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Submit for Verification
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                        Digital ID: TECH-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                </div>
            </form>
        </div>
    );
}

export default function RequestCoCPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        }>
            <RequestCoCForm />
        </Suspense>
    );
}
