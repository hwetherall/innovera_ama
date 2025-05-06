/**
 * Service for handling all authentication operations
 */
export class AuthService {
  private static readonly AUTH_COOKIE_NAME = 'auth_token';
  private static readonly ADMIN_COOKIE_NAME = 'admin_token';

  /**
   * Authenticate user with password
   * @param password User password to verify
   * @throws Error if authentication fails
   */
  static async userLogin(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }

      return data;
    } catch (error) {
      console.error('Error in AuthService.userLogin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during login'
      };
    }
  }

  /**
   * Authenticate admin user with password
   * @param password Admin password to verify
   * @throws Error if authentication fails
   */
  static async adminLogin(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }

      return data;
    } catch (error) {
      console.error('Error in AuthService.adminLogin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during login'
      };
    }
  }

  /**
   * Log out current user
   * @param cookieType Type of cookie to clear ('admin' or 'all')
   * @throws Error if logout fails
   */
  static async logout(cookieType: 'admin' | 'all' = 'all'): Promise<void> {
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookieType })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Logout failed');
      }
    } catch (error) {
      console.error('Error in AuthService.logout:', error);
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred during logout');
    }
  }

  /**
   * Check if user is authenticated
   * @returns boolean indicating if user is authenticated
   */
  static isAuthenticated(): boolean {
    return typeof document !== 'undefined' && !!document.cookie.includes(this.AUTH_COOKIE_NAME);
  }

  /**
   * Check if user is admin
   * @returns boolean indicating if user is admin
   */
  static isAdmin(): boolean {
    return typeof document !== 'undefined' && !!document.cookie.includes(this.ADMIN_COOKIE_NAME);
  }

  /**
   * Get current user token
   * @returns user token or null if not authenticated
   */
  static getUserToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(^| )${this.AUTH_COOKIE_NAME}=([^;]+)`));
    return match ? match[2] : null;
  }

  /**
   * Get current admin token
   * @returns admin token or null if not admin
   */
  static getAdminToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(^| )${this.ADMIN_COOKIE_NAME}=([^;]+)`));
    return match ? match[2] : null;
  }
} 