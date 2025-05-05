import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'admin_session';
const API_KEY_HEADER = 'x-api-key';

// CORS configuration for frontend requests
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
const isDevelopment = process.env.NODE_ENV === 'development';

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export async function middleware(request: NextRequest) {
  // Handle API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const apiKey = request.headers.get(API_KEY_HEADER);
    const isExternalRequest = origin && !origin.includes(request.nextUrl.hostname);

    // Skip auth for login/logout endpoints
    if (
      request.nextUrl.pathname.startsWith('/api/admin/login') ||
      request.nextUrl.pathname.startsWith('/api/admin/logout') ||
      request.nextUrl.pathname.startsWith('/api/admin/check-auth')
    ) {
      return NextResponse.next();
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      if (!origin) {
        return new NextResponse(null, { status: 400 });
      }

      // For frontend requests (no API key), validate origin
      if (!apiKey) {
        if (!isDevelopment && !allowedOrigins.includes(origin)) {
          return new NextResponse(null, { status: 403 });
        }
      }

      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
          'Access-Control-Max-Age': '86400',
          ...securityHeaders,
        },
      });
    }

    // Handle API key authentication
    if (apiKey) {
      // Validate API key
      if (apiKey !== process.env.EXTERNAL_REQUEST_API_KEY) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.next();
    }

    // Handle frontend requests (no API key)
    if (isExternalRequest) {
      // Validate origin for frontend requests
      if (!isDevelopment && !allowedOrigins.includes(origin!)) {
        return new NextResponse(
          JSON.stringify({ error: 'Origin not allowed' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Add CORS headers for frontend requests
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', origin!);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    return NextResponse.next();
  }

  // Allow access to login page
  if (request.nextUrl.pathname === '/admin/login') {
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
