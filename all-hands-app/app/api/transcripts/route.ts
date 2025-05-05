import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/transcripts - List all transcripts or a single transcript
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    
    // Optional filters
    const sessionId = searchParams.get('session_id');
    
    // Build query
    let query = supabase
      .from('transcripts')
      .select('*');
    
    // Apply filters if provided
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    
    // Execute query
    const { data, error } = await query.order('uploaded_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transcripts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transcripts' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET transcripts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/transcripts - Create a new transcript
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    
    // Validate required fields   
    if (!body.content) {
      return NextResponse.json(
        { error: 'Transcript content is required' },
        { status: 400 }
      );
    }

    // Create transcript
    const { data, error } = await supabase
      .from('transcripts')
      .insert({
        session_id: body.session_id || null,
        content: body.content,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transcript:', error);
      
      // Check for foreign key violation
      if (error.code === '23503') { // PostgreSQL foreign key violation code
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create transcript' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ transcript: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST transcripts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 