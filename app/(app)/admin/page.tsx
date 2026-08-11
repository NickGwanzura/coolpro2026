'use client';

import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import ComplianceDashboard from '@/components/ComplianceDashboard';

export default function AdminPage() {
    const { user: session, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D97706]"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Program administration and compliance monitoring</p>
                </div>
                <Link
                    href="/admin/invites"
                    className="inline-flex items-center justify-center gap-2 bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                    <UserPlus className="h-4 w-4" />
                    Invite users
                </Link>
            </div>
            <ComplianceDashboard />
        </div>
    );
}
