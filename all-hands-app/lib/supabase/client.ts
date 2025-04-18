import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function for server components
export async function createServerSupabaseClient() {
  'use server';
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

// Database types
export type Session = {
  id: string;
  month_year: string;
  is_active: boolean;
  created_at: string;
};

export type Question = {
  id: string;
  session_id: string;
  question_text: string;
  assigned_to: string;
  is_answered: boolean;
  created_at: string;
};

export type Transcript = {
  id: string;
  session_id: string;
  content: string;
  uploaded_at: string;
};

export type AIAnswer = {
  id: string;
  question_id: string;
  answer_text: string;
  source_sessions: string[];
  confidence_score: number;
  created_at: string;
};

export type QuestionWithAnswer = Question & {
  month_year: string;
  answer_text: string | null;
  confidence_score: number | null;
};