'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase, Session } from '@/lib/supabase/client';
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
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setSessions(data || []);
        
        // Auto-select the most recent session
        if (data && data.length > 0) {
          setSelectedSession(data[0].id);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'application/pdf' && !file.type.includes('text/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or text file.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        // For text files, we can get the content directly
        if (typeof event.target.result === 'string') {
          setTranscriptContent(event.target.result);
        } 
        // For PDFs, we would need a PDF parser library
        // For now, just tell the user to copy-paste the content
        else {
          toast({
            title: 'PDF detected',
            description: 'Please copy and paste the transcript content from the PDF.',
          });
        }
      }
    };

    reader.onerror = () => {
      toast({
        title: 'Error reading file',
        description: 'Failed to read the uploaded file.',
        variant: 'destructive',
      });
    };

    // Read text files as text, others as binary
    if (file.type.includes('text/')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSession) {
      toast({
        title: 'No session selected',
        description: 'Please select a session for this transcript.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!transcriptContent.trim()) {
      toast({
        title: 'Empty transcript',
        description: 'Please enter or upload transcript content.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // First, store the transcript
      const { data: transcriptData, error: transcriptError } = await supabase
        .from('transcripts')
        .insert([
          {
            session_id: selectedSession,
            content: transcriptContent,
          },
        ])
        .select()
        .single();

      if (transcriptError) throw transcriptError;
      
      // Now process the transcript to match questions with answers
      // In a real implementation, this would call the OpenRouter API
      // For now, we'll just simulate the process
      
      // Get questions for this session
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', selectedSession)
        .eq('is_answered', false);
        
      if (questionsError) throw questionsError;
      
      // For demo purposes, we'll just mark questions as answered
      if (questions && questions.length > 0) {
        const { error: updateError } = await supabase
          .from('questions')
          .update({ is_answered: true })
          .in('id', questions.map(q => q.id));
          
        if (updateError) throw updateError;
        
        toast({
          title: 'Questions processed',
          description: `Processed answers for ${questions.length} questions.`,
        });
      }
      
      toast({
        title: 'Transcript uploaded',
        description: 'The transcript has been successfully stored and processed.',
      });
      
      // Clear the form
      setTranscriptContent('');
      
    } catch (err) {
      console.error('Error uploading transcript:', err);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload and process the transcript.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <p>Loading sessions...</p>;
  }

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

// Custom Input component since we haven't created it yet with shadcn
function Input({ 
  type, 
  accept, 
  onChange 
}: { 
  type: string; 
  accept: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void 
}) {
  return (
    <input
      type={type}
      accept={accept}
      onChange={onChange}
      className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 focus:outline-none"
    />
  );
}