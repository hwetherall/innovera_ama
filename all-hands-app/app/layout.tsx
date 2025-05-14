import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Advanced Q&A App',
  description: 'Anonymous Q&A and knowledge base for company all-hands meetings and customer conversations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 scale-[0.8] origin-top">
            {children}
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}