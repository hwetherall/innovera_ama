'use client';

import { useState, useEffect } from 'react';
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

  // Load authentication state from localStorage on initial render
  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuthenticated');
    if (storedAuth === 'true') {
      console.log('Restoring authenticated state from localStorage');
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthenticated = () => {
    console.log('Authentication successful in AdminPage');
    // Store authentication state in localStorage
    localStorage.setItem('adminAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  // Debug authentication state changes
  useEffect(() => {
    console.log('AdminPage rendered, isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  // Prevent navigation when using browser back/forward buttons
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isAuthenticated) {
        // This prevents normal navigation away from the admin page
        // when authenticated, asking for confirmation
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Only add the event listener if authenticated
    if (isAuthenticated) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AdminPasswordForm onAuthenticated={handleAuthenticated} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Admin Dashboard</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
          <Link href="/" onClick={(e) => {
            if (isAuthenticated) {
              const confirmLeave = window.confirm("Are you sure you want to leave the admin dashboard?");
              if (!confirmLeave) {
                e.preventDefault();
              }
            }
          }}>
            <Button variant="outline" size="sm">
              Back to Main Page
            </Button>
          </Link>
        </div>
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