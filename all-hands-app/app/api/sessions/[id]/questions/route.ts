import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/sessions/[id]/questions - List all questions for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // Check if session exists
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get questions for the session
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in GET /api/sessions/[id]/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[id]/questions - Submit new question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();
        
    // Validate required fields
    if (!body.question_text) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }

    if (!body.assigned_to) {
      return NextResponse.json(
        { error: 'Question assignment is required' },
        { status: 400 }
      );
    }
    
    // Validate session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, is_active')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!session.is_active) {
      return NextResponse.json(
        { error: 'Cannot add questions to an inactive session' },
        { status: 400 }
      );
    }

    // Create the question
    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        session_id: id,
        question_text: body.question_text,
        assigned_to: body.assigned_to,
        is_answered: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating question:', error);
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      );
    }

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/sessions/[id]/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 