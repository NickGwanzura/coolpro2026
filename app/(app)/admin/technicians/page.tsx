'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function TechnicianDirectoryPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && user) {
            router.replace('/technician-registry');
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return <div className="p-8 text-sm text-slate-500">Loading…</div>;
    }

    if (!user || user.role !== 'org_admin') {
        return (
            <div className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                Access restricted to org admins only.
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
    );
}
