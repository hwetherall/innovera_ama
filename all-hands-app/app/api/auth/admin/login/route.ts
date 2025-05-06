import { NextRequest, NextResponse } from 'next/server';
import { JwtService } from '@/lib/services/jwt.service';
import { LoginResponse } from '@/types/auth';

const ADMIN_COOKIE_NAME = 'admin_token';
const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 8, // 8 hours
};

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    if (password === adminPassword) {
      const token = await JwtService.generateToken('admin');
      const response = NextResponse.json<LoginResponse>({ success: true });
      response.cookies.set(ADMIN_COOKIE_NAME, token, ADMIN_COOKIE_OPTIONS);
      return response;
    }

    return NextResponse.json<LoginResponse>(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json<LoginResponse>(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 