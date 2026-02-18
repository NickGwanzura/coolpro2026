'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    BookOpen,
    Calculator,
    Wrench,
    ClipboardList,
    Award,
    Gift,
    ShieldCheck,
    LogOut,
    Menu
} from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import { useEffect, useState } from 'react';

// Define navigation items
const NAV_ITEMS = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['technician', 'trainer', 'vendor', 'org_admin', 'program_admin'] },
    { name: 'Learn', href: '/learn', icon: BookOpen, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Sizing Tool', href: '/sizing-tool', icon: Calculator, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Field Toolkit', href: '/field-toolkit', icon: Wrench, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Jobs & Logs', href: '/jobs', icon: ClipboardList, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Certifications', href: '/certifications', icon: Award, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Rewards', href: '/rewards', icon: Gift, roles: ['technician', 'trainer', 'vendor', 'org_admin', 'program_admin'] },
    { name: 'Admin', href: '/admin', icon: ShieldCheck, roles: ['program_admin'] },
];

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const [role, setRole] = useState<string>('technician');

    useEffect(() => {
        // Client-side session check for sidebar role
        const session = getSession();
        if (session) {
            setRole(session.role);
        }
    }, []);

    const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(role));

    return (
        <div className={cn("flex flex-col h-full bg-white border-r border-gray-200", className)}>
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-blue-600">CoolPro Toolkit</h1>
                <p className="text-xs text-gray-400 mt-1">v1.0.0</p>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    {filteredNav.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5 mr-3", isActive ? "text-blue-600" : "text-gray-400")} />
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={() => logout()}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
