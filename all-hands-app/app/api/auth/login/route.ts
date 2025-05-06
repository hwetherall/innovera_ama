import { NextRequest, NextResponse } from 'next/server';
import { JwtService } from '@/lib/services/jwt.service';
import { LoginResponse } from '@/types/auth';

const AUTH_COOKIE_NAME = 'auth_token';
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 8, // 8 hours
};

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const userPassword = process.env.USER_PASSWORD;

    if (!userPassword) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    if (password === userPassword) {
      const token = await JwtService.generateToken('user');
      
      const response = NextResponse.json<LoginResponse>({ success: true });
      response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

      return response;
    }

    return NextResponse.json<LoginResponse>(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error in user login:', error);
    return NextResponse.json<LoginResponse>(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 