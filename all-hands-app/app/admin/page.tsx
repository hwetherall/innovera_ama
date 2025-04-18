'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPasswordForm from '@/components/admin/password-form';
import QuestionManager from '@/components/admin/question-manager';
import TranscriptUpload from '@/components/admin/transcript-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AdminPasswordForm onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Admin Dashboard</h2>
        <Link href="/">
          <Button variant="outline" size="sm">
            Back to Main Page
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="questions" className="p-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="questions">Manage Questions</TabsTrigger>
          <TabsTrigger value="transcripts">Upload Transcripts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions">
          <QuestionManager />
        </TabsContent>
        
        <TabsContent value="transcripts">
          <TranscriptUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}