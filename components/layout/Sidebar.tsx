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
    Thermometer,
    Users,
    MapPin,
    X
} from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import { useEffect, useState } from 'react';

// Define navigation items
const NAV_ITEMS = [
    { name: 'My Stats', href: '/dashboard', icon: LayoutDashboard, roles: ['technician', 'trainer', 'vendor', 'org_admin', 'program_admin'] },
    { name: 'Learn', href: '/learn', icon: BookOpen, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Sizing Tool', href: '/sizing-tool', icon: Calculator, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Field Toolkit', href: '/field-toolkit', icon: Wrench, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Jobs & Logs', href: '/jobs', icon: ClipboardList, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Certifications', href: '/certifications', icon: Award, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Request COC', href: '/jobs/request-coc', icon: ShieldCheck, roles: ['technician'] },
    { name: 'Rewards', href: '/rewards', icon: Gift, roles: ['technician', 'trainer', 'vendor', 'org_admin', 'program_admin'] },
    { name: 'Technician Registry', href: '/technician-registry', icon: Users, roles: ['program_admin', 'org_admin', 'trainer'] },
    { name: 'Harare Techs', href: '/technician-registry?province=Harare', icon: MapPin, roles: ['technician', 'trainer', 'vendor', 'org_admin', 'program_admin'] },
    { name: 'Admin', href: '/admin', icon: ShieldCheck, roles: ['program_admin'] },
];

interface SidebarProps {
    onClose?: () => void;
}

export function Sidebar({ className, onClose }: SidebarProps & { className?: string }) {
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
        <div className={cn("flex flex-col h-full bg-white", className)}>
            {/* Logo Section */}
            <div className="p-4 sm:p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                            <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">CoolPro</h1>
                            <p className="text-xs text-gray-400">HVAC-R Toolkit</p>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 sm:px-3">
                <ul className="space-y-1">
                    {filteredNav.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-blue-50 text-blue-700 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer / Logout */}
            <div className="p-2 sm:p-3 border-t border-gray-100">
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 w-full px-3 py-2.5 sm:py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Sign Out</span>
                </button>
                <div className="mt-3 text-center text-xs text-gray-400">
                    v1.0.0 • HVAC-R
                </div>
            </div>
        </div>
    );
}
