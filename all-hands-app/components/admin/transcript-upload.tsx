'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SessionService } from '@/lib/services/session.service';
import { Session } from '@/types/supabase';

export default function TranscriptUpload() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [transcriptContent, setTranscriptContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSessions() {
      try {
        const sessions = await SessionService.getAllSessions();
        setSessions(sessions);
        
        // Auto-select the most recent session
        if (sessions.length > 0) {
          setSelectedSession(sessions[0].id);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        toast({
          variant: 'destructive',
          title: 'Error loading sessions',
          description: 'Failed to load sessions.',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [toast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {};

  const handleSubmit = async (e: React.FormEvent) => {}

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Transcript</CardTitle>
        <CardDescription>
          Upload the transcript from your all-hands meeting to process answers to submitted questions.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium mb-2">
              Select Session
            </label>
            <Select
              value={selectedSession || ''}
              onValueChange={(value) => setSelectedSession(value)}
              disabled={sessions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.month_year}
                    {session.is_active && " (Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload PDF or Text File
            </label>
            <Input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Transcript Content
            </label>
            <Textarea
              placeholder="Paste or type transcript content here"
              value={transcriptContent}
              onChange={(e) => setTranscriptContent(e.target.value)}
              className="min-h-[300px]"
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isProcessing || !selectedSession}>
            {isProcessing ? 'Processing...' : 'Upload & Process'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}