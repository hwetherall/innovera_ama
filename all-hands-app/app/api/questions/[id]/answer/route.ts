import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/questions/[questionId]/answer - Get the answer for a question
export async function GET(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const questionId = params.questionId;
    
    // Validate question exists
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, is_answered')
      .eq('id', questionId)
      .single();
    
    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    if (!question.is_answered) {
      return NextResponse.json(
        { error: 'Question does not have an answer yet' },
        { status: 404 }
      );
    }
    
    // Fetch answer
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)
      .single();
    
    if (answerError) {
      console.error('Error fetching answer:', answerError);
      return NextResponse.json(
        { error: 'Failed to fetch answer' },
        { status: 500 }
      );
    }
    
    if (!answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error in answer GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/questions/[questionId]/answer - Submit answer to a question
export async function POST(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const questionId = params.questionId;
    const body = await request.json();
    
    // Validate question exists
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, is_answered, session_id')
      .eq('id', questionId)
      .single();
    
    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    if (question.is_answered) {
      return NextResponse.json(
        { error: 'Question already has an answer' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.answer_text) {
      return NextResponse.json(
        { error: 'Answer text is required' },
        { status: 400 }
      );
    }
    
    // Create answer and update question
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .insert({
        question_id: questionId,
        answer_text: body.answer_text,
        confidence_score: body.confidence_score || null,
        source_session_id: question.session_id,
      })
      .select()
      .single();
    
    if (answerError) {
      console.error('Error creating answer:', answerError);
      return NextResponse.json(
        { error: 'Failed to create answer' },
        { status: 500 }
      );
    }
    
    // Update question as answered
    const { error: updateError } = await supabase
      .from('questions')
      .update({ is_answered: true })
      .eq('id', questionId);
    
    if (updateError) {
      console.error('Error updating question:', updateError);
      return NextResponse.json(
        { error: 'Failed to update question status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ answer }, { status: 201 });
  } catch (error) {
    console.error('Error in answer POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[questionId]/answer - Delete the answer for a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const questionId = params.questionId;
    
    // Validate question exists
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, is_answered')
      .eq('id', questionId)
      .single();
    
    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    if (!question.is_answered) {
      return NextResponse.json(
        { error: 'Question does not have an answer to delete' },
        { status: 400 }
      );
    }
    
    // Get answer ID
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .select('id')
      .eq('question_id', questionId)
      .single();
    
    if (answerError || !answer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }
    
    // Delete answer
    const { error: deleteError } = await supabase
      .from('answers')
      .delete()
      .eq('id', answer.id);
    
    if (deleteError) {
      console.error('Error deleting answer:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete answer' },
        { status: 500 }
      );
    }
    
    // Update question as not answered
    const { error: updateError } = await supabase
      .from('questions')
      .update({ is_answered: false })
      .eq('id', questionId);
    
    if (updateError) {
      console.error('Error updating question:', updateError);
      return NextResponse.json(
        { error: 'Failed to update question status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in answer DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[questionId]/answer - Update answer of the question
export async function PUT(
  request: NextRequest,
  { params }: { params: { questionId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const questionId = params.questionId;
    const body = await request.json();
    
    // Validate question exists and has an answer
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, is_answered')
      .eq('id', questionId)
      .single();
    
    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    if (!question.is_answered) {
      return NextResponse.json(
        { error: 'Question does not have an answer yet' },
        { status: 400 }
      );
    }
    
    // Get existing answer
    const { data: existingAnswer, error: answerError } = await supabase
      .from('answers')
      .select('id')
      .eq('question_id', questionId)
      .single();
    
    if (answerError || !existingAnswer) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      );
    }
    
    // Update answer
    const { data: answer, error: updateError } = await supabase
      .from('answers')
      .update({
        answer_text: body.answer_text,
        answered_by: body.answered_by,
        confidence_score: body.confidence_score,
      })
      .eq('id', existingAnswer.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating answer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update answer' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error in answer PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 