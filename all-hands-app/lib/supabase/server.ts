import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Check for required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL environment variable');
  throw new Error('Missing SUPABASE_URL');
}

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

// Create a single supabase client for interacting with your database
export const createServerSupabaseClient = () => {
  
  return createClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}; 