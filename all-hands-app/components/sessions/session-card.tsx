'use client';

import { useState } from 'react';
import { Session, Question, supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import QuestionForm from './question-form';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface SessionCardProps {
  session: Session;
}

export default function SessionCard({ session }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isExpanded) {
      fetchQuestions();
    }
  }, [isExpanded, session.id]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', session.id)
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

  const handleQuestionSubmitted = (newQuestion: Question) => {
    setQuestions([newQuestion, ...questions]);
    toast({
      title: 'Question submitted',
      description: 'Your question has been anonymously added.',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{session.month_year}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          {session.is_active && (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <span className="text-sm font-medium mr-2">Open for questions</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
              </div>
              <QuestionForm sessionId={session.id} onQuestionSubmitted={handleQuestionSubmitted} />
            </div>
          )}

          <div className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">Questions ({questions.length})</h3>
            
            {loading ? (
              <p className="text-sm text-gray-500">Loading questions...</p>
            ) : questions.length > 0 ? (
              <ul className="space-y-3">
                {questions.map((question) => (
                  <li key={question.id} className="bg-gray-50 p-3 rounded">
                    <p className="font-medium mb-1">{question.question_text}</p>
                    <p className="text-sm text-gray-600">Assigned to: {question.assigned_to}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No questions submitted yet.</p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}