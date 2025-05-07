import AdminPasswordForm from '@/components/admin/password-form';
import Header from '@/components/layout/header';

export default function AdminLoginPage() {
  return (
    <>
      <Header centered />
      <div className="flex items-center justify-center">
          <AdminPasswordForm />
      </div>
    </>
  );
} 