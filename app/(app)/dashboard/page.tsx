'use client';

import { CSSProperties, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { mutate } from 'swr';
import {
    useSupplierApplications,
    useTechnicians,
    useReorders,
    useGasUsage,
    usePlannerJobs,
    useGasLogs,
    useCocRequests,
    useSupplierComplianceApplications,
    useSupplierLedger,
    useCourses,
    useExamSubmissions,
    useTrainingSessions,
    useCertificateRequests,
} from '@/lib/api';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import {            ClipboardCheck,
    Award,
    Gift,
    TrendingUp,
    ArrowRight,
    Download,
    Users,
    MapPin,
    Clock,
    Wrench,
    ShieldAlert,
    Plus,
    Building2,
    CheckCircle2,
    AlertTriangle,
    CalendarDays,
    Droplets,
    ChevronRight,
    FileText,
    ExternalLink,
    Fuel,
    BookOpen,
    GraduationCap,
    Package,
    ShieldCheck,
    Receipt,
} from 'lucide-react';
import Link from 'next/link';
import OccupationalAccidentSection from '@/components/OccupationalAccidentSection';
import { CertificateRecord, JobTypeLabels, RefrigerantLog } from '@/types/index';
import { BRAND as colors } from '@/constants/colors';
import { rangeMsFor, type SimpleDateRange } from '@/lib/dateRange';

export default function DashboardPage() {
    const { user: session, isLoading } = useAuth();
    const [dateRange, setDateRange] = useState('today');
    const [regionFilter, setRegionFilter] = useState('all');
    const isAdmin = session?.role === 'org_admin';
    const isTechnician = session?.role === 'technician';
    const isVendor = session?.role === 'vendor';
    const isTrainerOrLecturer = session?.role === 'trainer' || session?.role === 'lecturer';
    const isStudent = session?.role === 'student';

    const { data: supplierApplications = [] } = useSupplierApplications(isAdmin);
    const { data: technicians = [] } = useTechnicians(undefined, isAdmin);
    const { data: reorders = [] } = useReorders(isAdmin || isVendor);
    const { data: plannerJobs = [] } = usePlannerJobs();
    const { data: gasLogsData } = useGasLogs(undefined, undefined, 50);
    const { data: cocRequests = [] } = useCocRequests();
    const { data: complianceApps = [] } = useSupplierComplianceApplications(isVendor);
    const { data: vendorLedger = [] } = useSupplierLedger(undefined, isVendor);
    const { data: managedCourses = [] } = useCourses(isTrainerOrLecturer || isStudent);
    const { data: examSubmissions = [] } = useExamSubmissions(isTrainerOrLecturer);
    const { data: trainingSessions = [] } = useTrainingSessions(isTrainerOrLecturer);
    const { data: certRequests = [] } = useCertificateRequests(isTrainerOrLecturer);

    // Derive refrigerant logs from Gas Logs API (DB-backed) rather than localStorage
    const refrigerantLogs = useMemo(() => (gasLogsData ?? []) as RefrigerantLog[], [gasLogsData]);

    // Derive certificate records from CoC request data (DB-backed)
    const certificateRecords = useMemo(() => (cocRequests ?? []) as unknown as CertificateRecord[], [cocRequests]);

    // Role-based KPI cards
    const pendingSupplierApplications = supplierApplications.filter(
        application => application.status === 'submitted' || application.status === 'under-review'
    );
    const supplierSummary = {
        pendingApplications: pendingSupplierApplications.length,
        approvedApplications: supplierApplications.filter(application => application.status === 'approved').length,
        rejectedApplications: supplierApplications.filter(application => application.status === 'rejected').length,
        latestApplications: pendingSupplierApplications.slice(0, 3),
    };

    // Technician KPIs — computed from real DB data
    const technicianStats = useMemo(() => {
        const completedJobs = plannerJobs.filter(j => j.status === 'completed').length;
        const nowMs = Date.now();
        const rangeMs = rangeMsFor(dateRange as SimpleDateRange);
        const rangeStart = nowMs - rangeMs;
        const jobsInRange = plannerJobs.filter(j => new Date(j.scheduledDate).getTime() >= rangeStart);
        const jobsCompletedInRange = jobsInRange.filter(j => j.status === 'completed').length;

        const pendingCocs = cocRequests.filter(c => c.status === 'submitted').length;
        const approvedCocs = cocRequests.filter(c => c.status === 'approved').length;

        const validCerts = certificateRecords.filter(c => {
            const expiry = new Date(c.expiryDate).getTime();
            return expiry > nowMs + 30 * 24 * 60 * 60 * 1000;
        }).length;
        const expiringCerts = certificateRecords.filter(c => {
            const expiry = new Date(c.expiryDate).getTime();
            return expiry > nowMs && expiry <= nowMs + 30 * 24 * 60 * 60 * 1000;
        }).length;

        return [
            {
                label: 'Jobs Completed',
                value: String(jobsCompletedInRange || completedJobs),
                icon: ClipboardCheck,
                color: 'blue',
                trend: dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This week' : 'This month'
            },
            {
                label: 'Pending COCs',
                value: String(pendingCocs),
                icon: Clock,
                color: 'amber',
                trend: `${approvedCocs} approved`
            },
            {
                label: 'Refrigerant Recovered',
                value: `${refrigerantLogs.filter(l => l.actionType === 'Recovery').reduce((sum, l) => sum + l.amount, 0).toFixed(1)} kg`,
                icon: Droplets,
                color: 'emerald',
                trend: 'Recent recovery logs'
            },
            {
                label: 'Certifications',
                value: String(validCerts + expiringCerts),
                icon: Award,
                color: 'purple',
                trend: expiringCerts > 0 ? `${expiringCerts} expiring soon` : `${validCerts} active`
            },
        ];
    }, [plannerJobs, cocRequests, certificateRecords, dateRange, refrigerantLogs]);

    // Vendor KPIs — computed from the vendor's own reorders, compliance applications, and ledger
    const vendorStats = useMemo(() => {
        const pendingReorders = reorders.filter(r => r.status === 'pending_hevacraz' || r.status === 'pending_nou').length;
        const approvedReorders = reorders.filter(r => r.status === 'approved');
        const approvedKg = approvedReorders.reduce((sum, r) => sum + r.quantityKg, 0);
        const pendingCompliance = complianceApps.filter(a => a.status === 'submitted' || a.status === 'under-review').length;
        const approvedCompliance = complianceApps.filter(a => a.status === 'approved').length;
        const ledgerTotalUsd = vendorLedger.reduce((sum, entry) => sum + entry.totalValueUsd, 0);

        return [
            {
                label: 'Pending Reorders',
                value: String(pendingReorders),
                icon: Package,
                color: 'amber',
                trend: 'Awaiting HEVACRAZ or NOU review'
            },
            {
                label: 'Approved Volume',
                value: `${approvedKg.toLocaleString()} kg`,
                icon: Droplets,
                color: 'blue',
                trend: `${approvedReorders.length} approved reorders`
            },
            {
                label: 'Compliance Certificates',
                value: String(approvedCompliance),
                icon: ShieldCheck,
                color: 'emerald',
                trend: pendingCompliance > 0 ? `${pendingCompliance} pending review` : 'All up to date'
            },
            {
                label: 'Ledger Value',
                value: `$${ledgerTotalUsd.toLocaleString()}`,
                icon: Receipt,
                color: 'purple',
                trend: `${vendorLedger.length} logged transactions`
            },
        ];
    }, [reorders, complianceApps, vendorLedger]);

    // Trainer / Lecturer KPIs — computed from the trainer's own courses, sessions, and submissions
    const trainerStats = useMemo(() => {
        const approvedCourses = managedCourses.filter(c => c.status === 'approved').length;
        const pendingCourses = managedCourses.filter(c => c.status === 'pending_nou' || c.status === 'draft').length;
        const pendingGrading = examSubmissions.filter(s => s.status === 'pending').length;
        const upcomingSessions = trainingSessions.filter(s => s.status === 'scheduled' || s.status === 'open').length;
        const pendingCertRequests = certRequests.filter(r => r.status === 'submitted-for-admin-approval').length;

        return [
            {
                label: 'Approved Courses',
                value: String(approvedCourses),
                icon: BookOpen,
                color: 'blue',
                trend: pendingCourses > 0 ? `${pendingCourses} awaiting approval` : 'All courses approved'
            },
            {
                label: 'Pending Grading',
                value: String(pendingGrading),
                icon: ClipboardCheck,
                color: 'amber',
                trend: `${examSubmissions.length} total submissions`
            },
            {
                label: 'Upcoming Sessions',
                value: String(upcomingSessions),
                icon: GraduationCap,
                color: 'emerald',
                trend: `${trainingSessions.length} sessions scheduled`
            },
            {
                label: 'Certificate Requests',
                value: String(pendingCertRequests),
                icon: Award,
                color: 'purple',
                trend: 'Awaiting admin approval'
            },
        ];
    }, [managedCourses, examSubmissions, trainingSessions, certRequests]);

    // Student KPIs — computed from available/approved courses and certification records
    const studentStats = useMemo(() => {
        const availableCourses = managedCourses.filter(c => c.status === 'approved').length;
        const nowMs = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const activeCerts = certificateRecords.filter(c => new Date(c.expiryDate).getTime() > nowMs).length;
        const expiringSoon = certificateRecords.filter(c => {
            const expiry = new Date(c.expiryDate).getTime();
            return expiry > nowMs && expiry <= nowMs + thirtyDaysMs;
        }).length;

        return [
            {
                label: 'Available Courses',
                value: String(availableCourses),
                icon: BookOpen,
                color: 'blue',
                trend: 'Open for enrollment'
            },
            {
                label: 'Certifications',
                value: String(activeCerts),
                icon: Award,
                color: 'purple',
                trend: expiringSoon > 0 ? `${expiringSoon} expiring soon` : 'Up to date'
            },
        ];
    }, [managedCourses, certificateRecords]);

    const adminMetrics = useMemo(() => {
        const now = Date.now();
        const rangeMs = rangeMsFor(dateRange as SimpleDateRange);
        const rangeStart = now - rangeMs;

        const regionFilteredTechs = regionFilter === 'all'
            ? technicians
            : technicians.filter(tech => tech.province === regionFilter);

        const activeTechs = regionFilteredTechs.filter(tech => tech.status === 'active').length;
        const totalTechs = regionFilteredTechs.length;
        const regions = regionFilter === 'all'
            ? new Set(technicians.map(tech => tech.province)).size
            : 1;

        const reordersInRange = reorders.filter(reorder => {
            const created = new Date(reorder.createdAt).getTime();
            return created >= rangeStart;
        });
        const totalRefrigerantKg = reordersInRange.reduce((sum, reorder) => sum + reorder.quantityKg, 0);
        const pendingReorderReviews = reorders.filter(
            reorder => reorder.status === 'pending_hevacraz' || reorder.status === 'pending_nou'
        ).length;

        return {
            activeTechs,
            totalTechs,
            totalRefrigerantKg,
            pendingReorderReviews,
            regions,
        };
    }, [dateRange, regionFilter, technicians, reorders]);

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
            label: 'Total Technicians',
            value: String(adminMetrics.totalTechs),
            icon: Wrench,
            color: 'emerald',
            trend: regionFilter === 'all' ? 'Across the registry' : `Filtered to ${regionFilter}`
        },
        {
            label: 'Pending Reorder Reviews',
            value: String(adminMetrics.pendingReorderReviews),
            icon: Award,
            color: 'amber',
            trend: 'Awaiting HEVACRAZ or NOU review'
        },
        {
            label: 'Regions',
            value: String(adminMetrics.regions),
            icon: MapPin,
            color: 'purple',
            trend: regionFilter === 'all' ? 'Provinces with registered technicians' : 'Selected region'
        },
        {
            label: 'Refrigerant Volume',
            value: `${adminMetrics.totalRefrigerantKg.toLocaleString()} kg`,
            icon: Droplets,
            color: 'red',
            trend: dateRange === 'today' ? 'Reorders in last 24 hours' : dateRange === 'week' ? 'Reorders in last 7 days' : 'Reorders in last 30 days'
        },
    ];

    // ── Hooks must be before any early return to obey Rules of Hooks ──

    // Gas usage aggregated by job type via API
    const gasUsageFrom = useMemo(() => {
        const now = Date.now();
        return new Date(now - rangeMsFor(dateRange as SimpleDateRange)).toISOString();
    }, [dateRange]);
    const { data: gasUsageData, error: gasUsageError, isLoading: gasUsageLoading } = useGasUsage(gasUsageFrom);

    // Map plannerJobId -> total gas used for direct linking to planner jobs
    const gasUsageByPlannerJobId = useMemo(() => {
        const byJobId = new Map<string, { totalKg: number; refrigerants: string[] }>();
        refrigerantLogs.forEach(log => {
            if (!log.plannerJobId) return;
            if (!byJobId.has(log.plannerJobId)) {
                byJobId.set(log.plannerJobId, { totalKg: 0, refrigerants: [] });
            }
            const entry = byJobId.get(log.plannerJobId)!;
            entry.totalKg += log.amount;
            if (!entry.refrigerants.includes(log.refrigerantType)) {
                entry.refrigerants.push(log.refrigerantType);
            }
        });
        return byJobId;
    }, [refrigerantLogs]);

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

    const stats = isAdmin ? adminStats
        : isVendor ? vendorStats
        : isTrainerOrLecturer ? trainerStats
        : isStudent ? studentStats
        : technicianStats;
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
            title: 'NOU Dashboard',
            detail: 'Reorder reviews, NOU queue, course approvals',
            icon: Building2,
            iconClassName: 'bg-orange-100 text-orange-600',
        },
        {
            href: '/admin/accidents',
            title: 'Safety Oversight',
            detail: 'Regional accident monitoring and reports',
            icon: ShieldAlert,
            iconClassName: 'bg-red-100 text-red-600',
        },
    ];
    const technicianQuickActions: QuickAction[] = [
        {
            href: '/job-planner',
            title: 'Job Planner',
            detail: 'Schedule and manage service jobs',
            icon: CalendarDays,
            iconClassName: 'bg-teal-100 text-teal-600',
        },
        {
            href: '/field-scheduling',
            title: 'Field Scheduling',
            detail: 'Manage your field appointments',
            icon: Clock,
            iconClassName: 'bg-cyan-100 text-cyan-600',
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

    const vendorQuickActions: QuickAction[] = [
        {
            href: '/suppliers/reorder',
            title: 'Reorder Gas',
            detail: 'Submit a new refrigerant reorder',
            icon: Package,
            iconClassName: 'bg-amber-100 text-amber-600',
        },
        {
            href: '/supplier-compliance',
            title: 'Compliance',
            detail: 'Distribution & NOU reporting certificates',
            icon: ShieldCheck,
            iconClassName: 'bg-emerald-100 text-emerald-600',
        },
        {
            href: '/suppliers/verify-buyer',
            title: 'Verify Buyer',
            detail: 'Confirm technician registration before sale',
            icon: Users,
            iconClassName: 'bg-sky-100 text-sky-600',
        },
        {
            href: '/rewards',
            title: 'Rewards',
            detail: 'Vendor rewards & coverage',
            icon: Gift,
            iconClassName: 'bg-purple-100 text-purple-600',
        },
    ];

    const trainerQuickActions: QuickAction[] = [
        {
            href: '/learn/manage',
            title: 'Manage Courses',
            detail: 'Author and submit courses for approval',
            icon: BookOpen,
            iconClassName: 'bg-blue-100 text-blue-600',
        },
        {
            href: '/technician-registry',
            title: 'Technician Registry',
            detail: 'Look up registered technicians',
            icon: Users,
            iconClassName: 'bg-sky-100 text-sky-600',
        },
        {
            href: '/certifications',
            title: 'Certificate Requests',
            detail: 'Submit exam results for admin approval',
            icon: Award,
            iconClassName: 'bg-amber-100 text-amber-600',
        },
        {
            href: '/whatgas',
            title: 'WhatGas Registry',
            detail: 'Refrigerant reference for course content',
            icon: Droplets,
            iconClassName: 'bg-cyan-100 text-cyan-600',
        },
    ];

    const studentQuickActions: QuickAction[] = [
        {
            href: '/learn',
            title: 'My Learning',
            detail: 'Enrolled courses & exams',
            icon: BookOpen,
            iconClassName: 'bg-blue-100 text-blue-600',
        },
        {
            href: '/certifications',
            title: 'Certifications',
            detail: 'View issued certificates',
            icon: Award,
            iconClassName: 'bg-amber-100 text-amber-600',
        },
        {
            href: '/whatgas',
            title: 'WhatGas Registry',
            detail: 'Refrigerant reference lookup',
            icon: Droplets,
            iconClassName: 'bg-cyan-100 text-cyan-600',
        },
        {
            href: '/safety',
            title: 'Safety Center',
            detail: 'Guidance and safety resources',
            icon: ShieldAlert,
            iconClassName: 'bg-red-100 text-red-600',
        },
    ];

    // Admin-only derived data: top performers ranked by valid certifications
    const topPerformers = (regionFilter === 'all'
        ? technicians
        : technicians.filter(tech => tech.province === regionFilter)
    )
        .map(tech => ({
            ...tech,
            validCertCount: tech.certifications.filter(cert => cert.status === 'valid').length,
        }))
        .sort((a, b) => b.validCertCount - a.validCertCount)
        .slice(0, 5);

    // Technician-specific derived data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledJobs = plannerJobs
        .filter(job => job.status === 'scheduled' && new Date(job.scheduledDate) >= today)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 4);
    const recentJobs = plannerJobs
        .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
        .slice(0, 5);
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

    const displayCerts = certificateRecords.slice(0, 5);

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
                    <div className="rounded-lg flex items-center border border-[#E7E5E4] bg-white divide-x divide-[#E7E5E4]">
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
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#44403C] rounded-lg bg-white border border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            CSV
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={exportAdminPdf}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#44403C] rounded-lg bg-white border border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            PDF
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 ${isAdmin ? 'xl:grid-cols-5' : 'lg:grid-cols-4'}`}>
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
                <div className="rounded-lg bg-white border border-[#E7E5E4] p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-[#1C1917]">
                                Supplier Review Queue
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                New supplier applications are synced here for HEVACRAZ and NOU review.
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
                        <div className="rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Pending</p>
                            <p className="mt-2 text-3xl font-bold text-[#1C1917]">{supplierSummary.pendingApplications}</p>
                        </div>
                        <div className="rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Approved</p>
                            <p className="mt-2 text-3xl font-bold text-[#1C1917]">{supplierSummary.approvedApplications}</p>
                        </div>
                        <div className="rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] p-4">
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
                                <div key={application.id} className="rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] p-4">
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
            <div className="rounded-lg bg-white border border-[#E7E5E4] p-6">
                <h2 className="text-lg font-semibold mb-4 text-[#1C1917]">
                    {isAdmin ? 'Admin Quick Actions' : 'Quick Actions'}
                </h2>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${isAdmin ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-4'}`}>
                    {(isAdmin ? adminQuickActions
                        : isVendor ? vendorQuickActions
                        : isTrainerOrLecturer ? trainerQuickActions
                        : isStudent ? studentQuickActions
                        : technicianQuickActions
                    ).map((action) => {
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
                    {!isAdmin && !isVendor && (
                        <div className="rounded-lg flex items-center gap-3 p-4 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors group cursor-pointer">
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

            {/* ── Vendor-only sections ── */}
            {isVendor && (
                <>
                    {/* Reorder Queue */}
                    <div className="rounded-lg bg-white border border-[#E7E5E4]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                            <div>
                                <h2 className="text-base font-semibold text-[#1C1917]">Recent Reorders</h2>
                                <p className="text-xs text-[#78716C] mt-0.5">Your submitted gas reorder requests</p>
                            </div>
                            <Link href="/suppliers/reorder" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                                View all <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {reorders.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <Package className="h-8 w-8 text-[#D1C5C0] mx-auto mb-3" />
                                <p className="text-sm text-[#78716C]">No reorders submitted yet.</p>
                                <Link
                                    href="/suppliers/reorder"
                                    className="mt-4 inline-flex items-center gap-2 bg-[#D97706] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#b45309]"
                                >
                                    Submit a Reorder
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#E7E5E4]">
                                {reorders.slice(0, 5).map((reorder) => {
                                    const statusColors: Record<string, string> = {
                                        pending_hevacraz: 'bg-amber-50 text-amber-700 border-amber-200',
                                        pending_nou: 'bg-amber-50 text-amber-700 border-amber-200',
                                        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                        rejected: 'bg-red-50 text-red-700 border-red-200',
                                    };
                                    return (
                                        <div key={reorder.id} className="px-6 py-4 hover:bg-[#FAFAF9] transition-colors">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-semibold text-[#1C1917]">{reorder.gasType} · {reorder.quantityKg} kg</p>
                                                        <span className={`inline-flex border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColors[reorder.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                            {reorder.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[#78716C] mt-1">{reorder.purpose}</p>
                                                </div>
                                                <span className="text-xs text-[#A8A29E] shrink-0">{new Date(reorder.createdAt).toLocaleDateString('en-ZW')}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Compliance Applications */}
                    <div className="rounded-lg bg-white border border-[#E7E5E4]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                            <div>
                                <h2 className="text-base font-semibold text-[#1C1917]">Compliance Certificates</h2>
                                <p className="text-xs text-[#78716C] mt-0.5">Distribution compliance & NOU reporting status</p>
                            </div>
                            <Link href="/supplier-compliance" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                                Manage <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {complianceApps.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <ShieldCheck className="h-8 w-8 text-[#D1C5C0] mx-auto mb-3" />
                                <p className="text-sm text-[#78716C]">No compliance applications submitted yet.</p>
                                <Link href="/supplier-compliance" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#D97706]">
                                    Apply for compliance certificate <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#E7E5E4]">
                                {complianceApps.slice(0, 5).map((app) => (
                                    <div key={app.id} className="px-6 py-4 hover:bg-[#FAFAF9] transition-colors flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[#1C1917]">{app.certificateType.replace(/-/g, ' ')}</p>
                                            <p className="text-xs text-[#78716C] mt-0.5">{app.monthCoverage} · {app.sitesCovered} sites</p>
                                        </div>
                                        <span className="inline-flex border border-[#E7E5E4] bg-white px-2 py-0.5 text-xs font-semibold text-[#44403C] shrink-0">
                                            {app.status.replace('-', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Trainer / Lecturer-only sections ── */}
            {isTrainerOrLecturer && (
                <>
                    {/* Grading Queue */}
                    <div className="rounded-lg bg-white border border-[#E7E5E4]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                            <div>
                                <h2 className="text-base font-semibold text-[#1C1917]">Grading Queue</h2>
                                <p className="text-xs text-[#78716C] mt-0.5">Student exam submissions awaiting review</p>
                            </div>
                            <Link href="/learn/manage" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                                Manage <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {examSubmissions.filter(s => s.status === 'pending').length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <ClipboardCheck className="h-8 w-8 text-[#D1C5C0] mx-auto mb-3" />
                                <p className="text-sm text-[#78716C]">No submissions awaiting grading.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#E7E5E4]">
                                {examSubmissions.filter(s => s.status === 'pending').slice(0, 5).map((sub) => (
                                    <div key={sub.id} className="px-6 py-4 hover:bg-[#FAFAF9] transition-colors flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[#1C1917] truncate">{sub.studentName}</p>
                                            <p className="text-xs text-[#78716C] mt-0.5">{sub.courseTitle}</p>
                                        </div>
                                        <span className="text-xs text-[#A8A29E] shrink-0">{new Date(sub.submittedAt).toLocaleDateString('en-ZW')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Courses + Training Sessions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-lg bg-white border border-[#E7E5E4]">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                                <div>
                                    <h2 className="text-base font-semibold text-[#1C1917]">My Courses</h2>
                                    <p className="text-xs text-[#78716C] mt-0.5">Authored courses & approval status</p>
                                </div>
                                <Link href="/learn/manage" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                                    Manage <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                            <div className="divide-y divide-[#E7E5E4]">
                                {managedCourses.length === 0 ? (
                                    <div className="px-6 py-8 text-center">
                                        <BookOpen className="h-8 w-8 text-[#D1C5C0] mx-auto mb-2" />
                                        <p className="text-sm text-[#78716C]">No courses created yet.</p>
                                        <Link href="/learn/manage" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#D97706]">
                                            Create a course <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                ) : (
                                    managedCourses.slice(0, 5).map((course) => {
                                        const statusColors: Record<string, string> = {
                                            draft: 'bg-gray-50 text-gray-600 border-gray-200',
                                            pending_nou: 'bg-amber-50 text-amber-700 border-amber-200',
                                            approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                            rejected: 'bg-red-50 text-red-700 border-red-200',
                                        };
                                        return (
                                            <div key={course.id} className="px-6 py-4 hover:bg-[#FAFAF9] flex items-center justify-between gap-4">
                                                <p className="text-sm font-semibold text-[#1C1917] truncate">{course.title}</p>
                                                <span className={`inline-flex border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0 ${statusColors[course.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                    {course.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg bg-white border border-[#E7E5E4]">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                                <div>
                                    <h2 className="text-base font-semibold text-[#1C1917]">Training Sessions</h2>
                                    <p className="text-xs text-[#78716C] mt-0.5">Upcoming and past sessions</p>
                                </div>
                            </div>
                            <div className="divide-y divide-[#E7E5E4]">
                                {trainingSessions.length === 0 ? (
                                    <div className="px-6 py-8 text-center">
                                        <GraduationCap className="h-8 w-8 text-[#D1C5C0] mx-auto mb-2" />
                                        <p className="text-sm text-[#78716C]">No training sessions scheduled.</p>
                                    </div>
                                ) : (
                                    trainingSessions.slice(0, 5).map((sessionItem) => (
                                        <div key={sessionItem.id} className="px-6 py-4 hover:bg-[#FAFAF9]">
                                            <p className="text-sm font-semibold text-[#1C1917] truncate">{sessionItem.title}</p>
                                            <p className="text-xs text-[#78716C] mt-0.5">{sessionItem.venue} · {new Date(sessionItem.startDate).toLocaleDateString('en-ZW')} · {sessionItem.seatsRemaining}/{sessionItem.seats} seats left</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Student-only sections ── */}
            {isStudent && (
                <div className="rounded-lg bg-white border border-[#E7E5E4]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                        <div>
                            <h2 className="text-base font-semibold text-[#1C1917]">Available Courses</h2>
                            <p className="text-xs text-[#78716C] mt-0.5">Approved courses open for enrollment</p>
                        </div>
                        <Link href="/learn" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                            Browse all <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-[#E7E5E4]">
                        {managedCourses.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <BookOpen className="h-8 w-8 text-[#D1C5C0] mx-auto mb-3" />
                                <p className="text-sm text-[#78716C]">No courses available yet. Check back soon.</p>
                            </div>
                        ) : (
                            managedCourses.slice(0, 5).map((course) => (
                                <div key={course.id} className="px-6 py-4 hover:bg-[#FAFAF9] transition-colors flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[#1C1917] truncate">{course.title}</p>
                                        <p className="text-xs text-[#78716C] mt-0.5 line-clamp-1">{course.description}</p>
                                    </div>
                                    <Link href="/learn" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] shrink-0">
                                        Open <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ── Technician-only sections ── */}
            {isTechnician && (
                <>
                    {/* Recent Jobs */}
                    <div className="rounded-lg bg-white border border-[#E7E5E4]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                            <div>
                                <h2 className="text-base font-semibold text-[#1C1917]">Recent Jobs</h2>
                                <p className="text-xs text-[#78716C] mt-0.5">Your last recorded service jobs</p>
                            </div>
                            <Link href="/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                                View all <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {recentJobs.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <Wrench className="h-8 w-8 text-[#D1C5C0] mx-auto mb-3" />
                                <p className="text-sm text-[#78716C]">No jobs recorded yet. Use the Field Toolkit or Job Planner to log work.</p>
                                <Link
                                    href="/job-planner"
                                    className="mt-4 inline-flex items-center gap-2 bg-[#D97706] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#b45309]"
                                >
                                    Open Job Planner
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#E7E5E4]">
                                {recentJobs.map((job) => {
                                    const statusColors: Record<string, string> = {
                                        scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
                                        'in-progress': 'bg-amber-50 text-amber-700 border-amber-200',
                                        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                        'follow-up': 'bg-rose-50 text-rose-700 border-rose-200',
                                    };
                                    return (
                                        <div key={job.id} className="px-6 py-4 hover:bg-[#FAFAF9] transition-colors group">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-semibold text-[#1C1917] truncate">{job.clientName}</p>
                                                        <span className={`inline-flex border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColors[job.status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                            {job.status.replace('-', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-[#78716C]">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {job.location}
                                                        </span>
                                                        <span>{job.jobType ? JobTypeLabels[job.jobType] : ''}</span>
                                                        <span>{job.scheduledDate}</span>
                                                    </div>
                                                    {(() => {
                                                        const jobGas = gasUsageByPlannerJobId.get(job.id);
                                                        const plannedGas = job.refrigerantType;
                                                        return (
                                                            <>
                                                                {plannedGas && (
                                                                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                                                                        <Fuel className="h-3 w-3 text-[#A8A29E]" />
                                                                        <span className="font-semibold text-gray-600">
                                                                            Planned: {plannedGas}{job.amount ? ` · ${job.amount} kg` : ''}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {jobGas && (
                                                                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                                                                        <Fuel className="h-3 w-3 text-[#A8A29E]" />
                                                                        <span className="font-semibold text-gray-600">{jobGas.totalKg.toFixed(1)} kg logged</span>
                                                                        {jobGas.refrigerants.map(r => (
                                                                            <span key={r} className="inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">{r}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                    {job.notes && (
                                                        <p className="mt-1 text-xs text-[#A8A29E] line-clamp-1">{job.notes}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {job.status === 'completed' && (
                                                        <Link
                                                            href={`/jobs/request-coc?jobId=${job.id}`}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
                                                        >
                                                            <FileText className="h-3.5 w-3.5" />
                                                            CoC
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href="/job-planner"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#44403C] rounded-lg bg-white border border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        View
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Schedule + Certifications */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Upcoming Scheduled Jobs */}
                        <div className="rounded-lg bg-white border border-[#E7E5E4]">
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
                                    scheduledJobs.map((job) => {
                                        const statusLabel = job.status.replace('-', ' ');
                                        const statusColors: Record<string, string> = {
                                            scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
                                            'in-progress': 'bg-amber-50 text-amber-700 border-amber-200',
                                            completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                            'follow-up': 'bg-rose-50 text-rose-700 border-rose-200',
                                        };
                                        return (
                                            <div key={job.id} className="px-6 py-4 hover:bg-[#FAFAF9] transition-colors group cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 shrink-0 ${
                                                        job.status === 'in-progress' ? 'bg-amber-50 text-amber-600' :
                                                        job.status === 'follow-up' ? 'bg-rose-50 text-rose-600' :
                                                        'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        <CalendarDays className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-semibold text-[#1C1917] truncate">{job.clientName}</p>
                                                            <span className={`inline-flex border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColors[job.status]}`}>
                                                                {statusLabel}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[#78716C] mt-0.5">
                                                            {job.location} · {job.refrigerantClass} · {JobTypeLabels[job.jobType]}
                                                            {job.refrigerantType && <span> · {job.refrigerantType}{job.amount ? ` (${job.amount} kg)` : ''}</span>}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-xs font-semibold text-[#44403C] hidden sm:block">{job.scheduledDate}</span>
                                                        <Link
                                                            href="/job-planner"
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#D97706] bg-[#D97706]/5 border border-[#D97706]/20 hover:bg-[#D97706]/10 transition-colors opacity-0 group-hover:opacity-100"
                                                                                >
                                                            Open <ArrowRight className="h-3 w-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Certification Status */}
                        <div className="rounded-lg bg-white border border-[#E7E5E4]">
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
                                {displayCerts.length === 0 ? (
                                    <div className="px-6 py-8 text-center">
                                        <Award className="h-8 w-8 text-[#D1C5C0] mx-auto mb-2" />
                                        <p className="text-sm text-[#78716C]">No certificates issued yet.</p>
                                        <Link href="/certifications" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#D97706]">
                                            Browse assessments <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                ) : (
                                    displayCerts.map((cert) => {
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
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Refrigerant Activity */}
                    <div className="rounded-lg bg-white border border-[#E7E5E4]">
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

                    {/* Gas Usage by Job Type */}
                    <div className="rounded-lg bg-white border border-[#E7E5E4]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
                            <div>
                                <h2 className="text-base font-semibold text-[#1C1917]">Gas Usage by Job Type</h2>
                                {gasUsageData && !gasUsageLoading && (
                                    <p className="text-xs text-[#78716C] mt-0.5">{gasUsageData.totalKg.toFixed(1)} kg total across {gasUsageData.totalEntries} log entries</p>
                                )}
                                {gasUsageLoading && (
                                    <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mt-1.5" />
                                )}
                            </div>
                            <Link href="/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-[#b45309]">
                                View All Logs <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>

                        {/* Error state */}
                        {gasUsageError && (
                            <div className="px-6 py-4 border-b border-red-100 bg-red-50">
                                <div className="flex items-center gap-2 text-sm text-red-700">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>Failed to load gas usage data. <button onClick={() => mutate(key => typeof key === 'string' && key.startsWith('/api/jobs/gas-usage'))} className="underline font-semibold hover:text-red-800">Retry</button></span>
                                </div>
                            </div>
                        )}

                        {/* Loading state (initial load) */}
                        {gasUsageLoading && !gasUsageData && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] p-4 animate-pulse">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="h-4 w-24 bg-gray-100 rounded" />
                                            <div className="h-3 w-16 bg-gray-100 rounded" />
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full mb-4" />
                                        <div className="space-y-2">
                                            <div className="h-3 w-full bg-gray-100 rounded" />
                                            <div className="h-3 w-3/4 bg-gray-100 rounded" />
                                            <div className="h-3 w-1/2 bg-gray-100 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty state */}
                        {!gasUsageLoading && !gasUsageError && (!gasUsageData || gasUsageData.entries.length === 0) && (
                            <div className="px-6 py-10 text-center">
                                <Fuel className="h-8 w-8 text-[#D1C5C0] mx-auto mb-2" />
                                <p className="text-sm text-[#78716C]">No gas usage data found for this period.</p>
                                <Link href="/field-toolkit" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#D97706]">
                                    Log refrigerant usage <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        )}

                        {/* Data state */}
                        {gasUsageData && gasUsageData.entries.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                {gasUsageData.entries.map((entry) => {
                                    const maxKg = Math.max(...gasUsageData.entries.map(e => e.totalKg), 1);
                                    const pct = Math.round((entry.totalKg / maxKg) * 100);
                                    const colorMap: Record<string, string> = {
                                        'C40_FREEZER': 'from-blue-500 to-blue-400',
                                        'C60_FREEZER': 'from-indigo-500 to-indigo-400',
                                        'C90_FREEZER': 'from-purple-500 to-purple-400',
                                        'COLD_ROOM': 'from-teal-500 to-teal-400',
                                        'FREEZER_ROOM': 'from-cyan-500 to-cyan-400',
                                    };
                                    const barColor = colorMap[entry.jobType] ?? 'from-gray-500 to-gray-400';
                                    return (
                                        <div key={entry.jobType} className="rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] p-4 hover:bg-white transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold text-[#1C1917]">{entry.label}</h3>
                                                <span className="text-xs text-[#A8A29E] font-semibold">{entry.count} entries</span>
                                            </div>

                                            {/* Bar chart */}
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                                                <div
                                                    className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all`}
                                                    style={{ width: `${Math.max(pct, 8)}%` }}
                                                />
                                            </div>

                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[#78716C]">Total</span>
                                                    <span className="font-semibold text-[#1C1917]">{entry.totalKg.toFixed(1)} kg</span>
                                                </div>
                                                {entry.chargeKg > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[#78716C]">Charge</span>
                                                        <span className="font-semibold text-blue-700">{entry.chargeKg.toFixed(1)} kg</span>
                                                    </div>
                                                )}
                                                {entry.recoveryKg > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[#78716C]">Recovery</span>
                                                        <span className="font-semibold text-emerald-700">{entry.recoveryKg.toFixed(1)} kg</span>
                                                    </div>
                                                )}
                                                {entry.leakRepairKg > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[#78716C]">Leak Repair</span>
                                                        <span className="font-semibold text-amber-700">{entry.leakRepairKg.toFixed(1)} kg</span>
                                                    </div>
                                                )}
                                                <div className="pt-1.5 border-t border-[#E7E5E4] flex flex-wrap gap-1">
                                                    {entry.refrigerants.map(r => (
                                                        <span key={r} className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded">{r}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Safety Occupational Accident Section */}
                    <OccupationalAccidentSection isAdmin={false} />
                </>
            )}

            {/* Admin-only: Technician Performance Table */}
            {isAdmin && (
                <div className="rounded-lg bg-white border border-[#E7E5E4] p-6">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-[#1C1917]">Top Certified Technicians</h2>
                        <p className="mt-1 text-sm text-[#78716C]">
                            Ranked by valid certification count{regionFilter === 'all' ? '' : ` in ${regionFilter}`}.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#E7E5E4]">
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Technician</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Region</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Specialization</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Valid Certifications</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#A8A29E]">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topPerformers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 px-4 text-center text-sm text-[#78716C]">
                                            No technicians registered yet
                                        </td>
                                    </tr>
                                ) : (
                                    topPerformers.map((tech) => (
                                        <tr key={tech.id} className="border-b border-[#E7E5E4] hover:bg-[#FAFAF9]">
                                            <td className="py-3 px-4 text-sm font-medium text-[#1C1917]">{tech.name}</td>
                                            <td className="py-3 px-4 text-sm text-[#78716C]">{tech.province}</td>
                                            <td className="py-3 px-4 text-sm text-[#78716C]">{tech.specialization}</td>
                                            <td className="py-3 px-4 text-sm text-[#1C1917]">{tech.validCertCount}</td>
                                            <td className="py-3 px-4 text-sm text-emerald-600 capitalize">{tech.status}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
