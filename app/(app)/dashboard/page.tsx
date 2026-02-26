'use client';

import { useEffect, useState } from 'react';
import { getSession, UserSession, logout } from '@/lib/auth';
import {
    ClipboardCheck,
    Award,
    Gift,
    TrendingUp,
    ArrowRight,
    RefreshCw,
    Users,
    Calendar,
    MapPin,
    CheckCircle,
    Clock,
    Wrench,
    Thermometer,
    ShieldAlert,
    Plus
} from 'lucide-react';
import Link from 'next/link';
import OccupationalAccidentSection from '@/components/OccupationalAccidentSection';
import { OccupationalAccident } from '@/types';

export default function DashboardPage() {
    const [session, setSession] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState('today');

    useEffect(() => {
        const userSession = getSession();
        setSession(userSession);
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-gray-500">Please log in to view the dashboard</p>
                <a
                    href="/login"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Go to Login
                </a>
            </div>
        );
    }

    // Role-based KPI cards
    const isAdmin = session.role === 'program_admin' || session.role === 'org_admin';
    const isTechnician = session.role === 'technician';

    // Technician KPIs
    const technicianStats = [
        {
            label: 'Jobs Completed',
            value: dateRange === 'today' ? '3' : dateRange === 'week' ? '12' : '48',
            icon: ClipboardCheck,
            color: 'blue',
            trend: dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This week' : 'This month'
        },
        {
            label: 'Pending COCs',
            value: '2',
            icon: Clock,
            color: 'amber',
            trend: '1 awaiting approval'
        },
        {
            label: 'Rewards Points',
            value: '450',
            icon: Gift,
            color: 'emerald',
            trend: '+50 this month'
        },
        {
            label: 'Certifications',
            value: '5',
            icon: Award,
            color: 'purple',
            trend: '2 expiring soon'
        },
    ];

    // Admin KPIs
    const adminStats = [
        {
            label: 'Active Techs',
            value: '24',
            icon: Users,
            color: 'blue',
            trend: '8 online now'
        },
        {
            label: 'Total Jobs',
            value: dateRange === 'today' ? '15' : dateRange === 'week' ? '89' : '342',
            icon: Wrench,
            color: 'emerald',
            trend: dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This week' : 'This month'
        },
        {
            label: 'Pending COCs',
            value: '8',
            icon: Award,
            color: 'amber',
            trend: '3 need review'
        },
        {
            label: 'Regions',
            value: '5',
            icon: MapPin,
            color: 'purple',
            trend: 'Harare, Bulawayo'
        },
        {
            label: 'Safety Incidents',
            value: '2',
            icon: ShieldAlert,
            color: 'red',
            trend: '1 critical this week'
        },
    ];

    const stats = isAdmin ? adminStats : technicianStats;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
                    </h1>
                    <p className="text-gray-500 mt-1">Welcome back, {session.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date Filter */}
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
                        <button
                            onClick={() => setDateRange('today')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${dateRange === 'today'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setDateRange('week')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${dateRange === 'week'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setDateRange('month')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${dateRange === 'month'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            This Month
                        </button>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Demo Banner */}
            {session.isDemo && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <Award className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-800">
                                You are viewing this dashboard as <span className="font-semibold capitalize">{session.role.replace('_', ' ')}</span> in <span className="font-semibold">{session.region}</span>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="mt-4">
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                                <p className="text-xs text-gray-400 mt-2">{stat.trend}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions - Role-based */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Link
                        href="/sizing-tool"
                        className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <Thermometer className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Sizing Tool</p>
                            <p className="text-xs text-gray-500">Calculate capacity</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </Link>
                    <Link
                        href="/field-toolkit"
                        className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                            <Wrench className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Field Toolkit</p>
                            <p className="text-xs text-gray-500">Installations & Logs</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </Link>
                    <Link
                        href="/jobs"
                        className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                            <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Jobs & Logs</p>
                            <p className="text-xs text-gray-500">View all records</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </Link>
                    <Link
                        href="/certifications"
                        className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                            <Award className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Certifications</p>
                            <p className="text-xs text-gray-500">Manage COCs</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </Link>
                    {!isAdmin && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors group cursor-pointer border border-red-100">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600">
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

            {/* Occupational Accident Section */}
            <OccupationalAccidentSection
                isAdmin={isAdmin}
                initialAccidents={isAdmin ? [
                    {
                        id: 'acc1',
                        date: '2026-02-24',
                        jobSite: 'Harare Central Substation',
                        clientName: 'ZESA Holdings',
                        severity: 'High',
                        description: 'Electrical arc flash during maintenance. No injuries reported.',
                        technicianName: 'John Moyo'
                    },
                    {
                        id: 'acc2',
                        date: '2026-02-25',
                        jobSite: 'Bulawayo Cold Storage',
                        clientName: 'Cold Storage Commission',
                        severity: 'Critical',
                        description: 'Major refrigerant leak (R-717) detected. Site evacuated.',
                        technicianName: 'Sarah Miller'
                    }
                ] : []}
            />

            {/* Admin-only: Technician Performance Table */}
            {isAdmin && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers - {dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month'}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Technician</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Region</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Jobs</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">COCs</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">John Moyo</td>
                                    <td className="py-3 px-4 text-sm text-gray-500">Harare</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">12</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">8</td>
                                    <td className="py-3 px-4 text-sm text-emerald-600">4.9 ★</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">Sarah Ncube</td>
                                    <td className="py-3 px-4 text-sm text-gray-500">Bulawayo</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">10</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">7</td>
                                    <td className="py-3 px-4 text-sm text-emerald-600">4.8 ★</td>
                                </tr>
                                <tr className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">Peter Dube</td>
                                    <td className="py-3 px-4 text-sm text-gray-500">Mutare</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">8</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">5</td>
                                    <td className="py-3 px-4 text-sm text-emerald-600">4.7 ★</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
