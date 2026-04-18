'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, Truck } from 'lucide-react';
import RewardsHub from '@/components/RewardsHub';
import VendorRewardsPanel from '@/components/VendorRewardsPanel';
import { MOCK_APPROVED_SUPPLIERS } from '@/constants/suppliers';
import { useAuth } from '@/lib/auth';
import { useSupplierApplications } from '@/lib/api';

export default function RewardsPage() {
    const { user: session, isLoading } = useAuth();
    const { data: supplierApplications = [] } = useSupplierApplications();

    const supplierSummary = useMemo(() => {
        const pendingApplications = supplierApplications.filter(
            application => application.status === 'submitted' || application.status === 'under-review'
        );

        return {
            approvedSuppliers: MOCK_APPROVED_SUPPLIERS.length,
            pendingApplications: pendingApplications.length,
            refrigerantCoverage: new Set(MOCK_APPROVED_SUPPLIERS.flatMap(supplier => supplier.refrigerants)).size,
        };
    }, [supplierApplications]);

    const isAdmin = session?.role === 'org_admin';
    const isVendor = session?.role === 'vendor';

    if (session && isVendor) {
        return <VendorRewardsPanel session={session} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{isAdmin ? 'Rewards Overview' : 'Rewards'}</h1>
                    <p className="text-gray-500 mt-1">
                        {isAdmin
                            ? 'Track all active rewards, vendor participation, and supplier-backed reward coverage.'
                            : 'Redeem your points for exclusive rewards and discounts, supported by approved suppliers.'}
                    </p>
                </div>
                {!isAdmin ? (
                    <Link
                        href="/supplier-compliance"
                        className="inline-flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        <Building2 className="h-4 w-4" />
                        Compliance Module
                    </Link>
                ) : (
                    <Link
                        href="/suppliers"
                        className="inline-flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        <Building2 className="h-4 w-4" />
                        Open Supplier Management
                    </Link>
                )}
            </div>
            <section className="grid gap-4 md:grid-cols-3">
                <article className="border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm text-gray-500">Approved supplier partners</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{supplierSummary.approvedSuppliers}</p>
                        </div>
                        <div className="bg-emerald-50 p-3 text-emerald-700">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>
                </article>
                <article className="border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm text-gray-500">Applications in review</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{supplierSummary.pendingApplications}</p>
                        </div>
                        <div className="bg-amber-50 p-3 text-amber-700">
                            <Building2 className="h-5 w-5" />
                        </div>
                    </div>
                </article>
                <article className="border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm text-gray-500">Refrigerant coverage</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{supplierSummary.refrigerantCoverage}</p>
                        </div>
                        <div className="bg-slate-50 p-3 text-slate-700">
                            <Truck className="h-5 w-5" />
                        </div>
                    </div>
                </article>
            </section>
            <RewardsHub adminView={isAdmin} />
        </div>
    );
}
