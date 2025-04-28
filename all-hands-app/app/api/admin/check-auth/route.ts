import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/services/admin-session-store';

const SESSION_COOKIE_NAME = 'admin_session';

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (sessionToken && hasAdminSession(sessionToken)) {
    return NextResponse.json({ authenticated: true });
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 });
} 