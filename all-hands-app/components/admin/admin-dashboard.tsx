'use client';

import SessionManager from '@/components/admin/session-manager';
import TranscriptUpload from '@/components/admin/transcript-upload';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AuthService } from '@/lib/services/auth.service';
import { useToast } from '@/components/ui/use-toast';
import CreateConversation from './create-conversation';
import ConversationManager from './conversation-manager';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState('allhands');
  const [customerTab, setCustomerTab] = useState('manage');

  const handleLogout = async () => {
    try {
      await AuthService.logout('admin');
      window.location.href = '/';
    } catch {
      toast({
        title: 'Logout failed',
        description: 'There was an error logging out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Admin Dashboard</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout Admin
          </Button>
          <Link href="/" onClick={(e) => {
            const confirmLeave = window.confirm("Are you sure you want to leave the admin dashboard?");
            if (!confirmLeave) {
              e.preventDefault();
            }
          }}>
            <Button variant="outline" size="sm">
              Back to Main Page
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="p-4">
        <div className="flex justify-center w-full mb-8">
          <TabsList className="flex w-full gap-4">
            <TabsTrigger value="allhands" className="flex-1">All Hands Q&A</TabsTrigger>
            <TabsTrigger value="customer" className="flex-1">Customer Conversations</TabsTrigger>
          </TabsList>
        </div>

        {/* All Hands Q&A Tab */}
        <TabsContent value="allhands">
          <Tabs defaultValue="questions" className="p-4">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="questions">Manage Sessions</TabsTrigger>
              <TabsTrigger value="transcripts">Upload Transcripts</TabsTrigger>
            </TabsList>
            <TabsContent value="questions">
              <SessionManager />
            </TabsContent>
            <TabsContent value="transcripts">
              <TranscriptUpload />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Customer Conversations Tab */}
        <TabsContent value="customer">
          <Tabs value={customerTab} onValueChange={setCustomerTab} className="p-4">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="manage">Manage Conversations</TabsTrigger>
              <TabsTrigger value="create">Create Conversation</TabsTrigger>
            </TabsList>
            <TabsContent value="manage">
              <ConversationManager />
            </TabsContent>
            <TabsContent value="create">
              <CreateConversation />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
} 