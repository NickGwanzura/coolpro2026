import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseSessionUnsafe } from '@/lib/server/auth-edge';

const PROTECTED_ROUTE_PREFIXES = [
    '/dashboard',
    '/learn',
    '/sizing-tool',
    '/field-toolkit',
    '/whatgas',
    '/job-planner',
    '/field-scheduling',
    '/nou-dashboard',
    '/suppliers',
    '/supplier-compliance',
    '/jobs',
    '/certifications',
    '/rewards',
    '/admin',
    '/safety',
    '/health-safety',
    '/technician-registry',
    '/refrigerants',
    '/cylinders',
    '/permits',
    '/reclamation',
    '/recycling',
] as const;

const ROUTE_ROLE_RULES: Array<{ prefix: string; roles: string[] }> = [
    { prefix: '/admin', roles: ['org_admin'] },
    { prefix: '/nou-dashboard', roles: ['org_admin'] },
    { prefix: '/suppliers/approvals', roles: ['org_admin'] },
    { prefix: '/suppliers/reorder', roles: ['vendor'] },
    { prefix: '/suppliers/verify-buyer', roles: ['vendor'] },
    { prefix: '/suppliers', roles: ['vendor', 'org_admin'] },
    { prefix: '/supplier-compliance', roles: ['vendor'] },
    { prefix: '/technician-registry', roles: ['trainer', 'lecturer', 'org_admin'] },
    { prefix: '/job-planner', roles: ['technician'] },
    { prefix: '/field-scheduling', roles: ['technician', 'org_admin'] },
    { prefix: '/jobs/request-coc', roles: ['technician'] },
    { prefix: '/jobs', roles: ['technician'] },
    { prefix: '/learn/approvals', roles: ['org_admin'] },
    { prefix: '/learn/manage', roles: ['trainer', 'lecturer'] },
    { prefix: '/learn', roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'student'] },
    { prefix: '/sizing-tool', roles: ['technician'] },
    { prefix: '/field-toolkit', roles: ['technician'] },
    { prefix: '/whatgas', roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'student'] },
    { prefix: '/certifications', roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'student'] },
    { prefix: '/rewards', roles: ['technician', 'vendor', 'org_admin'] },
    { prefix: '/safety', roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'student'] },
    { prefix: '/health-safety', roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'student'] },
    { prefix: '/dashboard', roles: ['technician', 'trainer', 'lecturer', 'vendor', 'org_admin', 'student'] },
    { prefix: '/admin/lecturers', roles: ['org_admin'] },
    { prefix: '/admin/students', roles: ['org_admin'] },
    { prefix: '/admin/technicians', roles: ['org_admin'] },
    { prefix: '/admin/certification-engine', roles: ['org_admin'] },
    { prefix: '/admin/accidents', roles: ['org_admin'] },
    { prefix: '/admin/reporting', roles: ['org_admin'] },
    { prefix: '/admin/refrigerants', roles: ['org_admin'] },
    { prefix: '/refrigerants', roles: ['technician', 'trainer', 'lecturer', 'vendor', 'org_admin', 'student'] },
    { prefix: '/cylinders', roles: ['technician', 'vendor', 'org_admin'] },
    { prefix: '/permits', roles: ['vendor', 'org_admin'] },
    { prefix: '/reclamation', roles: ['technician', 'vendor', 'org_admin'] },
    { prefix: '/recycling', roles: ['technician', 'org_admin'] },
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const sessionToken = request.cookies.get('coolpro_session')?.value ?? null;
    const session = sessionToken ? parseSessionUnsafe(sessionToken) : null;

    const isAuthenticated = session !== null;
    const role = session?.role ?? null;

    const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));

    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const isSupplierFlow = pathname === '/login' && request.nextUrl.searchParams.get('flow') === 'supplier';

    if (pathname === '/login' && isAuthenticated && !isSupplierFlow) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const matchedRule = ROUTE_ROLE_RULES.find(({ prefix }) => pathname.startsWith(prefix));
    if (matchedRule) {
        if (!role || !matchedRule.roles.includes(role)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    if (pathname === '/') {
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
