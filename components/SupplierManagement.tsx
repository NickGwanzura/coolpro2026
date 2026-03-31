'use client';

import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    BadgeCheck,
    Building2,
    CheckCircle2,
    CircleDashed,
    Clock3,
    Filter,
    MapPin,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Truck,
    Users,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { readCollection, STORAGE_KEYS, writeCollection } from '@/lib/platformStore';
import { MOCK_APPROVED_SUPPLIERS } from '@/constants/suppliers';
import VendorReportingPanel from '@/components/VendorReportingPanel';
import type {
    ApprovedSupplier,
    SupplierRegistration,
    SupplierRegistrationStatus,
} from '@/types/index';

type SupplierApplicationRecord = SupplierRegistration & {
    reviewedAt?: string;
    reviewedBy?: string;
    reviewNote?: string;
};

type StatusFilter = SupplierRegistrationStatus | 'all';

const STATUS_STYLES: Record<SupplierRegistrationStatus, string> = {
    submitted: 'bg-slate-100 text-slate-700 border-slate-200',
    'under-review': 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_LABELS: Record<SupplierRegistrationStatus, string> = {
    submitted: 'Submitted',
    'under-review': 'Under review',
    approved: 'Approved',
    rejected: 'Rejected',
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-ZW', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function toApprovedSupplier(application: SupplierApplicationRecord): ApprovedSupplier {
    const refrigerants = application.refrigerantsSupplied.length > 0
        ? application.refrigerantsSupplied
        : ['R-290'];

    return {
        id: application.id,
        name: application.tradingName || application.companyName,
        refrigerants,
        totalSalesKg: 0,
        importQuotaKg: 0,
        usagePercent: 0,
        quotaStatus: 'within-quota',
        nouApproved: true,
        region: application.province,
    };
}

function Badge({
    children,
    className,
}: {
    children: ReactNode;
    className: string;
}) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}>
            {children}
        </span>
    );
}

