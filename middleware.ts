import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for auth cookie
    const authCookie = request.cookies.get('coolpro_auth');
    const roleCookie = request.cookies.get('coolpro_role');
    const isAuthenticated = authCookie?.value === '1';
    const role = roleCookie?.value;

    // Define protected routes (app shell)
    const isProtectedRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/learn') ||
        pathname.startsWith('/sizing-tool') ||
        pathname.startsWith('/field-toolkit') ||
        pathname.startsWith('/jobs') ||
        pathname.startsWith('/certifications') ||
        pathname.startsWith('/rewards') ||
        pathname.startsWith('/admin');

    // If trying to access protected route without auth, redirect to login
    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Admin route protection
    if (pathname.startsWith('/admin')) {
        if (role !== 'program_admin') {
            // Redirect unauthorized users to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // If trying to access login page while authenticated, redirect to dashboard
    if (pathname === '/login' && isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
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
