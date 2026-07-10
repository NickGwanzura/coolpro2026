'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ComponentType, SVGProps, useState } from 'react';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    BookOpen,
    Calculator,
    Factory,
    Wrench,
    ClipboardList,
    CalendarRange,
    BellRing,
    Award,
    Users,
    ShieldCheck,
    X,
    AlertTriangle,
    WifiOff,
    UserCircle,
    FlaskConical,
    ShieldAlert,
    BarChart3,
    Database,
    Cylinder,
    FileText,
    Recycle,
    RefreshCw,
    UserPlus,
} from 'lucide-react';
import { useAuth, logout } from '@/lib/auth';
import { useEmergencyMode } from '@/lib/emergencyMode';
import { UserProfileModal } from '@/components/UserProfileModal';

interface NavItem {
    name: string;
    href: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    roles: string[];
    exact?: boolean;
    children?: NavItem[];
}

interface NavSection {
    label?: string;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['technician', 'trainer', 'lecturer', 'vendor', 'org_admin', 'student'] },
        ],
    },
    {
        label: 'Operations',
        items: [
            { name: 'Learning Hub', href: '/learn', icon: BookOpen, roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'student'] },
            { name: 'Manage Courses', href: '/learn/manage', icon: BookOpen, roles: ['trainer', 'lecturer'] },
            { name: 'Safety', href: '/safety', icon: ShieldCheck, roles: ['technician', 'trainer', 'lecturer', 'student'] },
            { name: 'Field Scheduling', href: '/field-scheduling', icon: BellRing, roles: ['technician', 'org_admin'] },
        ],
    },
    {
        label: 'Field Tools',
        items: [
            { name: 'Field Toolkit', href: '/field-toolkit', icon: Wrench, roles: ['technician', 'org_admin'] },
            { name: 'Job Planner', href: '/job-planner', icon: CalendarRange, roles: ['technician'] },
            { name: 'Jobs & Logs', href: '/jobs', icon: ClipboardList, roles: ['technician', 'org_admin'] },
            { name: 'Safety & Hazards', href: '/health-safety', icon: ShieldAlert, roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'student'] },
        ],
    },
    {
        label: 'Tools',
        items: [
            { name: 'WhatGas + Risk Engine', href: '/whatgas', icon: FlaskConical, roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'student'] },
            { name: 'Sizing Tool', href: '/sizing-tool', icon: Calculator, roles: ['technician'] },
        ],
    },
    {
        label: 'Refrigerants',
        items: [
            { name: 'Refrigerant Catalogue', href: '/refrigerants', icon: Database, roles: ['technician', 'trainer', 'lecturer', 'vendor', 'org_admin', 'student'] },
            { name: 'Cylinder Registry', href: '/cylinders', icon: Cylinder, roles: ['technician', 'vendor', 'org_admin'] },
            { name: 'Import/Export Permits', href: '/permits', icon: FileText, roles: ['vendor', 'org_admin'] },
            { name: 'Reclamation', href: '/reclamation', icon: Recycle, roles: ['technician', 'vendor', 'org_admin'] },
            { name: 'Recycling', href: '/recycling', icon: RefreshCw, roles: ['technician', 'org_admin'] },
        ],
    },
    {
        label: 'Compliance',
        items: [
            { name: 'Certification', href: '/certifications', icon: Award, roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'student'] },
            { name: 'Rewards', href: '/rewards', icon: Award, roles: ['technician', 'vendor', 'org_admin'] },
            { name: 'Supplier Compliance', href: '/supplier-compliance', icon: ShieldCheck, roles: ['vendor'] },
            { name: 'Supply Reports', href: '/suppliers', icon: Factory, roles: ['vendor', 'org_admin'] },
            { name: 'Vendor Reorder', href: '/suppliers/reorder', icon: Factory, roles: ['vendor'] },
            { name: 'Verify Buyer', href: '/suppliers/verify-buyer', icon: ShieldCheck, roles: ['vendor'] },
            { name: 'Supplier Approvals', href: '/suppliers/approvals', icon: ShieldCheck, roles: ['org_admin'] },
        ],
    },
    {
        label: 'Registry',
        items: [
            { name: 'Technician Registry', href: '/technician-registry', icon: Users, roles: ['trainer', 'lecturer', 'org_admin'] },
            { name: 'Certificate Verification', href: '/verify-technician', icon: ShieldCheck, roles: ['trainer', 'lecturer', 'vendor', 'org_admin'] },
        ],
    },
    {
        label: 'People',
        items: [
            { name: 'System Users', href: '/admin/users', icon: Users, roles: ['org_admin'] },
            { name: 'Applications', href: '/admin/applications', icon: ShieldCheck, roles: ['org_admin'] },
            { name: 'Invites', href: '/admin/invites', icon: UserPlus, roles: ['org_admin'] },
        ],
    },
    {
        label: 'Admin Reviews',
        items: [
            { name: 'NOU Dashboard', href: '/nou-dashboard', icon: AlertTriangle, roles: ['org_admin'] },
            { name: 'Course Approvals', href: '/learn/approvals', icon: ShieldCheck, roles: ['org_admin'] },
            { name: 'COC Requests', href: '/admin/coc-requests', icon: FileText, roles: ['org_admin'] },
            { name: 'Accidents Module', href: '/admin/accidents', icon: AlertTriangle, roles: ['org_admin'] },
        ],
    },
    {
        label: 'Reporting & Data',
        items: [
            { name: 'Reporting', href: '/admin/reporting', icon: BarChart3, roles: ['org_admin'] },
            { name: 'Refrigerant Analytics', href: '/admin/refrigerant-analytics', icon: BarChart3, roles: ['org_admin'] },
            { name: 'Refrigerants (WhatGas Sync)', href: '/admin/refrigerants', icon: Database, roles: ['org_admin'] },
        ],
    },
];

