import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Verify admin password
    const { adminPassword } = await request.json();
    const configuredPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    
    const isValidPassword = configuredPassword 
      ? adminPassword === configuredPassword 
      : adminPassword === 'admin123';
    
    if (!isValidPassword) {
      console.error('Admin authentication failed: Invalid password');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Supabase client with SERVICE ROLE key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables:');
      console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
      
      return NextResponse.json(
        { error: 'Server configuration error - missing database credentials' },
        { status: 500 }
      );
    }
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current month and year
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    // 1. Set all existing sessions to inactive
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('is_active', true);
      
    if (updateError) {
      console.error('Error deactivating existing sessions:', updateError);
      return NextResponse.json(
        { error: 'Failed to deactivate existing sessions: ' + updateError.message },
        { status: 500 }
      );
    }
    
    // 2. Create a new active session
    const { data: newSession, error: createError } = await supabase
      .from('sessions')
      .insert([
        { month_year: monthYear, is_active: true }
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

    return NextResponse.json({
      message: `Successfully created new session for ${monthYear}`,
      session: newSession
    });
  } catch (error) {
    console.error('Unexpected error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 