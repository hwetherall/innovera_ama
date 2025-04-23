import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/sessions - Return all sessions
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Fetch all sessions
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ sessions: data });
  } catch (error) {
    console.error('Error in sessions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    
    // Validate required fields
    if (!body.month_year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }
    
    // Create session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        month_year: body.month_year,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select();
    
    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ session: data[0] }, { status: 201 });
  } catch (error) {
    console.error('Error in sessions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 