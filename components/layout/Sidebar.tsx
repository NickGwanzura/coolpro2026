'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ComponentType, SVGProps, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    BookOpen,
    Calculator,
    Building2,
    Factory,
    Wrench,
    ClipboardList,
    CalendarRange,
    BellRing,
    Award,
    Users,
    ShieldCheck,
    LogOut,
    Thermometer,
    X,
    AlertTriangle,
    ChevronDown
} from 'lucide-react';
import { getSession, logout } from '@/lib/auth';

// Define navigation items with optional children
interface NavItem {
    name: string;
    href: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    roles: string[];
    children?: NavItem[];
}

// Define navigation items
const NAV_ITEMS: NavItem[] = [
    { name: 'My Stats', href: '/dashboard', icon: LayoutDashboard, roles: ['technician', 'org_admin', 'program_admin'] },
    { name: 'Learn', href: '/learn', icon: BookOpen, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Sizing Tool', href: '/sizing-tool', icon: Calculator, roles: ['technician'] },
    { name: 'Field Toolkit', href: '/field-toolkit', icon: Wrench, roles: ['technician'] },
    { name: 'Job Planner', href: '/job-planner', icon: CalendarRange, roles: ['technician'] },
    { name: 'Field Scheduling', href: '/field-scheduling', icon: BellRing, roles: ['technician'] },
    { name: 'Jobs & Logs', href: '/jobs', icon: ClipboardList, roles: ['technician', 'org_admin', 'program_admin'] },
    { name: 'Certifications', href: '/certifications', icon: Award, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Request COC', href: '/jobs/request-coc', icon: ShieldCheck, roles: ['technician'] },
    { name: 'Compliance Rewards', href: '/rewards', icon: Award, roles: ['vendor'] },
    { name: 'Supplier Registration', href: '/supplier-register', icon: Building2, roles: ['vendor'] },
    { name: 'Supplier Compliance', href: '/supplier-compliance', icon: ShieldCheck, roles: ['vendor'] },
    { name: 'Supply Reporting', href: '/suppliers', icon: Factory, roles: ['vendor', 'org_admin', 'program_admin'] },
    { name: 'Tech Registry', href: '/technician-registry', icon: Users, roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { name: 'Admin', href: '/admin', icon: ShieldCheck, roles: ['program_admin'] },
    { name: 'NOU Dashboard', href: '/nou-dashboard', icon: AlertTriangle, roles: ['org_admin', 'program_admin'] },
];

interface SidebarProps {
    onClose?: () => void;
}

export function Sidebar({ className, onClose }: SidebarProps & { className?: string }) {
    const pathname = usePathname();
    const role = useSyncExternalStore(
        () => () => undefined,
        () => getSession()?.role ?? 'technician',
        () => 'technician'
    );
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['/learn']));

    const toggleExpanded = (href: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(href)) {
                newSet.delete(href);
            } else {
                newSet.add(href);
            }
            return newSet;
        });
    };

    const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(role));

    return (
        <div className={cn("flex flex-col h-full bg-white", className)}>
            {/* Logo Section */}
            <div className="p-4 sm:p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#5A7D5A] to-[#4a6b4a] flex items-center justify-center shadow-sm">
                            <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">HEVACRAZ</h1>
                            <p className="text-xs text-gray-400">HVAC-R Association Zimbabwe</p>
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
                        const hasChildren = item.children && item.children.length > 0;
                        const isExpanded = expandedItems.has(item.href);
                        
                        return (
                            <li key={item.href}>
                                {hasChildren ? (
                                    <>
                                        <button
                                            onClick={() => toggleExpanded(item.href)}
                                            className={cn(
                                                "flex items-center justify-between gap-3 w-full px-3 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-[#5A7D5A]/10 text-[#5A7D5A] shadow-sm"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                                                <span className="truncate">{item.name}</span>
                                            </div>
                                            <ChevronDown className={cn("h-4 w-4 flex-shrink-0 transition-transform", isExpanded && "rotate-180")} />
                                        </button>
                                        {isExpanded && item.children && (
                                            <ul className="ml-4 mt-1 space-y-1">
                                                {item.children.map((child) => {
                                                    const childIsActive = pathname.startsWith(child.href);
                                                    return (
                                                        <li key={child.href}>
                                                            <Link
                                                                href={child.href}
                                                                onClick={onClose}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                                                    childIsActive
                                                                        ? "bg-[#5A7D5A]/10 text-[#5A7D5A] shadow-sm"
                                                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                                )}
                                                            >
                                                                <child.icon className={cn("h-4 w-4 flex-shrink-0", childIsActive ? "text-blue-600" : "text-gray-400")} />
                                                                <span className="truncate">{child.name}</span>
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-[#5A7D5A]/10 text-[#5A7D5A] shadow-sm"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                                        <span className="truncate">{item.name}</span>
                                    </Link>
                                )}
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
