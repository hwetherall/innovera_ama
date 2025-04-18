import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, question, assignedTo } = await request.json();

    if (!sessionId || !question || !assignedTo) {
      return NextResponse.json(
        { error: 'Session ID, question, and assignedTo are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client for server-side usage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify the session exists and is active
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!sessionData.is_active) {
      return NextResponse.json(
        { error: 'This session is no longer accepting questions' },
        { status: 400 }
      );
    }

    // Insert the question
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert([
        {
          session_id: sessionId,
          question_text: question,
          assigned_to: assignedTo,
        },
      ])
      .select()
      .single();

    if (questionError) {
      console.error('Error submitting question:', questionError);
      return NextResponse.json(
        { error: 'Failed to submit question' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Question submitted successfully',
      question: questionData,
    });
  } catch (error) {
    console.error('Error in question submission:', error);
    return NextResponse.json(
      { error: 'Failed to process question submission' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client for server-side usage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch questions for the specified session
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        ai_answers (
          answer_text,
          confidence_score
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: questionsData,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}