import * as jose from 'jose';
import { TokenPayload, UserRole } from '@/types/auth';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '8h';

export class JwtService {
  static async generateToken(role: UserRole): Promise<string> {
    const payload: TokenPayload = { role };
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);
    return token;
  }

  static async verifyToken(token: string): Promise<boolean> {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jose.jwtVerify(token, secret);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async decodeToken(token: string): Promise<TokenPayload | null> {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      return payload as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  static async isAdminToken(token: string): Promise<boolean> {
    const payload = await this.decodeToken(token);
    return payload?.role === 'admin';
  }

  static async isUserToken(token: string): Promise<boolean> {
    const payload = await this.decodeToken(token);
    return payload?.role === 'user';
  }
} 