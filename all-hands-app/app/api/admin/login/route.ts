import { NextRequest, NextResponse } from 'next/server';
import { addAdminSession } from '@/lib/services/admin-session-store';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 8, // 8 hours
};

function generateSessionToken() {
  // Use crypto for secure random token
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (password === adminPassword) {
    const sessionToken = generateSessionToken();
    addAdminSession(sessionToken);
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);
    return response;
  } else {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
} 