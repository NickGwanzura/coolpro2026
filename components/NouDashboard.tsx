'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  FileDown,
  PackageSearch,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  Warehouse,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import {
  MOCK_NOU_DISCREPANCY_ALERTS,
  MOCK_NOU_GREY_MARKET_ALERTS,
  MOCK_NOU_MONTHLY_TRENDS,
  MOCK_NOU_REFRIGERANT_BREAKDOWN,
  MOCK_NOU_STATS,
} from '@/constants/nou';
import { MOCK_APPROVED_SUPPLIERS } from '@/constants/suppliers';
import {
  type ManagedCourse,
  type SupplierReorder,
  type TechnicianVerification,
} from '@/lib/platformStore';
import { useCourses, useReorders, useVerifications, useSupplierApplications, useSupplierLedger, useSupplierComplianceApplications, useTechnicians } from '@/lib/api';
import type {
  ApprovedSupplier,
  NOUDiscrepancyAlert,
  NOUGreyMarketAlert,
  NOUMonthlyTrendPoint,
  NOURefrigerantBreakdown,
} from '@/types/index';

const kpis: Array<{ label: string; value: string; hint: string; icon: typeof Warehouse }> = [
  { label: 'Registered Technicians', value: String(MOCK_NOU_STATS.totalTechnicians), hint: 'All provinces covered', icon: Warehouse },
  { label: 'Purchased Kg', value: MOCK_NOU_STATS.totalPurchasedKg.toLocaleString(), hint: 'Approved suppliers only', icon: BarChart3 },
  { label: 'Recovered Kg', value: MOCK_NOU_STATS.totalRecoveredKg.toLocaleString(), hint: 'Logged and verified', icon: RefreshCcw },
  { label: 'Emissions Avoided', value: `${MOCK_NOU_STATS.emissionsAvoidedTonnes}t`, hint: 'CO2-eq this quarter', icon: ShieldCheck },
];

