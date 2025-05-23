'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SessionList from '@/components/sessions-page/session-list';
import AskAnythingForm from '@/components/ask-anything/ask-form';
import { AuthService } from '@/lib/services/auth.service';
import Header from '@/components/layout/header';
import ClientsList from '@/components/customer-conversations/clients-list';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'qa-sessions';
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`?tab=${value}`, { scroll: false });
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <Header />
      <div className="bg-white rounded-lg border shadow-sm max-w-6xl mx-auto w-full">
        <div className="px-8 pt-8 pb-4 border-b">
          <Tabs 
            defaultValue={activeTab} 
            className="w-full" 
            onValueChange={handleTabChange}
          >
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full max-w-xl grid-cols-3">
                <TabsTrigger value="qa-sessions">All Hands Q&A</TabsTrigger>
                <TabsTrigger value="customer-conversations">Customer Conversations</TabsTrigger>
                <TabsTrigger value="ask-anything">Ask Anything</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="pt-8 px-8 pb-8">
              <TabsContent value="qa-sessions" className="mt-0">
                <SessionList />
              </TabsContent>
              
              <TabsContent value="ask-anything" className="mt-0">
                <AskAnythingForm />
              </TabsContent>

              <TabsContent value="customer-conversations" className="mt-0">
                <ClientsList />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}