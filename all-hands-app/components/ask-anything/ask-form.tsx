'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AnswerDisplay from './answer-display';

export default function AskAnythingForm() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
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
      
      // This will be replaced with the actual API call
      const response = await fetch('/api/ask-anything', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get answer');
      }
      
      const data = await response.json();
      setAnswer(data.answer);
      setSources(data.sources || []);
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
        <h2 className="text-xl font-semibold mb-2">Ask Anything</h2>
        <p className="text-sm text-gray-600 mb-4">
          Ask any question about the company and get answers based on previous all-hands meetings.
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
        <AnswerDisplay answer={answer} sources={sources} />
      )}
    </div>
  );
}