function AccessDenied() {
  const router = useRouter();

  return (
    <div className="border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="bg-rose-50 p-3 text-rose-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Access restricted</h2>
          <p className="max-w-2xl text-sm leading-6 text-gray-600">
            The NOU Compliance Dashboard is available to org_admin and regulator roles only.
            Please use the dashboard or return once you have the correct permission set.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NouDashboard() {
  const router = useRouter();
  const { user: session, isLoading } = useAuth();
  const { success, info } = useToast();

  const { data: courses = [] } = useCourses();
  const { data: reorders = [] } = useReorders();
  const { data: verifications = [] } = useVerifications();
  const { data: techniciansData = [] } = useTechnicians();

  const { data: supplierApplications = [] } = useSupplierApplications();
  const { data: supplierLedger = [] } = useSupplierLedger();
  const { data: supplierComplianceApplications = [] } = useSupplierComplianceApplications();

  const accessAllowed = session && ['org_admin', 'regulator'].includes(session.role);

  const topTechnicians = useMemo(() => techniciansData.slice(0, 4), [techniciansData]);
  const supplierReviewQueue = useMemo(
    () =>
      supplierApplications.filter(
        application => application.status === 'submitted' || application.status === 'under-review'
      ),
    [supplierApplications]
  );
  const supplierStatusCounts = useMemo(
    () => ({
      submitted: supplierApplications.filter(application => application.status === 'submitted').length,
      underReview: supplierApplications.filter(application => application.status === 'under-review').length,
      approved: supplierApplications.filter(application => application.status === 'approved').length,
      rejected: supplierApplications.filter(application => application.status === 'rejected').length,
    }),
    [supplierApplications]
  );
  const supplierStatusStyles: Record<ApprovedSupplier['quotaStatus'], string> = {
    'within-quota': 'bg-emerald-50 text-emerald-700',
    'near-limit': 'bg-amber-50 text-amber-700',
    exceeded: 'bg-rose-50 text-rose-700',
  };
  // Derived metrics for new KPI cards
  const pendingCourseApprovals = useMemo(
    () => (courses ?? []).filter(c => c.status === 'pending_nou').length,
    [courses]
  );
  const pendingReorderApprovals = useMemo(
    () => (reorders ?? []).filter(r => r.status === 'pending_nou').length,
    [reorders]
  );
  const activeCertifications = useMemo(
    () => techniciansData.reduce(
      (sum, tech) => sum + tech.certifications.filter(c => c.status === 'valid').length,
      0
    ),
    [techniciansData]
  );
  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const verificationsThisMonth = useMemo(
    () => (verifications ?? []).filter(v => v.createdAt.startsWith(thisMonthStr)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verifications, thisMonthStr]
  );

  // Refrigerant volumes approved YTD grouped by gas type
  const approvedReordersByGas = useMemo(() => {
    const ytdStart = `${now.getFullYear()}-01-01`;
    const map: Record<string, number> = {};
    for (const r of (reorders ?? [])) {
      if (r.status === 'approved' && r.createdAt >= ytdStart) {
        map[r.gasType] = (map[r.gasType] ?? 0) + r.quantityKg;
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reorders]);

  // Recent activity feed — last 10 events sorted by createdAt desc
  const recentActivity = useMemo(() => {
    type ActivityEvent = {
      id: string;
      label: string;
      detail: string;
      at: string;
      kind: 'registration' | 'course' | 'reorder' | 'verification';
    };
    const events: ActivityEvent[] = [];

    // New technician registrations — most recent 5
    techniciansData.slice(0, 5).forEach(tech => {
      events.push({
        id: `reg-${tech.id}`,
        label: `${tech.name} registered`,
        detail: `${tech.province} · ${tech.specialization}`,
        at: tech.registrationDate,
        kind: 'registration',
      });
    });

    // Course submissions
    for (const course of (courses ?? [])) {
      if (course.status === 'pending_nou' || course.status === 'approved' || course.status === 'rejected') {
        events.push({
          id: `course-${course.id}`,
          label: `Course "${course.title}" ${course.status === 'pending_nou' ? 'awaiting NOU approval' : course.status}`,
          detail: `By ${course.lecturerName}`,
          at: course.updatedAt,
          kind: 'course',
        });
      }
    }

    // Reorder decisions
    for (const r of (reorders ?? [])) {
      events.push({
        id: `reorder-${r.id}`,
        label: `Reorder ${r.gasType} ${r.quantityKg} kg — ${r.status.replace('_', ' ')}`,
        detail: `${r.vendorName}`,
        at: r.createdAt,
        kind: 'reorder',
      });
    }

    // Verification flags (not_found / revoked = suspicious)
    for (const v of (verifications ?? [])) {
      if (v.result === 'not_found' || v.result === 'revoked') {
        events.push({
          id: `verif-${v.id}`,
          label: `Verification flag: ${v.result.replace('_', ' ')} (${v.method})`,
          detail: `By ${v.vendorName} — query: "${v.query}"`,
          at: v.createdAt,
          kind: 'verification',
        });
      }
    }

    return events
      .sort((a, b) => (a.at > b.at ? -1 : 1))
      .slice(0, 10);
  }, [courses, reorders, verifications, techniciansData]);

  const vendorReportingSummary = useMemo(() => {
    const technicianLinkedSales = supplierLedger.filter(
      entry => entry.direction === 'sale' && entry.technicianId
    );

    return {
      technicianLinkedSales,
      totalReportedKg: technicianLinkedSales
        .filter(entry => entry.reportedToNou)
        .reduce((sum, entry) => sum + entry.quantityKg, 0),
      pendingNou: technicianLinkedSales.filter(entry => !entry.reportedToNou).length,
      certificateQueue: supplierComplianceApplications.filter(
        entry => entry.status === 'submitted' || entry.status === 'under-review'
      ).length,
    };
  }, [supplierComplianceApplications, supplierLedger]);

  if (!session) {
    return (
      <div className="border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-48 rounded bg-gray-100" />
          <div className="h-4 w-80 rounded bg-gray-100" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 bg-gray-50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!accessAllowed) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <section className="border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              National Compliance Oversight Unit
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              NOU Compliance Dashboard
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-gray-600">
              Track refrigerant purchases, approved suppliers, recovery volumes, and flagged
              discrepancies across the national RAC network.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                const { jsPDF } = require('jspdf');
                const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

                // Header bar
                doc.setFillColor(15, 23, 42);
                doc.rect(0, 0, 297, 30, 'F');
                doc.setFontSize(16);
                doc.setTextColor(255, 255, 255);
                doc.setFont(undefined, 'bold');
                doc.text('UNEP COMPLIANCE REPORT — NATIONAL REFRIGERATION PROGRAMME', 148.5, 18, { align: 'center' });

                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(156, 163, 175);
                doc.text(`Republic of Zimbabwe  |  Generated: ${new Date().toLocaleDateString('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' })}`, 148.5, 25, { align: 'center' });

                // KPI Section
                doc.setFontSize(12);
                doc.setTextColor(15, 23, 42);
                doc.setFont(undefined, 'bold');
                doc.text('Programme Summary', 20, 45);

                doc.setLineWidth(0.3);
                doc.setDrawColor(229, 231, 235);
                doc.line(20, 48, 277, 48);

                const kpiData = [
                  ['Registered Technicians', String(MOCK_NOU_STATS.totalTechnicians)],
                  ['Total Refrigerant Purchased (kg)', MOCK_NOU_STATS.totalPurchasedKg.toLocaleString()],
                  ['Total Refrigerant Recovered (kg)', MOCK_NOU_STATS.totalRecoveredKg.toLocaleString()],
                  ['Emissions Avoided (CO2-eq tonnes)', String(MOCK_NOU_STATS.emissionsAvoidedTonnes)],
                  ['Active Discrepancy Flags', String(MOCK_NOU_DISCREPANCY_ALERTS.length)],
                  ['Grey Market Alerts', String(MOCK_NOU_GREY_MARKET_ALERTS.length)],
                ];

                kpiData.forEach(([label, val], i) => {
                  const x = i % 3 === 0 ? 20 : i % 3 === 1 ? 109 : 198;
                  const y = 58 + Math.floor(i / 3) * 22;
                  doc.setFillColor(248, 250, 252);
                  doc.rect(x, y - 8, 83, 18, 'F');
                  doc.setFontSize(7);
                  doc.setFont(undefined, 'normal');
                  doc.setTextColor(107, 114, 128);
                  doc.text(label.toUpperCase(), x + 4, y - 1);
                  doc.setFontSize(13);
                  doc.setFont(undefined, 'bold');
                  doc.setTextColor(15, 23, 42);
                  doc.text(val, x + 4, y + 7);
                });

                // Compliance note
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(107, 114, 128);
                doc.text('This report was generated in accordance with Montreal Protocol Article 7 reporting obligations.', 20, 115);
                doc.text('Data reflects current registry and field submissions. Figures are subject to final verification.', 20, 120);

                // Footer
                doc.setFillColor(248, 250, 252);
                doc.rect(0, 190, 297, 10, 'F');
                doc.setFontSize(7);
                doc.setTextColor(107, 114, 128);
                doc.text('CONFIDENTIAL — FOR OFFICIAL USE ONLY', 148.5, 196, { align: 'center' });

                doc.save(`UNEP-compliance-report-${new Date().toISOString().split('T')[0]}.pdf`);
                success('UNEP compliance report downloaded');
              }}
              className="inline-flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <FileDown className="h-4 w-4" />
              Generate UNEP Report
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('discrepancy-flags');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                else info('Scroll down to view Discrepancy Alerts');
              }}
              className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <ArrowRight className="h-4 w-4" />
              Review Flags
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">{item.label}</p>
                  <p className="text-3xl font-bold tracking-tight text-gray-900">{item.value}</p>
                </div>
                <div className="bg-slate-50 p-3 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
                {item.hint}
              </p>
            </article>
          );
        })}
      </section>

      {/* Regulator-focused KPI row */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Active Certifications</p>
              <p className="text-3xl font-bold tracking-tight text-gray-900">{activeCertifications}</p>
            </div>
            <div className="bg-emerald-50 p-3 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">Valid certs in registry</p>
        </article>

        <article className="border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Pending Course Approvals</p>
              <p className="text-3xl font-bold tracking-tight text-gray-900">{pendingCourseApprovals}</p>
            </div>
            <div className="bg-amber-50 p-3 text-amber-700">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">Awaiting NOU sign-off</p>
        </article>

        <article className="border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Reorders Awaiting NOU</p>
              <p className="text-3xl font-bold tracking-tight text-gray-900">{pendingReorderApprovals}</p>
            </div>
            <div className="bg-sky-50 p-3 text-sky-700">
              <PackageSearch className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">Gas reorders pending</p>
        </article>

        <article className="border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Verifications This Month</p>
              <p className="text-3xl font-bold tracking-tight text-gray-900">{verificationsThisMonth}</p>
            </div>
            <div className="bg-purple-50 p-3 text-purple-700">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">Vendor checks run</p>
        </article>
      </section>

      {/* Pending NOU Actions + Recent Activity */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <article className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Activity className="h-5 w-5 text-purple-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pending NOU Actions</h2>
              <p className="text-sm text-gray-500">Items requiring NOU decision</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/learn/approvals')}
              className="flex w-full items-center justify-between border border-amber-100 bg-amber-50 p-4 text-left transition-colors hover:bg-amber-100"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-gray-900">Course Approvals</p>
                  <p className="text-sm text-amber-700">
                    {pendingCourseApprovals} course{pendingCourseApprovals !== 1 ? 's' : ''} pending NOU sign-off
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-600" />
            </button>

            <button
              onClick={() => router.push('/suppliers/approvals')}
              className="flex w-full items-center justify-between border border-sky-100 bg-sky-50 p-4 text-left transition-colors hover:bg-sky-100"
            >
              <div className="flex items-center gap-3">
                <PackageSearch className="h-5 w-5 text-sky-600" />
                <div>
                  <p className="font-semibold text-gray-900">Supplier Reorder Approvals</p>
                  <p className="text-sm text-sky-700">
                    {pendingReorderApprovals} reorder{pendingReorderApprovals !== 1 ? 's' : ''} awaiting NOU approval
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-sky-600" />
            </button>

            {(verifications ?? []).filter(v => v.result === 'not_found' || v.result === 'revoked').length > 0 && (
              <div className="border border-rose-100 bg-rose-50 p-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Suspicious Verification Attempts</p>
                    <p className="text-sm text-rose-700">
                      {(verifications ?? []).filter(v => v.result === 'not_found' || v.result === 'revoked').length} flag
                      {(verifications ?? []).filter(v => v.result === 'not_found' || v.result === 'revoked').length !== 1 ? 's' : ''} — possible unregistered buyer activity
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>

        <article className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Users className="h-5 w-5 text-slate-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent System Activity</h2>
              <p className="text-sm text-gray-500">Last 10 events across the platform</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {recentActivity.length === 0 ? (
              <p className="py-4 text-sm text-gray-500">No recent activity to display.</p>
            ) : (
              recentActivity.map(event => {
                const kindStyles: Record<typeof event.kind, string> = {
                  registration: 'bg-emerald-50 text-emerald-700',
                  course: 'bg-amber-50 text-amber-700',
                  reorder: 'bg-sky-50 text-sky-700',
                  verification: 'bg-rose-50 text-rose-700',
                };
                const kindLabels: Record<typeof event.kind, string> = {
                  registration: 'Reg',
                  course: 'Course',
                  reorder: 'Reorder',
                  verification: 'Verif',
                };
                return (
                  <div key={event.id} className="flex items-start gap-3 py-3">
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${kindStyles[event.kind]}`}>
                      {kindLabels[event.kind]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{event.label}</p>
                      <p className="truncate text-xs text-gray-500">{event.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {new Intl.DateTimeFormat('en-ZW', { dateStyle: 'short' }).format(new Date(event.at))}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>

      {/* Refrigerant volumes approved YTD by gas type */}
      {approvedReordersByGas.length > 0 && (
        <section className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Refrigerant Volumes Approved YTD</h2>
              <p className="text-sm text-gray-500">Approved reorders grouped by gas type — {now.getFullYear()}</p>
            </div>
          </div>

          <div className="space-y-4">
            {(() => {
              const maxKg = Math.max(...approvedReordersByGas.map(([, kg]) => kg), 1);
              return approvedReordersByGas.map(([gas, kg]) => (
                <div key={gas} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{gas}</span>
                    <span className="font-semibold text-gray-900">{kg.toLocaleString()} kg</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-purple-600"
                      style={{ width: `${(kg / maxKg) * 100}%` }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Refrigerant Breakdown</h2>
              <p className="text-sm text-gray-500">Purchased kilograms by refrigerant type</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Approved suppliers
            </span>
          </div>

          <div className="space-y-4">
            {MOCK_NOU_REFRIGERANT_BREAKDOWN.map((item: NOURefrigerantBreakdown) => (
              <div key={item.refrigerant} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.refrigerant}</span>
                  <span className="font-semibold text-gray-900">{item.purchasedKg.toLocaleString()} kg</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100">
                  <div
                    className="h-3 rounded-full bg-slate-900"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Purchase vs Usage</h2>
            <p className="text-sm text-gray-500">Mock trend for the current reporting cycle</p>
          </div>

          <div className="space-y-4">
            {MOCK_NOU_MONTHLY_TRENDS.map((point: NOUMonthlyTrendPoint) => {
              const max = 1500;
              return (
                <div key={point.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{point.month}</span>
                    <span className="text-xs text-gray-500">
                      {point.purchasedKg} kg purchased / {point.usedKg} kg used
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="h-3 rounded-full bg-gray-100">
                      <div
                        className="h-3 rounded-full bg-sky-500"
                        style={{ width: `${(point.purchasedKg / max) * 100}%` }}
                      />
                    </div>
                    <div className="h-3 rounded-full bg-gray-100">
                      <div
                        className="h-3 rounded-full bg-emerald-500"
                        style={{ width: `${(point.usedKg / max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-slate-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Supplier Review & Network</h2>
              <p className="text-sm text-gray-500">Queue intake, quota checks, and approved coverage</p>
            </div>
            <button
              onClick={() => router.push('/supplier-register')}
              className="ml-auto inline-flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Building2 className="h-4 w-4" />
              Supplier intake
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Submitted</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{supplierStatusCounts.submitted}</p>
            </div>
            <div className="border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">In review</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{supplierStatusCounts.underReview}</p>
            </div>
            <div className="border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Approved</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{supplierStatusCounts.approved}</p>
            </div>
            <div className="border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Rejected</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{supplierStatusCounts.rejected}</p>
            </div>
          </div>

          <div className="mt-5 border border-amber-100 bg-amber-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-900">Applications awaiting review</p>
                <p className="text-xs text-amber-700">
                  {supplierReviewQueue.length} queued for traceability and compliance checks
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                Local mock flow
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {supplierReviewQueue.length === 0 ? (
                <div className="border border-dashed border-amber-200 bg-white p-4 text-sm text-amber-900">
                  No supplier applications are waiting right now. New submissions from the supplier
                  registration flow will appear here automatically.
                </div>
              ) : (
                supplierReviewQueue.slice(0, 3).map((application) => (
                  <div key={application.id} className="border border-amber-100 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{application.companyName}</p>
                        <p className="text-sm text-gray-500">
                          {application.province} · {application.city || 'City pending'}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {application.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {application.refrigerantsSupplied.slice(0, 3).map((refrigerant) => (
                        <span
                          key={refrigerant}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                        >
                          {refrigerant}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-gray-400">
                      Submitted{' '}
                      {new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(
                        new Date(application.submittedAt)
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200">
           <div className="min-w-[500px]">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_0.9fr] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              <span>Supplier</span>
              <span>Refrigerants</span>
              <span>Usage</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-gray-200">
              {MOCK_APPROVED_SUPPLIERS.map((supplier) => {
                const usage = Math.round((supplier.totalSalesKg / supplier.importQuotaKg) * 100);

                return (
                  <div key={supplier.id} className="grid grid-cols-[1.5fr_1fr_1fr_0.9fr] gap-3 px-4 py-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-900">{supplier.name}</p>
                      <p className="text-xs text-gray-500">{supplier.id}</p>
                    </div>
                    <div className="text-gray-600">{supplier.refrigerants.join(', ')}</div>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{usage}%</p>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-slate-900"
                          style={{ width: `${Math.min(usage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${supplierStatusStyles[supplier.quotaStatus]}`}>
                        {supplier.quotaStatus.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
           </div>
          </div>
        </article>

        <article id="discrepancy-flags" className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Discrepancy Alerts</h2>
              <p className="text-sm text-gray-500">Technicians flagged for follow-up</p>
            </div>
          </div>

          <div className="space-y-3">
            {MOCK_NOU_DISCREPANCY_ALERTS.map((alert: NOUDiscrepancyAlert) => (
              <div key={alert.id} className="border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{alert.technicianName}</p>
                    <p className="text-sm text-gray-500">
                      {alert.province} · {alert.flagReason}
                    </p>
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    Ratio {alert.ratio.toFixed(2)}x
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Purchased</p>
                    <p className="mt-1 font-semibold text-gray-900">{alert.purchasedKg} kg</p>
                  </div>
                  <div className="bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Logged</p>
                    <p className="mt-1 font-semibold text-gray-900">{alert.loggedUsageKg} kg</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <FileDown className="h-5 w-5 text-sky-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vendor-linked refrigerant logs</h2>
              <p className="text-sm text-gray-500">Supplier sales tied to registered technicians</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Technician-linked sales</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{vendorReportingSummary.technicianLinkedSales.length}</p>
            </div>
            <div className="border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Reported to NOU</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{vendorReportingSummary.totalReportedKg} kg</p>
            </div>
            <div className="border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Pending vendor filings</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{vendorReportingSummary.pendingNou}</p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto border border-gray-200">
           <div className="min-w-[520px]">
            <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              <span>Technician</span>
              <span>Supplier</span>
              <span>Refrigerant</span>
              <span>NOU</span>
            </div>
            <div className="divide-y divide-gray-200">
              {vendorReportingSummary.technicianLinkedSales.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500">
                  No vendor-linked technician sales have been filed yet.
                </div>
              ) : (
                vendorReportingSummary.technicianLinkedSales.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr] gap-3 px-4 py-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-900">{entry.counterpartyName}</p>
                      <p className="text-xs text-gray-500">
                        {entry.technicianRegistrationNumber ?? 'Reg. pending'} · {entry.counterpartyCompany ?? 'Company pending'}
                      </p>
                    </div>
                    <div className="text-gray-700">{entry.supplierName}</div>
                    <div className="text-gray-700">{entry.refrigerant} · {entry.quantityKg} kg</div>
                    <div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${entry.reportedToNou ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {entry.reportedToNou ? 'Filed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
           </div>
          </div>
        </article>

        <article className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Supplier compliance certificates</h2>
              <p className="text-sm text-gray-500">Vendor certificate requests currently in the compliance pipeline</p>
            </div>
          </div>

          <div className="border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Queue awaiting review</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{vendorReportingSummary.certificateQueue}</p>
          </div>

          <div className="mt-4 space-y-3">
            {supplierComplianceApplications.length === 0 ? (
              <div className="border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                No supplier compliance certificate requests have been submitted yet.
              </div>
            ) : (
              supplierComplianceApplications.slice(0, 4).map((entry) => (
                <div key={entry.id} className="border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{entry.supplierName}</p>
                      <p className="text-sm text-gray-500">
                        {entry.certificateType.replace(/-/g, ' ')} · {entry.monthCoverage}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                      {entry.status.replace(/-/g, ' ')}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{entry.supportingSummary}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Grey Market Detection</h2>
              <p className="text-sm text-gray-500">Logs without matching purchase records</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200">
           <div className="min-w-[480px]">
            <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_1.2fr] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              <span>Technician</span>
              <span>Province</span>
              <span>Kg Logged</span>
              <span>Reason</span>
            </div>
            <div className="divide-y divide-gray-200">
            {MOCK_NOU_GREY_MARKET_ALERTS.map((alert: NOUGreyMarketAlert) => (
              <div key={alert.id} className="grid grid-cols-[1.1fr_0.8fr_0.8fr_1.2fr] gap-3 px-4 py-4 text-sm">
                <span className="font-semibold text-gray-900">{alert.technicianName}</span>
                <span className="text-gray-600">{alert.province}</span>
                <span className="font-medium text-gray-900">{alert.loggedUsageKg} kg</span>
                <span className="text-gray-600">{alert.alertReason}</span>
              </div>
            ))}
          </div>
           </div>
          </div>
        </article>

        <article className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Regional Snapshot</h2>
              <p className="text-sm text-gray-500">Top technicians in the current dataset</p>
            </div>
          </div>

          <div className="space-y-3">
            {topTechnicians.map((tech, index) => (
              <div key={tech.id} className="border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {index + 1}. {tech.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tech.province} · {tech.specialization}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {tech.certifications.length} certs
                    </p>
                    <p className="text-xs text-gray-500">{tech.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
