import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/server/auth';

const PROTECTED_ROUTE_PREFIXES = [
    '/dashboard',
    '/learn',
    '/sizing-tool',
    '/field-toolkit',
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
    '/technician-registry',
] as const;

const ROUTE_ROLE_RULES: Array<{ prefix: string; roles: string[] }> = [
    { prefix: '/admin', roles: ['org_admin'] },
    { prefix: '/nou-dashboard', roles: ['org_admin', 'regulator'] },
    { prefix: '/suppliers/approvals', roles: ['org_admin', 'regulator'] },
    { prefix: '/suppliers/reorder', roles: ['vendor'] },
    { prefix: '/suppliers/verify-buyer', roles: ['vendor'] },
    { prefix: '/suppliers', roles: ['vendor', 'org_admin'] },
    { prefix: '/supplier-compliance', roles: ['vendor'] },
    { prefix: '/technician-registry', roles: ['technician', 'trainer', 'lecturer', 'org_admin', 'regulator'] },
    { prefix: '/job-planner', roles: ['technician', 'org_admin'] },
    { prefix: '/field-scheduling', roles: ['technician', 'org_admin'] },
    { prefix: '/jobs/request-coc', roles: ['technician'] },
    { prefix: '/jobs', roles: ['technician', 'org_admin'] },
    { prefix: '/learn/approvals', roles: ['regulator', 'org_admin'] },
    { prefix: '/learn/manage', roles: ['trainer', 'lecturer'] },
    { prefix: '/learn', roles: ['technician', 'trainer', 'lecturer', 'org_admin'] },
    { prefix: '/sizing-tool', roles: ['technician', 'org_admin'] },
    { prefix: '/field-toolkit', roles: ['technician', 'org_admin'] },
    { prefix: '/certifications', roles: ['technician', 'trainer', 'lecturer', 'org_admin'] },
    { prefix: '/rewards', roles: ['technician', 'vendor', 'org_admin'] },
    { prefix: '/safety', roles: ['technician', 'trainer', 'lecturer', 'org_admin'] },
    { prefix: '/dashboard', roles: ['technician', 'trainer', 'lecturer', 'vendor', 'org_admin', 'regulator'] },
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const sessionToken = request.cookies.get('coolpro_session')?.value ?? null;
    const session = sessionToken ? verifySession(sessionToken) : null;

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
    runtime: 'nodejs',
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
