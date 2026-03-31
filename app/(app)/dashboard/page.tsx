'use client';

import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { getSession, UserSession, logout } from '@/lib/auth';
import { STORAGE_KEYS, readCollection } from '@/lib/platformStore';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import {
    ClipboardCheck,
    Award,
    Gift,
    TrendingUp,
    ArrowRight,
    Download,
    RefreshCw,
    Users,
    MapPin,
    Clock,
    Wrench,
    Thermometer,
    ShieldAlert,
    Plus,
    Building2
} from 'lucide-react';
import Link from 'next/link';
import OccupationalAccidentSection from '@/components/OccupationalAccidentSection';
import { SupplierRegistration } from '@/types/index';

// HEVACRAZ Color Scheme (matching landing page)
const colors = {
    primary: '#2C2420', // Rich charcoal
    secondary: '#D4A574', // Warm terracotta
    accent: '#5A7D5A', // Sage green
    highlight: '#FF6B35', // Electric orange (CTAs only)
    background: '#FDF8F3', // Warm off-white
};

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
    const [supplierApplications, setSupplierApplications] = useState<SupplierRegistration[]>([]);

    useEffect(() => {
        const userSession = getSession();
        setSession(userSession);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        setSupplierApplications(
            readCollection<SupplierRegistration>(STORAGE_KEYS.supplierApplications, [], [
                STORAGE_KEYS.supplierProfilesLegacy,
            ])
        );
    }, []);

    // Role-based KPI cards
    const isAdmin = session?.role === 'program_admin' || session?.role === 'org_admin';
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-gray-500">Please log in to view the dashboard</p>
                <a
                    href="/login"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            title: 'Sizing Tool',
            detail: 'Calculate capacity',
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
        <div className="space-y-6" style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
                        {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
                    </h1>
                    <p className="text-gray-500 mt-1">Welcome back, {session.name}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Filter */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                        <button
                            onClick={() => setDateRange('today')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${dateRange === 'today'
                                ? 'text-white'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                            style={{ backgroundColor: dateRange === 'today' ? colors.highlight : 'transparent' }}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setDateRange('week')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${dateRange === 'week'
                                ? 'text-white'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                            style={{ backgroundColor: dateRange === 'week' ? colors.highlight : 'transparent' }}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setDateRange('month')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${dateRange === 'month'
                                ? 'text-white'
                                : 'text-gray-600 hover:bg-gray-200'
                                }`}
                            style={{ backgroundColor: dateRange === 'month' ? colors.highlight : 'transparent' }}
                        >
                            This Month
                        </button>
                    </div>
                    {isAdmin && (
                        <select
                            value={regionFilter}
                            onChange={(event) => setRegionFilter(event.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            CSV
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={exportAdminPdf}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            PDF
                        </button>
                    )}
                    <button
                        onClick={() => logout()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Demo Banner */}
            {session.isDemo && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <Award className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-800">
                                You are viewing this dashboard as <span className="font-semibold capitalize">{session.role.replace('_', ' ')}</span> in <span className="font-semibold">{session.region}</span>.
                            </p>
                        </div>
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
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="mt-4">
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                                <p className="text-xs text-gray-400 mt-2">{stat.trend}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Supplier Review - Admin */}
            {isAdmin && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold" style={{ color: colors.primary }}>
                                Supplier Review Queue
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Supplier applications from the mock intake flow are synced here for NOU review.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/nou-dashboard"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors"
                                style={{ backgroundColor: colors.highlight }}
                            >
                                Open NOU Dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/suppliers"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Supplier Management
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pending</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{supplierSummary.pendingApplications}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Approved</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{supplierSummary.approvedApplications}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Rejected</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{supplierSummary.rejectedApplications}</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {supplierSummary.latestApplications.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                No supplier applications are waiting for review yet.
                            </div>
                        ) : (
                            supplierSummary.latestApplications.map((application) => (
                                <div key={application.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900">{application.companyName}</p>
                                            <p className="text-sm text-gray-500">
                                                {application.province} · {application.supplierType.replace('-', ' ')}
                                            </p>
                                        </div>
                                        <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                    {isAdmin ? 'Admin Quick Actions' : 'Quick Actions'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(isAdmin ? adminQuickActions : technicianQuickActions).map((action) => {
                        const Icon = action.icon;

                        return (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                            >
                                <div
                                    className={`p-2 rounded-lg ${action.iconClassName}`}
                                    style={'iconStyle' in action ? action.iconStyle : undefined}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">{action.title}</p>
                                    <p className="text-xs text-gray-500">{action.detail}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </Link>
                        );
                    })}
                    {!isAdmin && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors group cursor-pointer border border-red-100">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600">
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

            {/* Occupational Accident Section */}
            <OccupationalAccidentSection
                isAdmin={isAdmin}
                initialAccidents={isAdmin ? [
                    {
                        id: 'acc1',
                        date: '2026-02-24',
                        jobSite: 'Harare Central Substation',
                        clientName: 'ZESA Holdings',
                        severity: 'High',
                        description: 'Electrical arc flash during maintenance. No injuries reported.',
                        technicianName: 'John Moyo'
                    },
                    {
                        id: 'acc2',
                        date: '2026-02-25',
                        jobSite: 'Bulawayo Cold Storage',
                        clientName: 'Cold Storage Commission',
                        severity: 'Critical',
                        description: 'Major refrigerant leak (R-717) detected. Site evacuated.',
                        technicianName: 'Sarah Miller'
                    }
                ] : []}
            />

            {/* Admin-only: Technician Performance Table */}
            {isAdmin && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers - {dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month'}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Technician</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Region</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Jobs</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">COCs</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">John Moyo</td>
                                    <td className="py-3 px-4 text-sm text-gray-500">Harare</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">12</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">8</td>
                                    <td className="py-3 px-4 text-sm text-emerald-600">4.9 ★</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">Sarah Ncube</td>
                                    <td className="py-3 px-4 text-sm text-gray-500">Bulawayo</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">10</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">7</td>
                                    <td className="py-3 px-4 text-sm text-emerald-600">4.8 ★</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">Peter Dube</td>
                                    <td className="py-3 px-4 text-sm text-gray-500">Mutare</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">8</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">5</td>
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
