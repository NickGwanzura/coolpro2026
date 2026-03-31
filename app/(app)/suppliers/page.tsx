'use client';

import { useSyncExternalStore } from 'react';
import SupplierManagement from '@/components/SupplierManagement';
import { getSession, type UserSession } from '@/lib/auth';

export default function SuppliersPage() {
    const session = useSyncExternalStore< UserSession | null >(
        () => () => undefined,
        () => getSession(),
        () => null
    );

    const isVendor = session?.role === 'vendor';

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
