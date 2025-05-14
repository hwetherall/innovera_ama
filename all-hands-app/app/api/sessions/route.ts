import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Session, Question, Answer, SessionWithDetails } from '@/types/supabase';

// GET /api/sessions - Return all sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const withDetails = searchParams.get('withDetails') === 'true';
    
    // Fetch all sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    if (!withDetails) {
      return NextResponse.json({ sessions });
    }

    // Fetch all questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*');
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // Fetch all answers
    const { data: answers, error: answersError } = await supabase
      .from('ai_answers')
      .select('*');
    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }

    // Build sessions with questions and answers (answer only if session is completed)
    const sessionsWithDetails: SessionWithDetails[] = (sessions as Session[]).map((session) => {
      const sessionQuestions = (questions as Question[]).filter(q => q.session_id === session.id);

      let questionsWithAnswer: (Question & { answer?: Answer })[] = sessionQuestions;
      
      if (session.status === 'completed') {
        questionsWithAnswer = sessionQuestions.map(q => ({
          ...q,
          answer: (answers as Answer[]).find(a => a.question_id === q.id)
        }));
      }
      return {
        ...session,
        questions: questionsWithAnswer
      };
    });

    return NextResponse.json({ sessions: sessionsWithDetails });
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
        status: body.status || 'active',
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