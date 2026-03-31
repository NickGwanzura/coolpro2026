import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
    { prefix: '/admin', roles: ['program_admin'] },
    { prefix: '/nou-dashboard', roles: ['program_admin', 'org_admin'] },
    { prefix: '/suppliers', roles: ['vendor', 'org_admin', 'program_admin'] },
    { prefix: '/supplier-compliance', roles: ['vendor'] },
    { prefix: '/technician-registry', roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { prefix: '/job-planner', roles: ['technician'] },
    { prefix: '/field-scheduling', roles: ['technician'] },
    { prefix: '/jobs/request-coc', roles: ['technician'] },
    { prefix: '/jobs', roles: ['technician', 'org_admin', 'program_admin'] },
    { prefix: '/learn', roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { prefix: '/sizing-tool', roles: ['technician'] },
    { prefix: '/field-toolkit', roles: ['technician'] },
    { prefix: '/certifications', roles: ['technician', 'trainer', 'org_admin', 'program_admin'] },
    { prefix: '/rewards', roles: ['technician', 'vendor', 'org_admin', 'program_admin'] },
    { prefix: '/safety', roles: ['technician', 'org_admin', 'program_admin'] },
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for auth cookie
    const authCookie = request.cookies.get('coolpro_auth');
    const roleCookie = request.cookies.get('coolpro_role');
    const isAuthenticated = authCookie?.value === '1';
    const role = roleCookie?.value;

    // Define protected routes (app shell)
    const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));

    // If trying to access protected route without auth, redirect to login
    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const isSupplierFlow = pathname === '/login' && request.nextUrl.searchParams.get('flow') === 'supplier';

    if (pathname === '/login' && isAuthenticated && !isSupplierFlow) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname === '/dashboard' && role === 'vendor') {
        return NextResponse.redirect(new URL('/suppliers', request.url));
    }

    if (pathname === '/dashboard' && role === 'trainer') {
        return NextResponse.redirect(new URL('/learn', request.url));
    }

    const matchedRule = ROUTE_ROLE_RULES.find(({ prefix }) => pathname.startsWith(prefix));
    if (matchedRule) {
        if (!role || !matchedRule.roles.includes(role)) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // Root path shows landing page
    if (pathname === '/') {
        // Show landing page for all users (authenticated or not)
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
