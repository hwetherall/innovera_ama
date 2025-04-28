/**
 * Service for handling admin authentication
 */
export class AdminAuthService {
  /**
   * Authenticate admin user with password
   * @param password Admin password to verify
   * @throws Error if authentication fails
   */
  static async adminLogin(password: string): Promise<void> {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Error in AdminAuthService.adminLogin:', error);
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred during login');
    }
  }

  /**
   * Log out admin user
   * @throws Error if logout fails
   */
  static async adminLogout(): Promise<void> {
    try {
      const response = await fetch('/api/admin/logout', { 
        method: 'POST' 
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Logout failed');
      }
    } catch (error) {
      console.error('Error in AdminAuthService.adminLogout:', error);
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred during logout');
    }
  }
} 