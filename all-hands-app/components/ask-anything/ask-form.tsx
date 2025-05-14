'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AnswerDisplay from './answer-display';
import { AIService } from '@/lib/services/ai.service';
import { AskAnythingResponse } from '@/types/ai-generation';
import { cn } from '@/lib/utils';

export default function AskAnythingForm() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomerMode, setIsCustomerMode] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast({
        title: 'Empty question',
        description: 'Please enter a question to ask.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setAnswer(null);
      setSources([]);
      setConfidence(null);
      // API call
      const response: AskAnythingResponse = isCustomerMode 
        ? await AIService.askAnythingConversations(question)
        : await AIService.askAnythingAllHands(question);
      setAnswer(response.answer);
      setSources(response.sources);
      setConfidence(response.confidence);
    } catch (error) {
      console.error('Error asking question:', error);
      toast({
        title: 'Error',
        description: 'Failed to get an answer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-xl font-semibold">Ask Anything</h2>
          <div className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-100 p-2 text-neutral-500">
            <button
              onClick={() => setIsCustomerMode(false)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                !isCustomerMode 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-neutral-100"
              )}
            >
              All Hands
            </button>
            <button
              onClick={() => setIsCustomerMode(true)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isCustomerMode 
                  ? "bg-purple-100 text-purple-700" 
                  : "bg-neutral-100"
              )}
            >
              Customer Conversations
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {isCustomerMode 
            ? "Ask any question about our client interactions and get answers based on the logged conversations of all clients."
            : "Ask any question about the company and get answers based on previous all-hands meetings."}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to know?"
            className="min-h-[100px]"
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Searching...' : 'Ask Question'}
          </Button>
        </form>
      </div>
      
      {answer && (
        <AnswerDisplay answer={answer} sources={sources} confidence={confidence} />
      )}
    </div>
  );
}