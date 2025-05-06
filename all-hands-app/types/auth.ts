export type UserRole = 'admin' | 'user';

export interface TokenPayload {
  role: UserRole;
  [key: string]: string | UserRole | number | undefined;
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