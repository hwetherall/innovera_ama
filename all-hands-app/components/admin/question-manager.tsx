'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase, Session, Question } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function QuestionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
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

  useEffect(() => {
    if (selectedSession) {
      fetchQuestions(selectedSession);
    }
  }, [selectedSession]);

  const fetchQuestions = async (sessionId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setQuestions(data || []);
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
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      
      // Remove the question from the state
      setQuestions(questions.filter(q => q.id !== questionId));
      
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

  const handleCreateNewSession = async () => {
    // Get the current date
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    try {
      // First, set all sessions to inactive
      await supabase
        .from('sessions')
        .update({ is_active: false })
        .eq('is_active', true);
      
      // Create a new active session
      const { data, error } = await supabase
        .from('sessions')
        .insert([
          { month_year: monthYear, is_active: true }
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Add the new session to the list
      setSessions([data, ...sessions]);
      setSelectedSession(data.id);
      
      toast({
        title: 'Session created',
        description: `Created new session for ${monthYear}.`,
      });
    } catch (err) {
      console.error('Error creating session:', err);
      toast({
        variant: 'destructive',
        title: 'Error creating session',
        description: 'Failed to create a new session.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Questions</h3>
        <Button onClick={handleCreateNewSession}>
          Create New Session
        </Button>
      </div>
      
      <div className="mb-6 w-full max-w-xs">
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
      
      {loading ? (
        <p>Loading questions...</p>
      ) : questions.length === 0 ? (
        <p>No questions found for this session.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{question.question_text}</p>
                    <p className="text-sm text-gray-500 mt-1">Assigned to: {question.assigned_to}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}