const ADMIN_NAV_SECTIONS: NavSection[] = [
    {
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['org_admin'] },
            { name: 'Compliance Dashboard', href: '/admin', icon: ShieldCheck, roles: ['org_admin'], exact: true },
        ],
    },
    {
        label: 'Operations',
        items: [
            { name: 'Learning Hub', href: '/learn', icon: BookOpen, roles: ['org_admin'], exact: true },
            { name: 'Manage Courses', href: '/learn/manage', icon: BookOpen, roles: ['org_admin'] },
            { name: 'Field Scheduling', href: '/field-scheduling', icon: BellRing, roles: ['org_admin'] },
            { name: 'Job Planner', href: '/job-planner', icon: CalendarRange, roles: ['org_admin'] },
            { name: 'Field Toolkit', href: '/field-toolkit', icon: Wrench, roles: ['org_admin'] },
            { name: 'Jobs & Logs', href: '/jobs', icon: ClipboardList, roles: ['org_admin'] },
            { name: 'Safety', href: '/safety', icon: ShieldCheck, roles: ['org_admin'] },
            { name: 'Safety & Hazards', href: '/health-safety', icon: ShieldAlert, roles: ['org_admin'] },
        ],
    },
    {
        label: 'Tools',
        items: [
            { name: 'WhatGas + Risk Engine', href: '/whatgas', icon: FlaskConical, roles: ['org_admin'] },
            { name: 'Sizing Tool', href: '/sizing-tool', icon: Calculator, roles: ['org_admin'] },
        ],
    },
    {
        label: 'Refrigerants',
        items: [
            { name: 'Refrigerant Catalogue', href: '/refrigerants', icon: Database, roles: ['org_admin'] },
            { name: 'Cylinder Registry', href: '/cylinders', icon: Cylinder, roles: ['org_admin'] },
            { name: 'Import/Export Permits', href: '/permits', icon: FileText, roles: ['org_admin'] },
            { name: 'Reclamation', href: '/reclamation', icon: Recycle, roles: ['org_admin'] },
            { name: 'Recycling', href: '/recycling', icon: RefreshCw, roles: ['org_admin'] },
        ],
    },
    {
        label: 'Suppliers',
        items: [
            { name: 'Supplier Management', href: '/suppliers', icon: Factory, roles: ['org_admin'], exact: true },
            { name: 'Supplier Compliance', href: '/supplier-compliance', icon: ShieldCheck, roles: ['org_admin'] },
            { name: 'Vendor Reorder', href: '/suppliers/reorder', icon: Factory, roles: ['org_admin'] },
            { name: 'Verify Buyer', href: '/suppliers/verify-buyer', icon: ShieldCheck, roles: ['org_admin'] },
            { name: 'Supplier Approvals', href: '/suppliers/approvals', icon: ShieldCheck, roles: ['org_admin'] },
        ],
    },
    {
        label: 'Registry & People',
        items: [
            { name: 'Technician Registry', href: '/technician-registry', icon: Users, roles: ['org_admin'] },
            { name: 'Certificate Verification', href: '/verify-technician', icon: ShieldCheck, roles: ['org_admin'] },
            { name: 'Certifications', href: '/certifications', icon: Award, roles: ['org_admin'] },
            { name: 'Rewards', href: '/rewards', icon: Award, roles: ['org_admin'] },
            { name: 'System Users', href: '/admin/users', icon: Users, roles: ['org_admin'] },
            { name: 'Applications', href: '/admin/applications', icon: ShieldCheck, roles: ['org_admin'] },
            { name: 'Invites', href: '/admin/invites', icon: UserPlus, roles: ['org_admin'] },
        ],
    },
    {
        label: 'Reviews & Data',
        items: [
            { name: 'NOU Dashboard', href: '/nou-dashboard', icon: AlertTriangle, roles: ['org_admin'] },
            { name: 'Course Approvals', href: '/learn/approvals', icon: ShieldCheck, roles: ['org_admin'] },
            { name: 'COC Requests', href: '/admin/coc-requests', icon: FileText, roles: ['org_admin'] },
            { name: 'Accidents Module', href: '/admin/accidents', icon: AlertTriangle, roles: ['org_admin'] },
            { name: 'Reporting', href: '/admin/reporting', icon: BarChart3, roles: ['org_admin'] },
            { name: 'Refrigerant Analytics', href: '/admin/refrigerant-analytics', icon: BarChart3, roles: ['org_admin'] },
            { name: 'Refrigerants (WhatGas Sync)', href: '/admin/refrigerants', icon: Database, roles: ['org_admin'] },
        ],
    },
];

