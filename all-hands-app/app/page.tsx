'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SessionList from '@/components/sessions/session-list';
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
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="flex justify-between items-center p-4 border-b">
        <Tabs 
          defaultValue={activeTab} 
          className="w-full" 
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="qa-sessions">Q&A Sessions</TabsTrigger>
            <TabsTrigger value="ask-anything">Ask Anything</TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="qa-sessions" className="mt-0">
              <SessionList />
            </TabsContent>
            
            <TabsContent value="ask-anything" className="mt-0">
              <AskAnythingForm />
            </TabsContent>
          </div>
        </Tabs>
        
        <Link href="/admin" className="ml-4">
          <Button variant="outline" size="sm">
            Admin
          </Button>
        </Link>
      </div>
    </div>
  );
}