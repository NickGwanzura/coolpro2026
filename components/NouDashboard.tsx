'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileDown,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Warehouse,
} from 'lucide-react';
import { getSession, type UserSession } from '@/lib/auth';
import { MOCK_TECHNICIANS } from '@/constants/registry';
import {
  MOCK_NOU_DISCREPANCY_ALERTS,
  MOCK_NOU_GREY_MARKET_ALERTS,
  MOCK_NOU_MONTHLY_TRENDS,
  MOCK_NOU_REFRIGERANT_BREAKDOWN,
  MOCK_NOU_STATS,
} from '@/constants/nou';
import { MOCK_APPROVED_SUPPLIERS } from '@/constants/suppliers';
import { STORAGE_KEYS, readCollection } from '@/lib/platformStore';
import type {
  ApprovedSupplier,
  NOUDiscrepancyAlert,
  NOUGreyMarketAlert,
  NOUMonthlyTrendPoint,
  NOURefrigerantBreakdown,
  SupplierComplianceApplication,
  SupplierLedgerEntry,
  SupplierRegistration,
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Access restricted</h2>
          <p className="max-w-2xl text-sm leading-6 text-gray-600">
            The NOU Compliance Dashboard is available to program_admin and org_admin roles only.
            Please use the dashboard or return once you have the correct permission set.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
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
  const session = useSyncExternalStore<UserSession | null>(
    () => () => undefined,
    () => getSession(),
    () => null
  );
  const supplierApplications = useSyncExternalStore(
    () => () => undefined,
    () =>
      readCollection<SupplierRegistration>(STORAGE_KEYS.supplierApplications, [], [
        STORAGE_KEYS.supplierProfilesLegacy,
      ]),
    () => [] as SupplierRegistration[]
  );
  const supplierLedger = useSyncExternalStore(
    () => () => undefined,
    () => readCollection<SupplierLedgerEntry>(STORAGE_KEYS.supplierLedger, []),
    () => [] as SupplierLedgerEntry[]
  );
  const supplierComplianceApplications = useSyncExternalStore(
    () => () => undefined,
    () => readCollection<SupplierComplianceApplication>(STORAGE_KEYS.supplierComplianceApplications, []),
    () => [] as SupplierComplianceApplication[]
  );

  const accessAllowed = session && ['program_admin', 'org_admin'].includes(session.role);

  const topTechnicians = useMemo(() => MOCK_TECHNICIANS.slice(0, 4), []);
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-48 rounded bg-gray-100" />
          <div className="h-4 w-80 rounded bg-gray-100" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl bg-gray-50" />
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
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
              <FileDown className="h-4 w-4" />
              Generate UNEP Report
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
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
            <article key={item.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">{item.label}</p>
                  <p className="text-3xl font-bold tracking-tight text-gray-900">{item.value}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
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

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-slate-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Supplier Review & Network</h2>
              <p className="text-sm text-gray-500">Queue intake, quota checks, and approved coverage</p>
            </div>
            <button
              onClick={() => router.push('/supplier-register')}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Building2 className="h-4 w-4" />
              Supplier intake
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Submitted</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{supplierStatusCounts.submitted}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">In review</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{supplierStatusCounts.underReview}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Approved</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{supplierStatusCounts.approved}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Rejected</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{supplierStatusCounts.rejected}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
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
                <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-4 text-sm text-amber-900">
                  No supplier applications are waiting right now. New submissions from the supplier
                  registration flow will appear here automatically.
                </div>
              ) : (
                supplierReviewQueue.slice(0, 3).map((application) => (
                  <div key={application.id} className="rounded-2xl border border-amber-100 bg-white p-4">
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

          <div className="overflow-hidden rounded-2xl border border-gray-200">
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
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Discrepancy Alerts</h2>
              <p className="text-sm text-gray-500">Technicians flagged for follow-up</p>
            </div>
          </div>

          <div className="space-y-3">
            {MOCK_NOU_DISCREPANCY_ALERTS.map((alert: NOUDiscrepancyAlert) => (
              <div key={alert.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
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
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Purchased</p>
                    <p className="mt-1 font-semibold text-gray-900">{alert.purchasedKg} kg</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
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
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <FileDown className="h-5 w-5 text-sky-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Vendor-linked refrigerant logs</h2>
              <p className="text-sm text-gray-500">Supplier sales tied to registered technicians</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Technician-linked sales</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{vendorReportingSummary.technicianLinkedSales.length}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Reported to NOU</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{vendorReportingSummary.totalReportedKg} kg</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Pending vendor filings</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{vendorReportingSummary.pendingNou}</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
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
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Supplier compliance certificates</h2>
              <p className="text-sm text-gray-500">Vendor certificate requests currently in the compliance pipeline</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Queue awaiting review</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{vendorReportingSummary.certificateQueue}</p>
          </div>

          <div className="mt-4 space-y-3">
            {supplierComplianceApplications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                No supplier compliance certificate requests have been submitted yet.
              </div>
            ) : (
              supplierComplianceApplications.slice(0, 4).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
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
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Grey Market Detection</h2>
              <p className="text-sm text-gray-500">Logs without matching purchase records</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200">
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
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Regional Snapshot</h2>
              <p className="text-sm text-gray-500">Top technicians in the current dataset</p>
            </div>
          </div>

          <div className="space-y-3">
            {topTechnicians.map((tech, index) => (
              <div key={tech.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
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
