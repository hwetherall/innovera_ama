import LoginForm from '@/components/user-auth/login-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <>
      <div className="py-6 flex justify-center">
        <div className="pl-1 pr-1">
          <Image
            src="/innovera-logo.png"
            alt="Innovera"
            width={165}
            height={38}
            priority
          />
        </div>
      </div>
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Sign in to the All Hands Q&A</CardTitle>
            <CardDescription className="text-center">
              Enter the password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
} 