export default function SupplierManagement() {
    const session = useSyncExternalStore(
        () => () => undefined,
        () => getSession(),
        () => null
    );
    const storedApplications = useSyncExternalStore(
        () => () => undefined,
        () =>
            readCollection<SupplierApplicationRecord>(
                STORAGE_KEYS.supplierApplications,
                [],
                [STORAGE_KEYS.supplierProfilesLegacy]
            ),
        () => []
    );
    const [localApplications, setLocalApplications] = useState<SupplierApplicationRecord[] | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [provinceFilter, setProvinceFilter] = useState('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const applications = localApplications ?? storedApplications;

    const isVendor = session?.role === 'vendor';
    const canReview = session ? ['org_admin', 'program_admin'].includes(session.role) : false;
    const myApplications = useMemo(() => {
        if (!session) return [];
        const email = session.email.toLowerCase();
        return applications.filter(application => application.email.toLowerCase() === email);
    }, [applications, session]);

    const visibleApplications = useMemo(() => {
        const base = isVendor ? myApplications : applications;

        return base
            .filter(application => {
                const matchesSearch =
                    !search.trim() ||
                    [
                        application.companyName,
                        application.tradingName ?? '',
                        application.contactName,
                        application.registrationNumber,
                        application.city,
                        application.province,
                    ]
                        .join(' ')
                        .toLowerCase()
                        .includes(search.trim().toLowerCase());

                const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
                const matchesProvince = provinceFilter === 'all' || application.province === provinceFilter;

                return matchesSearch && matchesStatus && matchesProvince;
            })
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }, [applications, isVendor, myApplications, provinceFilter, search, statusFilter]);

    const selectedApplication = useMemo(
        () => visibleApplications.find(application => application.id === selectedId) ?? visibleApplications[0] ?? null,
        [selectedId, visibleApplications]
    );

    const approvedApplications = applications.filter(application => application.status === 'approved');
    const approvedSupplierList = useMemo(() => {
        const merged = [...MOCK_APPROVED_SUPPLIERS, ...approvedApplications.map(toApprovedSupplier)];
        const seen = new Set<string>();

        return merged.filter((supplier) => {
            const key = supplier.name.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [approvedApplications]);

    const stats = [
        {
            label: isVendor ? 'My applications' : 'Applications',
            value: isVendor ? myApplications.length : applications.length,
            icon: Building2,
            tone: 'blue',
            detail: isVendor ? 'Linked to your account' : 'All supplier records',
        },
        {
            label: 'Pending review',
            value: applications.filter(application => application.status === 'submitted' || application.status === 'under-review').length,
            icon: Clock3,
            tone: 'amber',
            detail: 'Waiting on compliance review',
        },
        {
            label: 'Approved suppliers',
            value: approvedSupplierList.length,
            icon: BadgeCheck,
            tone: 'emerald',
            detail: 'Approved supplier registry',
        },
        {
            label: 'NOU flags',
            value: MOCK_APPROVED_SUPPLIERS.filter(supplier => supplier.usagePercent >= 95).length,
            icon: ShieldAlert,
            tone: 'rose',
            detail: 'Suppliers approaching quota limits',
        },
    ] as const;

    const updateStatus = (id: string, status: SupplierRegistrationStatus) => {
        const nextApplications = applications.map(application => {
            if (application.id !== id) return application;

            return {
                ...application,
                status,
                reviewedAt: new Date().toISOString(),
                reviewedBy: session?.name ?? 'System',
                reviewNote:
                    status === 'approved'
                        ? 'Approved in the demo review flow.'
                        : status === 'rejected'
                            ? 'Rejected in the demo review flow.'
                            : 'Sent back to review queue.',
            };
        });

        setLocalApplications(nextApplications);
        writeCollection(STORAGE_KEYS.supplierApplications, nextApplications);
    };

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                            Supplier management
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">Review supplier applications and approved partners</h2>
                            <p className="max-w-2xl text-sm leading-6 text-gray-600">
                                Keep supplier onboarding, approval status, and approved refrigerant partners in one place.
                                Vendors see their own application state, while org admins and program admins can review the full queue.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/supplier-register"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Register supplier
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/nou-dashboard"
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            View NOU dashboard
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => {
                    const Icon = item.icon;
                    const toneClasses: Record<string, string> = {
                        blue: 'bg-blue-50 text-blue-600',
                        amber: 'bg-amber-50 text-amber-600',
                        emerald: 'bg-emerald-50 text-emerald-600',
                        rose: 'bg-rose-50 text-rose-600',
                    };

                    return (
                        <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className={`rounded-xl p-3 ${toneClasses[item.tone]}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <Sparkles className="h-4 w-4 text-gray-300" />
                            </div>
                            <div className="mt-4 space-y-1">
                                <p className="text-3xl font-bold text-gray-900">{item.value}</p>
                                <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                                <p className="text-xs text-gray-500">{item.detail}</p>
                            </div>
                        </div>
                    );
                })}
            </section>

            {isVendor && session && (
                <VendorReportingPanel session={session} application={myApplications[0]} />
            )}

            {isVendor && (
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Your account</p>
                            <h3 className="mt-2 text-lg font-semibold text-gray-900">Supplier status linked to {session?.email ?? 'your profile'}</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Vendors only see their own application records in this view.
                            </p>
                        </div>
                        <Badge className="border-gray-200 bg-gray-50 text-gray-600">Vendor view</Badge>
                    </div>

                    {myApplications.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6">
                            <div className="flex items-start gap-4">
                                <CircleDashed className="mt-0.5 h-5 w-5 text-gray-400" />
                                <div className="space-y-2">
                                    <p className="font-semibold text-gray-900">No supplier application linked yet</p>
                                    <p className="max-w-2xl text-sm leading-6 text-gray-600">
                                        Submit your business details through the supplier registration flow to enter the review queue.
                                    </p>
                                    <Link
                                        href="/supplier-register"
                                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                                    >
                                        Register as supplier
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Latest application</p>
                                        <h4 className="mt-2 text-xl font-bold text-gray-900">
                                            {myApplications[0].tradingName || myApplications[0].companyName}
                                        </h4>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Submitted {formatDate(myApplications[0].submittedAt)}
                                        </p>
                                    </div>
                                    <Badge className={STATUS_STYLES[myApplications[0].status]}>
                                        {STATUS_LABELS[myApplications[0].status]}
                                    </Badge>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <InfoCard label="Province" value={myApplications[0].province} />
                                    <InfoCard label="Supplier type" value={myApplications[0].supplierType.replace('-', ' ')} />
                                    <InfoCard label="Refrigerants" value={myApplications[0].refrigerantsSupplied.join(', ')} wide />
                                    <InfoCard label="Contact" value={myApplications[0].contactName} />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Next step</p>
                                <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                                        Keep your business details current for compliance review.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-600" />
                                        Approved suppliers appear in the management and NOU flows.
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Truck className="mt-0.5 h-4 w-4 text-amber-600" />
                                        Supplier records stay local to this demo environment.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {canReview && (
                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Review queue</p>
                                <h3 className="mt-2 text-lg font-semibold text-gray-900">All supplier applications</h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Review incoming applications, approve trusted partners, or send submissions back to review.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                                    <Filter className="h-4 w-4" />
                                    <select
                                        value={statusFilter}
                                        onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                                        className="bg-transparent text-sm outline-none"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="under-review">Under review</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                                    <MapPin className="h-4 w-4" />
                                    <select
                                        value={provinceFilter}
                                        onChange={(event) => setProvinceFilter(event.target.value)}
                                        className="bg-transparent text-sm outline-none"
                                    >
                                        <option value="all">All provinces</option>
                                        {Array.from(new Set(applications.map(application => application.province)))
                                            .sort()
                                            .map(province => (
                                                <option key={province} value={province}>
                                                    {province}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                                    <Search className="h-4 w-4" />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search suppliers"
                                        className="w-40 bg-transparent outline-none placeholder:text-gray-400"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
                            <div className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.6fr] gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                                <span>Company</span>
                                <span>Location</span>
                                <span>Status</span>
                                <span className="text-right">Action</span>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {visibleApplications.length === 0 ? (
                                    <div className="p-6 text-sm text-gray-500">
                                        No supplier applications match the current filters.
                                    </div>
                                ) : (
                                    visibleApplications.map((application) => {
                                        const isSelected = selectedApplication?.id === application.id;
                                        return (
                                            <button
                                                key={application.id}
                                                type="button"
                                                onClick={() => setSelectedId(application.id)}
                                                className={`grid w-full grid-cols-[1.4fr_0.8fr_0.7fr_0.6fr] gap-4 px-4 py-4 text-left transition hover:bg-gray-50 ${
                                                    isSelected ? 'bg-blue-50/40' : 'bg-white'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-gray-900">
                                                        {application.tradingName || application.companyName}
                                                    </p>
                                                    <p className="truncate text-xs text-gray-500">
                                                        {application.contactName} · {application.registrationNumber}
                                                    </p>
                                                </div>
                                                <div className="min-w-0 text-sm text-gray-600">
                                                    <p className="truncate">{application.city}</p>
                                                    <p className="truncate text-xs text-gray-400">{application.province}</p>
                                                </div>
                                                <div>
                                                    <Badge className={STATUS_STYLES[application.status]}>
                                                        {STATUS_LABELS[application.status]}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                                        Review
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Selected application</p>
                            {selectedApplication ? (
                                <div className="mt-4 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900">
                                                {selectedApplication.tradingName || selectedApplication.companyName}
                                            </h4>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {selectedApplication.contactName} · {selectedApplication.phone}
                                            </p>
                                        </div>
                                        <Badge className={STATUS_STYLES[selectedApplication.status]}>
                                            {STATUS_LABELS[selectedApplication.status]}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                                        <p><span className="font-semibold text-gray-900">Province:</span> {selectedApplication.province}</p>
                                        <p><span className="font-semibold text-gray-900">City:</span> {selectedApplication.city}</p>
                                        <p><span className="font-semibold text-gray-900">Type:</span> {selectedApplication.supplierType.replace('-', ' ')}</p>
                                        <p><span className="font-semibold text-gray-900">Submitted:</span> {formatDate(selectedApplication.submittedAt)}</p>
                                        {selectedApplication.website && (
                                            <p><span className="font-semibold text-gray-900">Website:</span> {selectedApplication.website}</p>
                                        )}
                                        {selectedApplication.taxNumber && (
                                            <p><span className="font-semibold text-gray-900">Tax number:</span> {selectedApplication.taxNumber}</p>
                                        )}
                                        {selectedApplication.pesepayMerchantId && (
                                            <p><span className="font-semibold text-gray-900">Pesepay merchant:</span> {selectedApplication.pesepayMerchantId}</p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Refrigerants supplied</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {selectedApplication.refrigerantsSupplied.map((refrigerant) => (
                                                <Badge key={refrigerant} className="border-blue-200 bg-blue-50 text-blue-700">
                                                    {refrigerant}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {(selectedApplication.reviewedAt || selectedApplication.reviewNote) && (
                                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                            <p className="font-semibold text-gray-900">Review note</p>
                                            <p className="mt-1">{selectedApplication.reviewNote ?? 'Review details recorded locally.'}</p>
                                            {selectedApplication.reviewedAt && (
                                                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-400">
                                                    Updated {formatDate(selectedApplication.reviewedAt)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {canReview && (
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateStatus(selectedApplication.id, 'under-review')}
                                                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                                            >
                                                <Clock3 className="h-4 w-4" />
                                                Under review
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateStatus(selectedApplication.id, 'approved')}
                                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateStatus(selectedApplication.id, 'rejected')}
                                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                                            >
                                                <ShieldAlert className="h-4 w-4" />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                                    No application selected.
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Approved suppliers</p>
                                    <h3 className="mt-2 text-lg font-semibold text-gray-900">Registry and approved applications</h3>
                                </div>
                                <Users className="h-5 w-5 text-gray-300" />
                            </div>
                            <div className="mt-4 space-y-3">
                                {approvedSupplierList.map((supplier) => (
                                    <div key={supplier.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-gray-900">{supplier.name}</p>
                                                <p className="mt-1 text-xs text-gray-500">{supplier.region}</p>
                                            </div>
                                            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Approved</Badge>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {supplier.refrigerants.map((refrigerant) => (
                                                <Badge key={refrigerant} className="border-gray-200 bg-white text-gray-600">
                                                    {refrigerant}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </section>
            )}

            {!canReview && (
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-600" />
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900">Read-only supplier registry</h3>
                            <p className="max-w-3xl text-sm leading-6 text-gray-600">
                                This role can view approved supplier references but cannot change application status.
                                Use the supplier registration flow if you need to submit a new company profile.
                            </p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

function InfoCard({
    label,
    value,
    wide = false,
}: {
    label: string;
    value: string;
    wide?: boolean;
}) {
    return (
        <div className={wide ? 'sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-4' : 'rounded-2xl border border-gray-200 bg-white p-4'}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}
