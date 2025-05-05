import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/questions/[id]/answer - Get the answer for a question
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = createServerSupabaseClient();
    const questionId = params.id;
    
    // Validate question exists and is answered	
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

// POST /api/questions/[id]/answer - Submit answer to a question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Starting POST request to /api/questions/[id]/answer');
    
    const supabase = createServerSupabaseClient();
    console.log('Supabase client created');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const resolvedParams = await params;
    const questionId = resolvedParams.id;
    console.log('Question ID:', questionId);
    
    // Validate question exists and is not answered
    console.log('Fetching question details...');
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, is_answered, session_id')
      .eq('id', questionId)
      .single();
    
    if (questionError) {
      console.error('Error fetching question:', questionError);
      return NextResponse.json(
        { error: 'Question not found', details: questionError },
        { status: 404 }
      );
    }
    
    if (!question) {
      console.error('Question not found for ID:', questionId);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    if (question.is_answered) {
      console.error('Question already has an answer:', questionId);
      return NextResponse.json(
        { error: 'Question already has an answer' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.answer_text) {
      console.error('Missing answer_text in request body');
      return NextResponse.json(
        { error: 'Answer text is required' },
        { status: 400 }
      );
    }
    
    // Call the RPC function to create answer and update question in a single transaction
    const { data: result, error: rpcError } = await supabase
      .rpc('create_answer_and_update_question', {
        p_question_id: questionId,
        p_answer_text: body.answer_text,
        p_confidence_score: body.confidence_score || null,
      });
    
    if (rpcError) {
      console.error('Error in RPC call:', rpcError);
      return NextResponse.json(
        { 
          error: 'Failed to create answer and update question', 
          details: rpcError
        },
        { status: 500 }
      );
    }
    
    console.log('Successfully created answer and updated question:', result);
    return NextResponse.json({ answer: result }, { status: 201 });
  } catch (error) {
    console.error('Unhandled error in answer POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id]/answer - Delete the answer for a question
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = createServerSupabaseClient();
    const questionId = params.id;
    
    // Call the RPC function to delete answer and update question in a single transaction
    const { error: rpcError } = await supabase
      .rpc('delete_answer_and_update_question', {
        p_question_id: questionId
      });
    
    if (rpcError) {
      console.error('Error in RPC call:', rpcError);
      
      // Check if the error is because the answer doesn't exist
      if (rpcError.message && rpcError.message.includes('Answer not found')) {
        return NextResponse.json(
          { error: 'Answer not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete answer and update question' },
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

// PUT /api/questions/[id]/answer - Update answer of the question
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = createServerSupabaseClient();
    const questionId = params.id;
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