import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Add detailed error checking
if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  throw new Error('Missing Supabase URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  throw new Error('Missing Supabase Anon Key environment variable');
}

// Validate the URL
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error(`Invalid Supabase URL: ${supabaseUrl}`);
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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