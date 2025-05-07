import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/admin-dashboard';
import { JwtService } from '@/lib/services/jwt.service';
import Header from '@/components/layout/header';

const ADMIN_COOKIE_NAME = 'admin_token';

// Add dynamic configuration
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    console.log('No admin token found, redirecting to login');
    redirect('/admin/login');
  }

  try {
    const isAdmin = await JwtService.isAdminToken(token);
    if (!isAdmin) {
      console.log('Invalid admin token, redirecting to login');
      redirect('/admin/login');
    }
  } catch (error) {
    console.error('Error verifying admin token:', error);
    redirect('/admin/login');
  }

  return (
    <>
      <Header />
      <AdminDashboard />
    </>
  );
}