import AdminPasswordForm from '@/components/admin/password-form';
import Header from '@/components/layout/header';

export default function AdminLoginPage() {
  return (
    <>
      <Header centered />
      <div className="max-w-5xl mx-auto w-full p-8">
        <AdminPasswordForm />
      </div>
    </>
  );
} 