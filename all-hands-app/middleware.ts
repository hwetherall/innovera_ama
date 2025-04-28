import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'admin_session';

export async function middleware(request: NextRequest) {
  // Allow access to login page and API routes
  if (
    request.nextUrl.pathname === '/admin/login' ||
    request.nextUrl.pathname.startsWith('/api/admin/login') ||
    request.nextUrl.pathname.startsWith('/api/admin/logout') ||
    request.nextUrl.pathname.startsWith('/api/admin/check-auth')
  ) {
    return NextResponse.next();
  }

  // Only protect /admin routes
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}
