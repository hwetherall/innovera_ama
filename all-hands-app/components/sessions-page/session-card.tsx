'use client';

import { useState } from 'react';
import { Session, Question, Answer } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import QuestionForm from './question-form';
import { useEffect } from 'react';
import { useToast } from '../../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { SessionService } from '@/lib/services/session.service';

interface SessionCardProps {
  session: Session;
}

export default function SessionCard({ session }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isExpanded) {
      fetchQuestions();
      if (session.status === 'completed') {
        fetchAnswers();
      }
    }
  }, [isExpanded, session.id, session.status]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const questions = await SessionService.getSessionQuestions(session.id);
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

  const fetchAnswers = async () => {
    try {
      const answers = await SessionService.getSessionAnswers(session.id);
      // Convert array to object with question ID as key for easier lookup
      const answersMap = answers.reduce((acc: Record<string, Answer>, answer: Answer) => {
        acc[answer.question_id] = answer;
        return acc;
      }, {});
      setAnswers(answersMap);
    } catch (err) {
      console.error('Error fetching answers:', err);
      toast({
        variant: 'destructive',
        title: 'Error loading answers',
        description: 'Failed to load answers for this session.',
      });
    }
  };

  const handleQuestionSubmitted = (newQuestion: Question) => {
    setQuestions([newQuestion, ...questions]);
    setShowQuestionForm(false);
    toast({
      title: 'Question submitted',
      description: 'Your question has been anonymously added.',
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
            <CardTitle>{session.month_year}</CardTitle>
            <div className="flex items-center gap-2">
              {session.status === 'active' && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
              )}
              {session.status === 'waiting_transcript' && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Waiting on Transcript</span>
              )}
              {session.status === 'completed' && (
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Completed</span>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="p-4">
            {session.status === 'active' && (
              <div className="mb-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowQuestionForm(true)}
                  className="w-full"
                >
                  Ask a Question
                </Button>
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
                      {session.status === 'completed' && answers[question.id] ? (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 pb-1.5">Answer:</p>
                          <p className="text-sm text-gray-600">{answers[question.id].answer_text}</p>
                          {answers[question.id].confidence_score && (
                            <p className="text-xs text-gray-500 mt-1">
                              Confidence: {Math.round(answers[question.id].confidence_score * 100)}%
                            </p>
                          )}
                        </div>
                      ) : session.status === 'waiting_transcript' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 pb-1.5">Answer:</p>
                          <p className="text-sm text-gray-500 italic">Answer will be generated upon transcript upload</p>
                        </div>
                      )}
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

      <Dialog open={showQuestionForm} onOpenChange={setShowQuestionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask an anonymous question</DialogTitle>
          </DialogHeader>
          <QuestionForm 
            sessionId={session.id} 
            onQuestionSubmitted={handleQuestionSubmitted} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}