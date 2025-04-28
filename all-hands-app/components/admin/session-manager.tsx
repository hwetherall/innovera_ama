'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SessionService } from '@/lib/services/session.service';
import { QuestionService } from '@/lib/services/question.service';
import { Session, Question } from '@/types/supabase';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const sessionSchema = z.object({
  month_year: z.string().min(1, { message: 'Month and year are required' }),
  status: z.literal('active'),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

export default function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteSessionDialog, setShowDeleteSessionDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { toast } = useToast();

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      month_year: '',
      status: 'active',
    },
  });

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

  useEffect(() => {
    if (selectedSession) {
      fetchQuestions(selectedSession);
    }
  }, [selectedSession]);

  const fetchQuestions = async (sessionId: string) => {
    try {
      setLoading(true);
      const questions = await SessionService.getSessionQuestions(sessionId);
      setQuestions(questions);
    } catch (err) {
      console.error('Error fetching questions:', err);
      toast({
        variant: 'destructive',
        title: 'Error loading questions',
        description: 'Failed to load questions for this session.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await QuestionService.deleteQuestion(questionId);
      
      // Remove the question from the state
      setQuestions(questions.filter(q => q.id !== questionId));
      setQuestionToDelete(null);
      
      toast({
        title: 'Question deleted',
        description: 'The question has been removed successfully.',
      });
    } catch (err) {
      console.error('Error deleting question:', err);
      toast({
        variant: 'destructive',
        title: 'Error deleting question',
        description: 'Failed to delete the question.',
      });
    }
  };

  const handleCreateClick = () => {
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    form.reset({
      month_year: monthYear,
      status: 'active',
    });
    
    setShowCreateDialog(true);
  };

  const onSubmit = async (values: SessionFormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const newSession = await SessionService.createSession(values);
      
      setSessions([newSession, ...sessions]);
      setSelectedSession(newSession.id);
      setShowCreateDialog(false);
      form.reset();
      
      toast({
        title: 'Session created',
        description: `Created new session for ${values.month_year}.`,
      });
    } catch (err) {
      console.error('Error creating session:', err);
      toast({
        variant: 'destructive',
        title: 'Error creating session',
        description: 'Failed to create a new session.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    
    try {
      await SessionService.deleteSession(selectedSession);
      
      // Remove the session from the list
      setSessions(sessions.filter(s => s.id !== selectedSession));
      // Clear the selected session
      setSelectedSession(null);
      // Clear the questions
      setQuestions([]);
      // Close the dialog
      setShowDeleteSessionDialog(false);
      
      toast({
        title: 'Session deleted',
        description: 'The session, all its questions and answers have been removed.',
      });
    } catch (err) {
      console.error('Error deleting session:', err);
      toast({
        variant: 'destructive',
        title: 'Error deleting session',
        description: 'Failed to delete the session.',
      });
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;
    
    try {
      setIsClosing(true);
      const currentSession = sessions.find(s => s.id === selectedSession);
      
      if (currentSession) {
        const updatedSession = await SessionService.updateSession(selectedSession, {
          ...currentSession,
          status: 'waiting_transcript'
        });
        
        // Update the sessions list
        setSessions(sessions.map(s => 
          s.id === selectedSession ? updatedSession : s
        ));
        
        toast({
          title: 'Session closed',
          description: `${currentSession.month_year} has been closed.`,
        });
      }
    } catch (err) {
      console.error('Error closing session:', err);
      toast({
        variant: 'destructive',
        title: 'Error closing session',
        description: 'Failed to close the session.',
      });
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Sessions</h3>
        <Button onClick={handleCreateClick}>
          Create New Session
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-full max-w-xs">
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
                  {session.status === 'active' && " (Active)"}
                  {session.status === 'waiting_transcript' && " (Waiting on Transcript)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedSession && sessions.find(s => s.id === selectedSession)?.status === 'active' && (
          <Button
            variant="outline"
            onClick={handleCloseSession}
            disabled={isClosing || questions.length === 0}
            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
            title={questions.length === 0 ? "Cannot close a session without questions" : ""}
          >
            {isClosing ? 'Closing...' : 'Close Session'}
          </Button>
        )}
      </div>
      
      {loading ? (
        <p>Loading questions...</p>
      ) : questions.length === 0 ? (
        <p>No questions found for this session.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id} className="shadow-[0_2px_4px_0_rgba(0,0,0,0.05)]">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{question.question_text}</p>
                    <p className="text-sm text-gray-500 mt-1">Assigned to: {question.assigned_to}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setQuestionToDelete(question)}
                    className="bg-[#D11A2A] hover:bg-[#B01523] text-white"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedSession && (
        <div className="pt-8 border-t">
          <Button
            variant="outline"
            className="bg-[#D11A2A] hover:bg-[#B01523] text-white border-0"
            onClick={() => setShowDeleteSessionDialog(true)}
          >
            Delete Session
          </Button>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="month_year"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Month and Year</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Session Status</FormLabel>
                    <div className="w-[140px]">
                      <Input 
                        value="Active" 
                        disabled 
                        className="bg-gray-100"
                      />
                      <input type="hidden" {...field} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Session'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={questionToDelete !== null} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this question?</p>
            <p className="mt-2 text-lg font-semibold text-black-500">{questionToDelete?.question_text}</p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuestionToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => questionToDelete && handleDeleteQuestion(questionToDelete.id)}
              className="bg-[#D11A2A] hover:bg-[#B01523] text-white"
            >
              Delete Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteSessionDialog} onOpenChange={setShowDeleteSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this session?</p>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete the session, all its questions and answers. This action cannot be undone.
            </p>
            {questions.length > 0 && (
              <p className="mt-4 text-sm font-medium text-[#D11A2A]">
                Warning: This session has {questions.length} question{questions.length === 1 ? '' : 's'} that will also be deleted.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteSessionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#D11A2A] hover:bg-[#B01523] text-white"
              onClick={handleDeleteSession}
            >
              Delete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}