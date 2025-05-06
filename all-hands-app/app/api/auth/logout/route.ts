import { NextRequest, NextResponse } from 'next/server';
import { LoginResponse } from '@/types/auth';

const AUTH_COOKIE_NAME = 'auth_token';
const ADMIN_COOKIE_NAME = 'admin_token';

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 0,
};

export async function POST(request: NextRequest) {
  try {
    const { cookieType } = await request.json();
    const response = NextResponse.json<LoginResponse>({ success: true });
    
    if (cookieType === 'admin') {
      response.cookies.set(ADMIN_COOKIE_NAME, '', CLEAR_COOKIE_OPTIONS);
    } else if (cookieType === 'all') {
      response.cookies.set(AUTH_COOKIE_NAME, '', CLEAR_COOKIE_OPTIONS);
      response.cookies.set(ADMIN_COOKIE_NAME, '', CLEAR_COOKIE_OPTIONS);
    } else {
      return NextResponse.json<LoginResponse>(
        { success: false, error: 'Invalid cookie type. Must be either "admin" or "all"' },
        { status: 400 }
      );
    }
    
    return response;
  } catch (error) {
    console.error('Error in logout:', error);
    return NextResponse.json<LoginResponse>(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
} 