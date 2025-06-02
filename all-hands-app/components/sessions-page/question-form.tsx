'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { SessionService } from '../../lib/services/session.service';
import { Question, QuestionInsert } from '@/types/supabase';

const executives = [
  'Pedram',
  'Jeff',
  'Daniel',
  'Spencer',
  'Marilynn',
  'Saeid',
  'Other'
];

const questionSchema = z.object({
  question: z.string().min(5, { message: 'Question must be at least 5 characters' }),
  assignedTo: z.string().min(1, { message: 'Please select who this question is for' }),
});

interface QuestionFormProps {
  sessionId: string;
  onQuestionSubmitted: (question: Question) => void;
}

export default function QuestionForm({ sessionId, onQuestionSubmitted }: QuestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: '',
      assignedTo: '',
    },
  });

  async function onSubmit(values: z.infer<typeof questionSchema>) {
    try {
      setIsSubmitting(true);
      
      const questionData: QuestionInsert = {
            question_text: values.question,
            assigned_to: values.assignedTo,
      };
      
      const newQuestion = await SessionService.createQuestion(sessionId, questionData);
      onQuestionSubmitted(newQuestion);
      form.reset();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit your question. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <Textarea 
                  placeholder="What would you like to ask?" 
                  className="min-h-[160px] resize-none text-base focus-visible:ring-0 focus-visible:ring-offset-0 border-none bg-muted" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-base">Assign to</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {executives.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full h-11 text-base" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Question'}
        </Button>
      </form>
    </Form>
  );
}