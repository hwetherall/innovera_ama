export type UserRole = 'user' | 'admin';

export interface TokenPayload {
  role: UserRole;
  exp?: number;
  iat?: number;
}

export interface LoginResponse {
  success: boolean;
  error?: string;
}

export interface AuthCheckResponse {
  authenticated: boolean;
  role?: UserRole;
  error?: string;
} 