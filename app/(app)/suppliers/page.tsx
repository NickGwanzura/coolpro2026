'use client';

import SupplierManagement from '@/components/SupplierManagement';
import { useAuth } from '@/lib/auth';

export default function SuppliersPage() {
    const { user: session, isLoading } = useAuth();
    const isVendor = session?.role === 'vendor';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">
                    {isVendor ? 'Vendor workspace' : 'Supply chain'}
                </p>
                <h1 className="text-2xl font-bold text-gray-900">{isVendor ? 'Supply Reporting' : 'Supplier Management'}</h1>
                <p className="max-w-3xl text-sm leading-6 text-gray-600">
                    {isVendor
                        ? 'Track refrigerant purchases, sales to client accounts, and the reports you still need to file to the NOU.'
                        : 'Review supplier applications, see approved partners, and keep the demo supply-chain flow aligned across roles.'}
                </p>
            </div>

            <SupplierManagement />
        </div>
    );
}
