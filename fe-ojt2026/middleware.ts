import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: With localStorage approach, middleware cannot access tokens (server-side)
// Auth protection is handled by client-side AuthProvider
// This middleware only handles basic routing

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/sign_in', '/sign_up', '/forget_password', '/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // For protected routes, let client-side handle auth check
  // (localStorage is not accessible in middleware)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
