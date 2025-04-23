'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SessionList from '@/components/sessions-page/session-list';
import AskAnythingForm from '@/components/ask-anything/ask-form';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'qa-sessions';
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`?tab=${value}`, { scroll: false });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm max-w-5xl mx-auto w-full">
      <div className="px-8 pt-8 pb-4 border-b">
        <Tabs 
          defaultValue={activeTab} 
          className="w-full" 
          onValueChange={handleTabChange}
        >
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="qa-sessions">Q&A Sessions</TabsTrigger>
              <TabsTrigger value="ask-anything">Ask Anything</TabsTrigger>
            </TabsList>
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin
              </Button>
            </Link>
          </div>
          
          <div className="pt-8 px-8 pb-8">
            <TabsContent value="qa-sessions" className="mt-0">
              <SessionList />
            </TabsContent>
            
            <TabsContent value="ask-anything" className="mt-0">
              <AskAnythingForm />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}