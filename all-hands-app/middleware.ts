import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JwtService } from '@/lib/services/jwt.service';

const AUTH_COOKIE_NAME = 'auth_token';
const ADMIN_COOKIE_NAME = 'admin_token';
const API_KEY_HEADER = 'x-api-key';

// List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/admin/login',
  '/api/auth/logout'
];

// List of public pages that don't require authentication
const PUBLIC_PAGES = [
  '/login'
];

// List of admin endpoints and their allowed methods
const ADMIN_ENDPOINTS = [
  { path: '/api/ai/answer-generation', methods: ['POST'] },
  { path: '/api/sessions', methods: ['POST'] }
];

// List of admin dynamic routes and their allowed methods
const ADMIN_DYNAMIC_ENDPOINTS = [
  { pattern: /^\/api\/questions\/[^/]+$/, methods: ['DELETE', 'PUT'] },
  { pattern: /^\/api\/questions\/[^/]+\/answer$/, methods: ['DELETE', 'POST', 'PUT'] },
  { pattern: /^\/api\/sessions\/[^/]+$/, methods: ['PUT', 'DELETE'] },
  // All transcript routes and methods
  { pattern: /^\/api\/transcripts(\/.*)?$/, methods: ['GET', 'POST', 'PUT', 'DELETE'] }
];

function isPublicEndpoint(pathname: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGES.some(page => pathname === page);
}

function isAdminEndpoint(pathname: string, method: string): boolean {
  // Check static admin endpoints
  const isStaticAdmin = ADMIN_ENDPOINTS.some(endpoint => {
    const pathMatch = pathname === endpoint.path;
    const methodMatch = endpoint.methods.includes(method);
    return pathMatch && methodMatch;
  })

  if (isStaticAdmin) return true;

  // Check dynamic admin routes
  return ADMIN_DYNAMIC_ENDPOINTS.some(endpoint => {
    const pathMatch = endpoint.pattern.test(pathname);
    const methodMatch = endpoint.methods.includes(method);
    return pathMatch && methodMatch;
  });
}

function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  return apiKey === process.env.EXTERNAL_REQUEST_API_KEY;
}

// List of paths that should bypass middleware
const BYPASS_PATHS = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/innovera-logo.png'
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Bypass middleware for static assets and Next.js internal routes
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    const apiKey = request.headers.get(API_KEY_HEADER);
    const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    // Skip auth for public endpoints
    if (isPublicEndpoint(pathname)) {
      return NextResponse.next();
    }

    // For API requests, require either API key or valid token
    if (!validateApiKey(apiKey) && !authToken && !adminToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For admin endpoints, require either API key or admin token
    if (isAdminEndpoint(pathname, method)) {
      if (!validateApiKey(apiKey) && (!adminToken || !(await JwtService.isAdminToken(adminToken)))) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  }

  // Handle page routes
  // Allow access to public pages
  if (isPublicPage(pathname)) {
    return NextResponse.next();
  }

  // Check for admin routes (including admin login)
  if (pathname.startsWith('/admin')) {
    const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    
    // For admin login page, require user authentication
    if (pathname === '/admin/login') {
      if (!authToken || !(await JwtService.isUserToken(authToken))) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }
    
    // For other admin pages, require admin token
    if (!adminToken || !(await JwtService.isAdminToken(adminToken))) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    return NextResponse.next();
  }

  // For all other routes, require user authentication
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  
  if (!authToken || !(await JwtService.verifyToken(authToken))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
