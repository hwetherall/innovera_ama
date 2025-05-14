'use client';

import { useState, useEffect, useRef } from 'react';
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
import { TranscriptService } from '@/lib/services/transcript.service';
import { Session } from '@/types/supabase';

export default function TranscriptUpload() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | undefined>(undefined);
  const [transcriptContent, setTranscriptContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const sessions = await SessionService.getAllSessions();
        setSessions(sessions);
        
        // Auto-select the first valid session that is waiting for transcript
        const firstValidSession = sessions.find(session => session.status === 'waiting_transcript');
        if (firstValidSession) {
          setSelectedSession(firstValidSession.id);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        toast({
          variant: 'destructive',
          title: 'Error loading sessions',
          description: 'Failed to load sessions.',
        });
      }
    }

    fetchSessions();
  }, [toast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Handle text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setTranscriptContent(content.trim());
      };
      reader.onerror = () => {
        toast({
          title: "File Reading Error",
          description: "Failed to read the text file.",
          variant: "destructive",
        });
        clearFileInput();
      };
      reader.readAsText(file);
      return;
    }

    // Handle vtt files
    if (fileType === 'text/vtt' || fileName.endsWith('.vtt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        // Remove VTT timestamps and sequence numbers
        let cleanedContent = content.replace(/^WEBVTT\s*\n/, '');
        cleanedContent = cleanedContent.replace(/^\d+\s*\n\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\s*\n/gm, '');
        setTranscriptContent(cleanedContent.trim());
      };
      reader.onerror = () => {
        toast({
          title: "File Reading Error",
          description: "Failed to read the text file.",
          variant: "destructive", 
        });
        clearFileInput();
      };
      reader.readAsText(file);
      return;
    }

    // Handle PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      setIsProcessing(true);
      
      // Use the TranscriptService to extract text from the PDF
      TranscriptService.extractTextFromPDF(file)
        .then((result) => {
          setTranscriptContent(result.text.trim());
          
          toast({
            title: "PDF Processed",
            description: `Successfully extracted text from ${result.pages} pages of the PDF.`,
            variant: "default",
          });
        })
        .catch((error) => {
          console.error('Error processing PDF:', error);
          toast({
            title: "PDF Processing Error",
            description: error.message || "Failed to extract text from the PDF file.",
            variant: "destructive",
          });
          clearFileInput();
        })
        .finally(() => {
          setIsProcessing(false);
        });
      
      return;
    }
  };

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsProcessing(true);
    
    try {

      if (selectedSession) {
        await TranscriptService.createTranscriptAndAnswerSession({
          content: transcriptContent,
          session_id: selectedSession
        });

      } else {
        await TranscriptService.createTranscript({
          content: transcriptContent,
        });

      }

      toast({
        title: "Transcript Saved",
        description: selectedSession 
          ? "The transcript has been saved and answers were generated."
          : "The transcript has been saved without being linked to a session.",
        variant: "default",
      });
          
      // Clear the form
      setTranscriptContent('');
      clearFileInput();
      
      // Refresh the sessions list
      const updatedSessions = await SessionService.getAllSessions();
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Error saving transcript:', error);
      
      // Show the specific error message from the service
      toast({
        title: "Error Saving Transcript",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
              value={selectedSession || "no-session"}
              onValueChange={(value) => setSelectedSession(value === "no-session" ? undefined : value)}
              disabled={sessions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions
                  .filter(session => session.status === 'waiting_transcript')
                  .map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.month_year}
                      {session.status === 'waiting_transcript' && " (Waiting on Transcript)"}
                  </SelectItem>
                ))}
                <SelectItem value="no-session">
                  No session, DB storage only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload PDF, VTT or Text File
            </label>
            <Input
              type="file"
              accept=".pdf,.txt,.vtt"
              onChange={handleFileUpload}
              className="cursor-pointer"
              ref={fileInputRef}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Transcript Content
            </label>
            <Textarea
              placeholder="Upload a file to extract transcript content or type directly"
              value={transcriptContent}
              className="min-h-[300px] max-h-[500px] overflow-y-auto bg-gray-50 text-gray-700"
              onChange={(e) => setTranscriptContent(e.target.value)}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Upload & Process'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}