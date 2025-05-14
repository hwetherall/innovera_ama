'use client';

import { useState } from 'react';
import { SessionWithDetails, Question, Answer, Session } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import QuestionForm from './question-form';
import { useToast } from '../../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tag } from '@/components/ui/tag';

interface SessionCardProps {
  session: SessionWithDetails;
}

export default function SessionCard({ session: sessionWithDetails }: SessionCardProps) {
  // Break down the sessionWithDetails into separate state objects
  const { questions: questionsAndAnswers, ...sessionRest } = sessionWithDetails;
  const [session] = useState<Session>(sessionRest);

  // Helper to extract questions and answers arrays
  function extractQuestionsAndAnswers() {
    const questions: Question[] = [];
    const answers: Answer[] = [];
    
    for (const q of questionsAndAnswers) {
      const { answer, ...question } = q;
      
      questions.push(question as Question);
      if (session.status === 'completed' && answer) {
        answers.push(answer);
      }
    }
    return { questions, answers };
  }

  const { questions: initialQuestions, answers: initialAnswers } = extractQuestionsAndAnswers();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [answers] = useState<Answer[]>(initialAnswers);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const { toast } = useToast();

  // When a new question is submitted, add it to the questions state
  const handleQuestionSubmitted = (newQuestion: Question) => {
    setQuestions(prev => [...prev, newQuestion]);
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
                <Tag name="Active" color="green" />
              )}
              {session.status === 'waiting_transcript' && (
                <Tag name="Waiting on Transcript" color="yellow" />
              )}
              {session.status === 'completed' && (
                <Tag name="Completed" color="gray" />
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
              {questions.length > 0 ? (
                <ul className="space-y-3">
                  {questions.map((question) => {
                    const answer = answers.find(a => a.question_id === question.id);
                    return (
                      <li key={question.id} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium mb-1">{question.question_text}</p>
                        <p className="text-sm text-gray-600">Assigned to: {question.assigned_to}</p>
                        {session.status === 'completed' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 pb-1.5">Answer:</p>
                            {answer && (
                              <div key={answer.id}>
                                <p className="text-sm text-gray-600">{answer.answer_text}</p>
                                {answer.confidence_score && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Confidence: {Math.round(answer.confidence_score * 100)}%
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {session.status === 'waiting_transcript' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 pb-1.5">Answer:</p>
                            <p className="text-sm text-gray-500 italic">Answer will be generated upon transcript upload</p>
                          </div>
                        )}
                      </li>
                    );
                  })}
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