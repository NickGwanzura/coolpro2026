'use client';

import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { getSession, UserSession } from '@/lib/auth';
import { STORAGE_KEYS, readCollection } from '@/lib/platformStore';
import { useSupplierApplications } from '@/lib/api';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import {
    ClipboardCheck,
    Award,
    Gift,
    TrendingUp,
    ArrowRight,
    Download,
    Users,
    MapPin,
    Clock,
    Wrench,
    Thermometer,
    ShieldAlert,
    Plus,
    Building2,
    CheckCircle2,
    AlertTriangle,
    CalendarDays,
    Droplets,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import OccupationalAccidentSection from '@/components/OccupationalAccidentSection';
import { CertificateRecord, PlannerJob, RefrigerantLog } from '@/types/index';
import { BRAND as colors } from '@/constants/colors';
import { MOCK_JOBS } from '@/constants/jobs';


const ADMIN_REGION_MULTIPLIERS: Record<string, number> = {
    all: 1,
    Harare: 1,
    Bulawayo: 0.68,
    Manicaland: 0.54,
    Masvingo: 0.48,
    Midlands: 0.6,
    'Matabeleland North': 0.42,
    'Matabeleland South': 0.38,
    'Mashonaland West': 0.5,
    'Mashonaland Central': 0.44,
    'Mashonaland East': 0.52,
};

const ADMIN_BASE_BY_RANGE = {
    today: { activeTechs: 24, totalJobs: 15, pendingCocs: 8, regions: 5, safetyIncidents: 2 },
    week: { activeTechs: 31, totalJobs: 89, pendingCocs: 14, regions: 8, safetyIncidents: 4 },
    month: { activeTechs: 52, totalJobs: 342, pendingCocs: 27, regions: 10, safetyIncidents: 7 },
} as const;

const roundedMetric = (value: number, minimum = 1) => Math.max(minimum, Math.round(value));

export default function DashboardPage() {
    const [session, setSession] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState('today');
    const [regionFilter, setRegionFilter] = useState('all');
    const { data: supplierApplications = [] } = useSupplierApplications();
    const [plannerJobs, setPlannerJobs] = useState<PlannerJob[]>([]);
    const [refrigerantLogs, setRefrigerantLogs] = useState<RefrigerantLog[]>([]);
    const [certificateRecords, setCertificateRecords] = useState<CertificateRecord[]>([]);

    useEffect(() => {
        const userSession = getSession();
        setSession(userSession);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        setPlannerJobs(readCollection<PlannerJob>(STORAGE_KEYS.plannerJobs, []));
        setRefrigerantLogs(readCollection<RefrigerantLog>(STORAGE_KEYS.fieldToolkitLogs, []));
        setCertificateRecords(readCollection<CertificateRecord>(STORAGE_KEYS.certificateRecords, []));
    }, []);

    // Role-based KPI cards
    const isAdmin = session?.role === 'org_admin';
    const pendingSupplierApplications = supplierApplications.filter(
        application => application.status === 'submitted' || application.status === 'under-review'
    );
    const supplierSummary = {
        pendingApplications: pendingSupplierApplications.length,
        approvedApplications: supplierApplications.filter(application => application.status === 'approved').length,
        rejectedApplications: supplierApplications.filter(application => application.status === 'rejected').length,
        latestApplications: pendingSupplierApplications.slice(0, 3),
    };

    // Technician KPIs
    const technicianStats = [
        {
            label: 'Jobs Completed',
            value: dateRange === 'today' ? '3' : dateRange === 'week' ? '12' : '48',
            icon: ClipboardCheck,
            color: 'blue',
            trend: dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This week' : 'This month'
        },
        {
            label: 'Pending COCs',
            value: '2',
            icon: Clock,
            color: 'amber',
            trend: '1 awaiting approval'
        },
        {
            label: 'Rewards Points',
            value: '450',
            icon: Gift,
            color: 'emerald',
            trend: '+50 this month'
        },
        {
            label: 'Certifications',
            value: '5',
            icon: Award,
            color: 'purple',
            trend: '2 expiring soon'
        },
    ];

    const adminMetrics = useMemo(() => {
        const rangeMetrics = ADMIN_BASE_BY_RANGE[dateRange as keyof typeof ADMIN_BASE_BY_RANGE] ?? ADMIN_BASE_BY_RANGE.today;
        const multiplier = ADMIN_REGION_MULTIPLIERS[regionFilter] ?? 1;

        return {
            activeTechs: roundedMetric(rangeMetrics.activeTechs * multiplier),
            totalJobs: roundedMetric(rangeMetrics.totalJobs * multiplier),
            pendingCocs: roundedMetric(rangeMetrics.pendingCocs * multiplier),
            regions: regionFilter === 'all' ? rangeMetrics.regions : 1,
            safetyIncidents: roundedMetric(rangeMetrics.safetyIncidents * Math.max(multiplier, 0.5)),
        };
    }, [dateRange, regionFilter]);

    // Admin KPIs
    const adminStats = [
        {
            label: 'Active Techs',
            value: String(adminMetrics.activeTechs),
            icon: Users,
            color: 'blue',
            trend: regionFilter === 'all' ? 'All registered regions' : `${regionFilter} only`
        },
        {
            label: 'Total Jobs',
            value: String(adminMetrics.totalJobs),
            icon: Wrench,
            color: 'emerald',
            trend: regionFilter === 'all' ? 'Filtered by reporting range' : `Filtered to ${regionFilter}`
        },
        {
            label: 'Pending COCs',
            value: String(adminMetrics.pendingCocs),
            icon: Award,
            color: 'amber',
            trend: 'Awaiting review'
        },
        {
            label: 'Regions',
            value: String(adminMetrics.regions),
            icon: MapPin,
            color: 'purple',
            trend: regionFilter === 'all' ? 'Coverage in current range' : 'Selected region'
        },
        {
            label: 'Safety Incidents',
            value: String(adminMetrics.safetyIncidents),
            icon: ShieldAlert,
            color: 'red',
            trend: 'Across logged incidents'
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D97706]"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-[#78716C]">Please log in to view the dashboard</p>
                <a
                    href="/login"
                    className="px-4 py-2 bg-[#D97706] text-white hover:bg-[#b45309] transition-colors"
                >
                    Go to Login
                </a>
            </div>
        );
    }

    const stats = isAdmin ? adminStats : technicianStats;
    type QuickAction = {
        href: string;
        title: string;
        detail: string;
        icon: typeof Users;
        iconClassName: string;
        iconStyle?: CSSProperties;
    };

    const adminQuickActions: QuickAction[] = [
        {
            href: '/technician-registry',
            title: 'Tech Registry',
            detail: 'Registered technicians & PDF reports',
            icon: Users,
            iconClassName: 'bg-sky-100 text-sky-600',
        },
        {
            href: '/jobs',
            title: 'Jobs & Logs',
            detail: 'Operational records across technicians',
            icon: ClipboardCheck,
            iconClassName: 'bg-purple-100 text-purple-600',
        },
        {
            href: '/certifications',
            title: 'Certification Overview',
            detail: 'Applications and processed certificates',
            icon: Award,
            iconClassName: 'bg-amber-100 text-amber-600',
        },
        {
            href: '/rewards',
            title: 'Rewards Overview',
            detail: 'All active rewards and vendor coverage',
            icon: Gift,
            iconClassName: 'bg-emerald-100 text-emerald-600',
        },
        {
            href: '/nou-dashboard',
            title: 'Supplier Review',
            detail: 'NOU queue and approvals',
            icon: Building2,
            iconClassName: 'bg-orange-100 text-orange-600',
        },
        {
            href: '/safety',
            title: 'Safety Oversight',
            detail: 'Regional accident monitoring and reports',
            icon: ShieldAlert,
            iconClassName: 'bg-red-100 text-red-600',
        },
    ];
    const technicianQuickActions: QuickAction[] = [
        {
            href: '/sizing-tool',
            title: 'Commercial Refrigeration System Sizing Tool',
            detail: 'Calculate load and refrigerant controls',
            icon: Thermometer,
            iconClassName: '',
            iconStyle: { backgroundColor: colors.secondary + '20', color: colors.secondary },
        },
        {
            href: '/field-toolkit',
            title: 'Field Toolkit',
            detail: 'Installations & Logs',
            icon: Wrench,
            iconClassName: '',
            iconStyle: { backgroundColor: colors.accent + '20', color: colors.accent },
        },
        {
            href: '/jobs',
            title: 'Jobs & Logs',
            detail: 'View all records',
            icon: ClipboardCheck,
            iconClassName: 'bg-purple-100 text-purple-600',
        },
        {
            href: '/certifications',
            title: 'Certifications',
            detail: 'Manage COCs',
            icon: Award,
            iconClassName: 'bg-amber-100 text-amber-600',
        },
    ];

    // Technician-specific derived data
    const today = new Date();
    const recentJobs = MOCK_JOBS.slice(0, 5);
    const scheduledJobs = plannerJobs
        .filter(job => job.status === 'scheduled' && new Date(job.scheduledDate) >= today)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 4);
    const recentLogs = refrigerantLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    const now = today.getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const expiringSoonCerts = certificateRecords.filter(cert => {
        const expiry = new Date(cert.expiryDate).getTime();
        return expiry > now && expiry - now <= thirtyDays;
    });
    const expiredCerts = certificateRecords.filter(cert => new Date(cert.expiryDate).getTime() <= now);
    const validCerts = certificateRecords.filter(cert => {
        const expiry = new Date(cert.expiryDate).getTime();
        return expiry > now + thirtyDays;
    });

    const MOCK_CERTS = [
        { id: 'c1', certificateNumber: 'ZW-RAC-2024-0441', certificateType: 'RAC Handling Licence', issuingBody: 'NEC Engineering', issueDate: '2024-03-10', expiryDate: '2026-03-10', status: 'valid' as const, technicianId: 'demo', technicianName: 'Demo Tech', verificationToken: '', verificationUrl: '' },
        { id: 'c2', certificateNumber: 'ZW-RAC-2024-0812', certificateType: 'F-Gas Certificate', issuingBody: 'VTC Harare', issueDate: '2023-11-01', expiryDate: '2026-04-30', status: 'valid' as const, technicianId: 'demo', technicianName: 'Demo Tech', verificationToken: '', verificationUrl: '' },
        { id: 'c3', certificateNumber: 'ZW-RAC-2022-0190', certificateType: 'HFO Refrigerant Handling', issuingBody: 'ZIMCHE', issueDate: '2022-06-15', expiryDate: '2025-06-15', status: 'expired' as const, technicianId: 'demo', technicianName: 'Demo Tech', verificationToken: '', verificationUrl: '' },
    ];
    const displayCerts = certificateRecords.length > 0 ? certificateRecords.slice(0, 5) : MOCK_CERTS;

    const exportAdminCsv = () => {
        if (!isAdmin) return;

        const rows = [
            ['Metric', 'Value', 'Range', 'Region'],
            ...adminStats.map(stat => [stat.label, stat.value, dateRange, regionFilter]),
        ];

        const csv = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `admin-kpis-${dateRange}-${regionFilter}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportAdminPdf = async () => {
        if (!isAdmin) return;

        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('HEVACRAZ Admin KPI Report', 14, 18);
        doc.setFontSize(10);
        doc.text(`Range: ${dateRange}`, 14, 26);
        doc.text(`Region: ${regionFilter}`, 14, 32);
        doc.text(`Generated: ${new Date().toLocaleString('en-ZW')}`, 14, 38);

        autoTable(doc, {
            startY: 46,
            head: [['Metric', 'Value', 'Trend']],
            body: adminStats.map(stat => [stat.label, stat.value, stat.trend]),
            headStyles: { fillColor: [44, 36, 32] },
        });

        doc.save(`admin-kpis-${dateRange}-${regionFilter}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-[#1C1917]">
                        {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
                    </h1>
                    <p className="text-sm text-[#78716C] mt-0.5">Welcome back, {session.name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Filter */}
                    <div className="flex items-center border border-[#E7E5E4] bg-white divide-x divide-[#E7E5E4]">
                        {(['today', 'week', 'month'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${
                                    dateRange === range
                                        ? 'bg-[#1C1917] text-white'
                                        : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAFAF9]'
                                }`}
                            >
                                {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
                            </button>
                        ))}
                    </div>
                    {isAdmin && (
                        <select
                            value={regionFilter}
                            onChange={(event) => setRegionFilter(event.target.value)}
                            className="border border-[#E7E5E4] bg-white px-3 py-2 text-sm font-medium text-[#44403C] outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]"
                        >
                            <option value="all">All Regions</option>
                            {ZIMBABWE_PROVINCES.map((province) => (
                                <option key={province.id} value={province.name}>
                                    {province.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {isAdmin && (
                        <button
                            onClick={exportAdminCsv}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#44403C] bg-white border border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            CSV
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={exportAdminPdf}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#44403C] bg-white border border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Demo Banner */}
            {session.isDemo && (
                <div className="border border-[#D97706]/30 bg-[#D97706]/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Award className="h-4 w-4 text-[#D97706] flex-shrink-0" />
                        <p className="text-sm text-[#44403C]">
                            Demo mode — <span className="font-semibold capitalize">{session.role.replace('_', ' ')}</span> · {session.region}
                        </p>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const colorClasses: Record<string, string> = {
                        blue: 'bg-blue-50 text-blue-600',
                        amber: 'bg-amber-50 text-amber-600',
                        emerald: 'bg-emerald-50 text-emerald-600',
                        purple: 'bg-purple-50 text-purple-600',
                        red: 'bg-red-50 text-red-600',
                    };

                    return (
                        <div
                            key={index}
                            className="bg-white p-6 border border-[#E7E5E4]"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-2.5 ${colorClasses[stat.color]}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="mt-4">
                                <p className="text-3xl font-bold text-[#1C1917]">{stat.value}</p>
                                <p className="text-sm text-[#78716C] mt-1">{stat.label}</p>
                                <p className="text-xs text-[#A8A29E] mt-2">{stat.trend}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Supplier Review - Admin */}
            {isAdmin && (
                <div className="bg-white border border-[#E7E5E4] p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-[#1C1917]">
                                Supplier Review Queue
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Supplier applications from the mock intake flow are synced here for NOU review.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/nou-dashboard"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#D97706] hover:bg-[#b45309] transition-colors"
                            >
                                Open NOU Dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/suppliers"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-[#E7E5E4] bg-white text-[#44403C] hover:bg-[#FAFAF9] transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Supplier Management
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                        <div className="border border-[#E7E5E4] bg-[#FAFAF9] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Pending</p>
                            <p className="mt-2 text-3xl font-bold text-[#1C1917]">{supplierSummary.pendingApplications}</p>
                        </div>
                        <div className="border border-[#E7E5E4] bg-[#FAFAF9] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Approved</p>
                            <p className="mt-2 text-3xl font-bold text-[#1C1917]">{supplierSummary.approvedApplications}</p>
                        </div>
                        <div className="border border-[#E7E5E4] bg-[#FAFAF9] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Rejected</p>
                            <p className="mt-2 text-3xl font-bold text-[#1C1917]">{supplierSummary.rejectedApplications}</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {supplierSummary.latestApplications.length === 0 ? (
                            <div className="border border-dashed border-[#E7E5E4] bg-[#FAFAF9] p-4 text-sm text-[#78716C]">
                                No supplier applications are waiting for review yet.
                            </div>
                        ) : (
                            supplierSummary.latestApplications.map((application) => (
                                <div key={application.id} className="border border-[#E7E5E4] bg-[#FAFAF9] p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-semibold text-[#1C1917]">{application.companyName}</p>
                                            <p className="text-sm text-[#78716C]">
                                                {application.province} · {application.supplierType.replace('-', ' ')}
                                            </p>
                                        </div>
                                        <span className="inline-flex border border-[#E7E5E4] bg-white px-2 py-0.5 text-xs font-semibold text-[#44403C]">
                                            {application.status.replace('-', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Quick Actions - Role-based */}
            <div className="bg-white border border-[#E7E5E4] p-6">
                <h2 className="text-lg font-semibold mb-4 text-[#1C1917]">
                    {isAdmin ? 'Admin Quick Actions' : 'Quick Actions'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(isAdmin ? adminQuickActions : technicianQuickActions).map((action) => {
                        const Icon = action.icon;

                        return (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex items-center gap-3 p-4 border border-[#E7E5E4] bg-[#FAFAF9] hover:bg-white hover:border-[#D97706]/30 transition-colors group"
                            >
                                <div
                                    className={`p-2 ${action.iconClassName}`}
                                    style={'iconStyle' in action ? action.iconStyle : undefined}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-[#1C1917]">{action.title}</p>
                                    <p className="text-xs text-[#78716C]">{action.detail}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-[#A8A29E] group-hover:text-[#44403C] transition-colors" />
                            </Link>
                        );
                    })}
                    {!isAdmin && (
                        <div className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors group cursor-pointer">
                            <div className="p-2 bg-red-100 text-red-600">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-900">Log Accident</p>
                                <p className="text-xs text-red-500">Report safety incident</p>
                            </div>
                            <Plus className="h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Technician-only sections ── */}
            {!isAdmin && (
                <>
                    {/* Recent Jobs */}
                    <div className="bg-white border border-[#E7E5E4]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                            <div>
                                <h2 className="text-base font-semibold text-[#1C1917]">Recent Jobs</h2>
                                <p className="text-xs text-[#78716C] mt-0.5">Your last recorded service jobs</p>
                            </div>
                            <Link href="/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                                View all <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="divide-y divide-[#E7E5E4]">
                            {recentJobs.map((job) => {
                                const statusStyles: Record<string, string> = {
                                    completed: 'bg-emerald-50 text-emerald-700',
                                    'in-progress': 'bg-blue-50 text-blue-700',
                                    scheduled: 'bg-amber-50 text-amber-700',
                                };
                                const StatusIcon = job.status === 'completed' ? CheckCircle2 : job.status === 'in-progress' ? Wrench : CalendarDays;
                                return (
                                    <div key={job.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAF9]">
                                        <div className="p-2 bg-[#F5F5F4] text-[#78716C]">
                                            <StatusIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#1C1917] truncate">{job.clientName}</p>
                                            <p className="text-xs text-[#78716C]">{job.location} · {job.equipmentType}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold ${statusStyles[job.status] ?? 'bg-gray-50 text-gray-600'}`}>
                                                {job.status.replace('-', ' ')}
                                            </span>
                                            <p className="text-xs text-[#A8A29E] mt-1">{job.date}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Upcoming Schedule + Certifications */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Upcoming Scheduled Jobs */}
                        <div className="bg-white border border-[#E7E5E4]">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                                <div>
                                    <h2 className="text-base font-semibold text-[#1C1917]">Upcoming Schedule</h2>
                                    <p className="text-xs text-[#78716C] mt-0.5">Jobs assigned and pending</p>
                                </div>
                                <Link href="/job-planner" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                                    Planner <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="divide-y divide-[#E7E5E4]">
                                {scheduledJobs.length === 0 ? (
                                    <div className="px-6 py-8 text-center">
                                        <CalendarDays className="h-8 w-8 text-[#D1C5C0] mx-auto mb-2" />
                                        <p className="text-sm text-[#78716C]">No upcoming jobs scheduled.</p>
                                        <Link href="/job-planner" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#D97706]">
                                            Open Job Planner <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                ) : (
                                    scheduledJobs.map((job) => (
                                        <div key={job.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAF9]">
                                            <div className="p-2 bg-amber-50 text-amber-600">
                                                <CalendarDays className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#1C1917] truncate">{job.clientName}</p>
                                                <p className="text-xs text-[#78716C]">{job.location} · {job.refrigerantClass}</p>
                                            </div>
                                            <p className="text-xs font-semibold text-[#44403C] shrink-0">{job.scheduledDate}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Certification Status */}
                        <div className="bg-white border border-[#E7E5E4]">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                                <div>
                                    <h2 className="text-base font-semibold text-[#1C1917]">Certifications</h2>
                                    <p className="text-xs text-[#78716C] mt-0.5">
                                        {expiredCerts.length > 0
                                            ? `${expiredCerts.length} expired · `
                                            : ''}
                                        {expiringSoonCerts.length > 0
                                            ? `${expiringSoonCerts.length} expiring soon`
                                            : `${validCerts.length} active`}
                                    </p>
                                </div>
                                <Link href="/certifications" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                                    Manage <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="divide-y divide-[#E7E5E4]">
                                {displayCerts.map((cert) => {
                                    const expiry = new Date(cert.expiryDate);
                                    const daysLeft = Math.ceil((expiry.getTime() - now) / (1000 * 60 * 60 * 24));
                                    const isExpired = daysLeft <= 0;
                                    const isExpiringSoon = daysLeft > 0 && daysLeft <= 30;
                                    return (
                                        <div key={cert.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FAFAF9]">
                                            <div className={`p-2 ${isExpired ? 'bg-red-50 text-red-600' : isExpiringSoon ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {isExpired || isExpiringSoon ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#1C1917] truncate">{cert.certificateType}</p>
                                                <p className="text-xs text-[#78716C]">{cert.issuingBody} · {cert.certificateNumber}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold ${isExpired ? 'bg-red-50 text-red-700' : isExpiringSoon ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                    {isExpired ? 'Expired' : isExpiringSoon ? `${daysLeft}d left` : 'Valid'}
                                                </span>
                                                <p className="text-xs text-[#A8A29E] mt-1">Exp. {cert.expiryDate}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Refrigerant Activity */}
                    <div className="bg-white border border-[#E7E5E4]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                            <div>
                                <h2 className="text-base font-semibold text-[#1C1917]">Refrigerant Activity</h2>
                                <p className="text-xs text-[#78716C] mt-0.5">Recent charges, recoveries and leak repairs</p>
                            </div>
                            <Link href="/field-toolkit" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                                Field Toolkit <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {recentLogs.length === 0 ? (
                            <div className="px-6 py-8 text-center">
                                <Droplets className="h-8 w-8 text-[#D1C5C0] mx-auto mb-2" />
                                <p className="text-sm text-[#78716C]">No refrigerant logs recorded yet.</p>
                                <Link href="/field-toolkit" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#D97706]">
                                    Log refrigerant action <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#E7E5E4] bg-[#FAFAF9]">
                                            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Client</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Refrigerant</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Action</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Amount</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentLogs.map((log) => {
                                            const actionStyles: Record<string, string> = {
                                                Charge: 'bg-blue-50 text-blue-700',
                                                Recovery: 'bg-emerald-50 text-emerald-700',
                                                'Leak Repair': 'bg-amber-50 text-amber-700',
                                            };
                                            return (
                                                <tr key={log.id} className="border-b border-[#E7E5E4] hover:bg-[#FAFAF9]">
                                                    <td className="px-6 py-3 text-sm font-medium text-[#1C1917]">{log.clientName}</td>
                                                    <td className="px-6 py-3 text-sm text-[#44403C]">{log.refrigerantType}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold ${actionStyles[log.actionType] ?? 'bg-gray-50 text-gray-600'}`}>
                                                            {log.actionType}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-[#44403C]">{log.amount} kg</td>
                                                    <td className="px-6 py-3 text-xs text-[#78716C]">{new Date(log.timestamp).toLocaleDateString('en-ZW')}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Safety — Occupational Accident Section */}
                    <OccupationalAccidentSection isAdmin={false} />
                </>
            )}

            {/* Admin-only: Technician Performance Table */}
            {isAdmin && (
                <div className="bg-white border border-[#E7E5E4] p-6">
                    <h2 className="text-lg font-semibold text-[#1C1917] mb-4">Top Performers — {dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month'}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#E7E5E4]">
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Technician</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Region</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Jobs</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">COCs</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-[#E7E5E4] hover:bg-[#FAFAF9]">
                                    <td className="py-3 px-4 text-sm font-medium text-[#1C1917]">John Moyo</td>
                                    <td className="py-3 px-4 text-sm text-[#78716C]">Harare</td>
                                    <td className="py-3 px-4 text-sm text-[#1C1917]">12</td>
                                    <td className="py-3 px-4 text-sm text-[#1C1917]">8</td>
                                    <td className="py-3 px-4 text-sm text-emerald-600">4.9 ★</td>
                                </tr>
                                <tr className="border-b border-[#E7E5E4] hover:bg-[#FAFAF9]">
                                    <td className="py-3 px-4 text-sm font-medium text-[#1C1917]">Sarah Ncube</td>
                                    <td className="py-3 px-4 text-sm text-[#78716C]">Bulawayo</td>
                                    <td className="py-3 px-4 text-sm text-[#1C1917]">10</td>
                                    <td className="py-3 px-4 text-sm text-[#1C1917]">7</td>
                                    <td className="py-3 px-4 text-sm text-emerald-600">4.8 ★</td>
                                </tr>
                                <tr className="border-b border-[#E7E5E4] hover:bg-[#FAFAF9]">
                                    <td className="py-3 px-4 text-sm font-medium text-[#1C1917]">Peter Dube</td>
                                    <td className="py-3 px-4 text-sm text-[#78716C]">Mutare</td>
                                    <td className="py-3 px-4 text-sm text-[#1C1917]">8</td>
                                    <td className="py-3 px-4 text-sm text-[#1C1917]">5</td>
                                    <td className="py-3 px-4 text-sm text-emerald-600">4.7 ★</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