interface SidebarProps {
    onClose?: () => void;
}

function NavLink({ item, pathname, onClose }: { item: NavItem; pathname: string; onClose?: () => void }) {
    const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
        <Link
            href={item.href}
            onClick={onClose}
            className={cn(
                'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                isActive
                    ? 'bg-white/10 text-white'
                    : 'text-[#A8A29E] hover:bg-white/5 hover:text-white'
            )}
        >
            <item.icon
                className={cn(
                    'w-4 h-4 flex-shrink-0 transition-colors',
                    isActive ? 'text-[#D97706]' : 'text-[#57534E] group-hover:text-[#A8A29E]'
                )}
            />
            <span className="truncate">{item.name}</span>
            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D97706] flex-shrink-0" />}
        </Link>
    );
}

export function Sidebar({ className, onClose }: SidebarProps & { className?: string }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const role = user?.role ?? 'technician';
    const { emergencyMode, toggleEmergencyMode } = useEmergencyMode();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const navSections = role === 'org_admin' ? ADMIN_NAV_SECTIONS : NAV_SECTIONS;
    const visibleSections = navSections.map(section => ({
        ...section,
        items: section.items.filter(item => item.roles.includes(role)),
    })).filter(section => section.items.length > 0);

    return (
        <div className={cn('flex flex-col h-full bg-[#1C1917]', className)}>
            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between w-full">
                    <Link href="/dashboard" className="flex items-center gap-2.5 focus-visible:outline-none">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <img
                                src="/logos/ministry-of-environment.jpeg"
                                alt="Ministry of Environment, Climate and Wildlife"
                                className="h-7 w-7 rounded-full object-cover"
                            />
                            <span className="h-6 w-px bg-white/20" />
                            <img
                                src="/logos/hevacraz-logo.jpeg"
                                alt="HEVACRAZ"
                                className="h-7 w-7 rounded-full object-cover"
                            />
                        </div>
                    </Link>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="lg:hidden p-1.5 text-[#57534E] hover:text-white transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 overflow-y-auto">
                {visibleSections.map((section, i) => (
                    <div key={i}>
                        {section.label && (
                            <div className="pt-4 pb-1 px-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#57534E]">
                                    {section.label}
                                </p>
                            </div>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map(item => (
                                <NavLink key={item.href} item={item} pathname={pathname} onClose={onClose} />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Emergency Mode — field-technician concept, not relevant to admin oversight roles */}
            {role !== 'org_admin' && (
                <div className="px-2 pb-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={toggleEmergencyMode}
                        className={cn(
                            'w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold transition-colors border',
                            emergencyMode
                                ? 'bg-rose-600 border-rose-500 text-white hover:bg-rose-700'
                                : 'bg-[#292524] border-white/10 text-[#A8A29E] hover:bg-white/5 hover:text-white'
                        )}
                    >
                        {emergencyMode
                            ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            : <WifiOff className="w-4 h-4 flex-shrink-0" />
                        }
                        <span className="truncate">
                            {emergencyMode ? 'Emergency Active' : 'Emergency Mode'}
                        </span>
                        {emergencyMode && (
                            <span className="ml-auto w-2 h-2 bg-white animate-pulse flex-shrink-0" />
                        )}
                    </button>
                </div>
            )}

            {/* User / Logout */}
            <div className="p-4 border-t border-white/10 flex-shrink-0">
                <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex w-full items-center gap-3 mb-3 hover:bg-white/5 p-2 rounded-md transition-colors text-left"
                >
                    <div className="w-8 h-8 flex items-center justify-center bg-[#292524] flex-shrink-0 rounded-full">
                        <UserCircle className="w-5 h-5 text-[#78716C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name ?? ' '}</p>
                        <p className="text-xs text-[#78716C] capitalize truncate">
                            {user?.role?.replace('_', ' ') ?? ''}
                        </p>
                    </div>
                </button>
            </div>

            {isProfileModalOpen && (
                <UserProfileModal
                    user={user}
                    onClose={() => setIsProfileModalOpen(false)}
                    onLogout={logout}
                />
            )}
        </div>
    );
}
