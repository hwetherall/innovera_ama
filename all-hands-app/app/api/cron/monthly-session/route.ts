import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint should be called by a cron job at the beginning of each month
export async function GET(request: NextRequest) {
  try {
    // Verify API key if provided in the request
    const apiKey = request.headers.get('x-api-key');
    const configuredApiKey = process.env.CRON_API_KEY;
    
    console.log('API Key Validation:');
    console.log('- Received key:', apiKey ? `${apiKey.substring(0, 3)}...` : 'None');
    console.log('- Configured key:', configuredApiKey ? `${configuredApiKey.substring(0, 3)}...` : 'None');
    
    if (configuredApiKey && apiKey !== configuredApiKey) {
      console.error('API Key validation failed: Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Supabase client for server-side usage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables:');
      console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
      return NextResponse.json(
        { error: 'Server configuration error - missing database credentials' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current month and year
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    console.log('Creating session for:', monthYear);

    // Check if a session for the current month already exists
    try {
      const { data: existingSession, error: checkError } = await supabase
        .from('sessions')
        .select('*')
        .eq('month_year', monthYear)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for existing session:', checkError);
        return NextResponse.json(
          { error: 'Failed to check for existing session: ' + checkError.message },
          { status: 500 }
        );
      }

      // If session already exists for this month, don't create a new one
      if (existingSession) {
        console.log('Session already exists:', existingSession);
        return NextResponse.json({
          message: `Session for ${monthYear} already exists`,
          session: existingSession
        });
      }
    } catch (err) {
      console.error('Exception when checking for existing session:', err);
      return NextResponse.json(
        { error: 'Error querying database: ' + (err instanceof Error ? err.message : String(err)) },
        { status: 500 }
      );
    }

    // 1. Set all existing sessions to inactive
    try {
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('status', 'active');
        
      if (updateError) {
        console.error('Error deactivating existing sessions:', updateError);
        return NextResponse.json(
          { error: 'Failed to deactivate existing sessions: ' + updateError.message },
          { status: 500 }
        );
      }
      console.log('Successfully deactivated existing sessions');
    } catch (err) {
      console.error('Exception when deactivating sessions:', err);
      return NextResponse.json(
        { error: 'Error updating database: ' + (err instanceof Error ? err.message : String(err)) },
        { status: 500 }
      );
    }
    
    // 2. Create a new active session for the current month
    try {
      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert([
          { month_year: monthYear, status: 'active' }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating new session:', createError);
        return NextResponse.json(
          { error: 'Failed to create new session: ' + createError.message },
          { status: 500 }
        );
      }

      console.log('Successfully created new session:', newSession);
      return NextResponse.json({
        message: `Successfully created new session for ${monthYear}`,
        session: newSession
      });
    } catch (err) {
      console.error('Exception when creating new session:', err);
      return NextResponse.json(
        { error: 'Error creating record: ' + (err instanceof Error ? err.message : String(err)) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error creating monthly session:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 