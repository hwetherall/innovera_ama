import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'All Hands Q&A App',
  description: 'Anonymous Q&A and knowledge base for company all-hands meetings',
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
            <header className="py-6">
              <div className="flex items-center gap-4">
                <Image
                  src="/innovera-logo.png"
                  alt="Innovera"
                  width={165}
                  height={38}
                  priority
                />
                <div className="w-px h-8 bg-neutral-200" />
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                  All Hands Q&A
                </h1>
              </div>
            </header>
            {children}
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}