import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/sessions/[id]/export - Export session data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get questions for this session
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', id);

    if (questionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // Get answers for these questions
    const questionIds = questions?.map(q => q.id) || [];
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .in('question_id', questionIds);

    if (answersError) {
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }

    // Combine the data
    const exportData = {
      session,
      questions: questions?.map(question => ({
        ...question,
        answers: answers?.filter(answer => answer.question_id === question.id)
      }))
    };

    // Return as JSON
    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="session-${id}-export.json"`
      }
    });
  } catch (error) {
    console.error('Error in session export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
