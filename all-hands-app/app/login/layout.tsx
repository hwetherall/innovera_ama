import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
} 