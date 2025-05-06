import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/admin-dashboard';
import { JwtService } from '@/lib/services/jwt.service';

const SESSION_COOKIE_NAME = 'admin_session';

// Add dynamic configuration
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!token || !JwtService.verifyToken(token)) {
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