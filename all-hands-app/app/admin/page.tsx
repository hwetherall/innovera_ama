import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/admin-dashboard';
import { hasAdminSession } from '@/lib/services/admin-session-store';

const SESSION_COOKIE_NAME = 'admin_session';

export default async function AdminPage() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionToken) {
      redirect('/admin/login');
    }

    const isAuthenticated = hasAdminSession(sessionToken);
    
    if (!isAuthenticated) {
      // If the session token exists but is not valid, redirect to login
      redirect('/admin/login');
    }

    return <AdminDashboard />;
  } catch (error) {
    // Only log actual errors, not redirects
    if (!(error instanceof Error) || !error.message.includes('NEXT_REDIRECT')) {
      console.error('Error in admin page:', error);
    }
    redirect('/admin/login');
  }
}