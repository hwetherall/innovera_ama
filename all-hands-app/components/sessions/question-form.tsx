'use client';

import { useState } from 'react';
import { supabase, Question } from '@/lib/supabase/client';
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

const executives = [
  'Pedram',
  'Jeff',
  'Daniel',
  'Spencer',
  'Marilynn',
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
      
      const { data, error } = await supabase
        .from('questions')
        .insert([
          {
            session_id: sessionId,
            question_text: values.question,
            assigned_to: values.assignedTo,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      onQuestionSubmitted(data);
      form.reset();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to submit question',
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ask an anonymous question</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What would you like to ask?" 
                  className="min-h-[100px]" 
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
            <FormItem>
              <FormLabel>Assign to</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
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
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Question'}
        </Button>
      </form>
    </Form>
  );
}