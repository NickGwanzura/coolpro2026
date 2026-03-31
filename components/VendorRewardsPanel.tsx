'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, CheckCircle2, FileBadge2, Gift, ShieldCheck } from 'lucide-react';
import { DEMO_VENDOR_EMAIL } from '@/constants/vendorLedger';
import { STORAGE_KEYS } from '@/lib/platformStore';
import type { SupplierComplianceApplication, SupplierLedgerEntry } from '@/types/index';
import type { UserSession } from '@/lib/auth';

const VENDOR_REWARDS = [
    {
        id: 'vendor-reward-1',
        title: 'NOU Filing Fee Credit',
        points: 300,
        detail: 'Offset one compliance filing cycle after consistent reporting.',
    },
    {
        id: 'vendor-reward-2',
        title: 'Preferred Supplier Badge Renewal',
        points: 550,
        detail: 'Priority review for compliant suppliers with zero late filings.',
    },
    {
        id: 'vendor-reward-3',
        title: 'Audit Preparation Pack',
        points: 220,
        detail: 'Digital templates for NOU and client-facing reporting packs.',
    },
    {
        id: 'vendor-reward-4',
        title: 'Certificate Processing Discount',
        points: 450,
        detail: 'Discount on the next supplier certificate of compliance application.',
    },
] as const;

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value));
}

export default function VendorRewardsPanel({ session }: { session: UserSession }) {
    const allLedgerEntries = useSyncExternalStore(
        () => () => undefined,
        () => {
            if (typeof window === 'undefined') return [] as SupplierLedgerEntry[];
            const raw = window.localStorage.getItem(STORAGE_KEYS.supplierLedger);
            if (!raw) return [] as SupplierLedgerEntry[];

            try {
                return JSON.parse(raw) as SupplierLedgerEntry[];
            } catch {
                return [] as SupplierLedgerEntry[];
            }
        },
        () => [] as SupplierLedgerEntry[]
    );
    const allComplianceApplications = useSyncExternalStore(
        () => () => undefined,
        () => {
            if (typeof window === 'undefined') return [] as SupplierComplianceApplication[];
            const raw = window.localStorage.getItem(STORAGE_KEYS.supplierComplianceApplications);
            if (!raw) return [] as SupplierComplianceApplication[];

            try {
                return JSON.parse(raw) as SupplierComplianceApplication[];
            } catch {
                return [] as SupplierComplianceApplication[];
            }
        },
        () => [] as SupplierComplianceApplication[]
    );

    const supplierLedger = useMemo(() => {
        const bySession = allLedgerEntries.filter(entry => entry.supplierEmail === session.email);
        if (bySession.length > 0) return bySession;
        return allLedgerEntries.filter(entry => entry.supplierEmail === DEMO_VENDOR_EMAIL);
    }, [allLedgerEntries, session.email]);

    const supplierComplianceApplications = useMemo(() => {
        const bySession = allComplianceApplications.filter(entry => entry.supplierEmail === session.email);
        if (bySession.length > 0) return bySession;
        return allComplianceApplications.filter(entry => entry.supplierEmail === DEMO_VENDOR_EMAIL);
    }, [allComplianceApplications, session.email]);

    const rewardsSummary = useMemo(() => {
        const compliantSales = supplierLedger.filter(
            entry => entry.direction === 'sale' && entry.reportedToNou && entry.clientReported
        );
        const pendingFilings = supplierLedger.filter(
            entry => entry.direction === 'sale' && (!entry.reportedToNou || !entry.clientReported)
        );
        const approvedCertificates = supplierComplianceApplications.filter(entry => entry.status === 'approved');
        const submittedCertificates = supplierComplianceApplications.filter(
            entry => entry.status === 'submitted' || entry.status === 'under-review'
        );
        const totalPoints =
            compliantSales.length * 35 +
            approvedCertificates.length * 180 +
            submittedCertificates.length * 60;

        return {
            compliantSales,
            pendingFilings,
            approvedCertificates,
            submittedCertificates,
            totalPoints,
        };
    }, [supplierComplianceApplications, supplierLedger]);

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#0f172a] text-white shadow-xl">
                <div className="p-8">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                                Vendor rewards
                            </p>
                            <h2 className="mt-3 text-3xl font-bold">Compliance Rewards Balance</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                                Vendors earn points for filing sales to the NOU, sharing compliant delivery records
                                with registered technicians, and completing supplier compliance applications.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Available points</p>
                            <p className="mt-3 text-5xl font-bold text-emerald-300">{rewardsSummary.totalPoints}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    label="Compliant Sales"
                    value={rewardsSummary.compliantSales.length}
                    hint="Filed to NOU and shared with technicians"
                    icon={ShieldCheck}
                />
                <MetricCard
                    label="Pending Filings"
                    value={rewardsSummary.pendingFilings.length}
                    hint="Sales still missing one or more compliance steps"
                    icon={FileBadge2}
                />
                <MetricCard
                    label="Approved Certificates"
                    value={rewardsSummary.approvedCertificates.length}
                    hint="Supplier compliance certificates granted"
                    icon={CheckCircle2}
                />
                <MetricCard
                    label="Reward Options"
                    value={VENDOR_REWARDS.length}
                    hint="Vendor-specific compliance rewards available"
                    icon={Gift}
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Available vendor rewards</h3>
                            <p className="text-sm text-gray-500">Rewards unlocked by compliant supply-chain behaviour</p>
                        </div>
                        <Award className="h-5 w-5 text-gray-300" />
                    </div>

                    <div className="space-y-3">
                        {VENDOR_REWARDS.map((reward) => (
                            <div key={reward.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-gray-900">{reward.title}</p>
                                        <p className="mt-1 text-sm text-gray-500">{reward.detail}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900">{reward.points}</p>
                                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">points</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Compliance milestones</h3>
                            <p className="text-sm text-gray-500">Recent filings and certificate requests tied to your supplier account</p>
                        </div>
                        <Link
                            href="/supplier-compliance"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            Open compliance module
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {supplierComplianceApplications.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                No supplier certificate applications yet. Submit one from the compliance module to start earning certificate rewards.
                            </div>
                        ) : (
                            supplierComplianceApplications.slice(0, 3).map((application) => (
                                <div key={application.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">{application.certificateType.replace(/-/g, ' ')}</p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Coverage {application.monthCoverage} · {formatDate(application.submittedAt)}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                                            {application.status.replace(/-/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </article>
            </section>
        </div>
    );
}

function MetricCard({
    label,
    value,
    hint,
    icon: Icon,
}: {
    label: string;
    value: number;
    hint: string;
    icon: typeof ShieldCheck;
}) {
    return (
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-gray-400">{hint}</p>
        </article>
    );
}
