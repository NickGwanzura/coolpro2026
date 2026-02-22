'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ClipboardList,
    CheckCircle,
    Clock,
    MapPin,
    Plus,
    FileText,
    ArrowRight,
    Search,
    Filter
} from 'lucide-react';
import { MOCK_JOBS, Job } from '@/constants/jobs';

export default function JobsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredJobs = MOCK_JOBS.filter(job =>
        job.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.equipmentType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: Job['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'scheduled': return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Jobs & Logs</h1>
                    <p className="text-gray-500 mt-1">Track your installations, service calls, and compliance records</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                    <Plus className="h-4 w-4" />
                    Record New Job
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by client, location, or equipment..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter className="h-4 w-4" />
                        Refine Search
                    </button>
                </div>
            </div>

            {/* Jobs List */}
            <div className="grid gap-4">
                {filteredJobs.map((job) => (
                    <div key={job.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-all group">
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
                                        {job.equipmentType}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                        <Clock className="h-3.5 w-3.5" />
                                        Installed: {job.date}
                                    </div>
                                    {job.serialNumber && (
                                        <div className="flex items-center gap-2 text-gray-400 text-xs font-mono">
                                            SN: {job.serialNumber}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {job.status === 'completed' && (
                                    <button
                                        onClick={() => router.push(`/jobs/request-coc?jobId=${job.id}`)}
                                        className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all border border-blue-100"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Request CoC
                                    </button>
                                )}
                                <button className="flex items-center gap-2 text-gray-500 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all">
                                    View Details
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
