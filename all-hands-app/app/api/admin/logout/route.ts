import { NextRequest, NextResponse } from 'next/server';
import { removeAdminSession } from '@/lib/services/admin-session-store';

const SESSION_COOKIE_NAME = 'admin_session';

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    removeAdminSession(sessionToken);
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  });
  return response;
}