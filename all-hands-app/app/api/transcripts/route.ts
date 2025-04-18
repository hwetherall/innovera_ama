import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractAnswersFromTranscript } from '@/lib/openrouter/client';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, transcriptContent } = await request.json();

    if (!sessionId || !transcriptContent) {
      return NextResponse.json(
        { error: 'Session ID and transcript content are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client for server-side usage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Insert transcript
    const { data: transcriptData, error: transcriptError } = await supabase
      .from('transcripts')
      .insert([
        {
          session_id: sessionId,
          content: transcriptContent,
        },
      ])
      .select()
      .single();

    if (transcriptError) {
      console.error('Error storing transcript:', transcriptError);
      return NextResponse.json(
        { error: 'Failed to store transcript' },
        { status: 500 }
      );
    }

    // Fetch questions for this session
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_answered', false);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // If no questions, just return success
    if (!questionsData || questionsData.length === 0) {
      return NextResponse.json({
        message: 'Transcript uploaded successfully, no questions to process',
        transcriptId: transcriptData.id,
      });
    }

    // Format questions for AI processing
    const formattedQuestions = questionsData.map(q => ({
      id: q.id,
      question: q.question_text,
      assignedTo: q.assigned_to,
    }));

    // Process transcript with AI to extract answers
    const answers = await extractAnswersFromTranscript(
      transcriptContent,
      formattedQuestions
    );

    // Store AI-generated answers
    for (const answer of answers) {
      const { error: answerError } = await supabase
        .from('ai_answers')
        .insert([
          {
            question_id: answer.question_id,
            answer_text: answer.answer_text,
            confidence_score: answer.confidence_score,
            source_sessions: [sessionId],
          },
        ]);

      if (answerError) {
        console.error('Error storing answer:', answerError);
        // Continue with other answers even if one fails
      }

      // Mark question as answered
      await supabase
        .from('questions')
        .update({ is_answered: true })
        .eq('id', answer.question_id);
    }

    return NextResponse.json({
      message: 'Transcript uploaded and processed successfully',
      transcriptId: transcriptData.id,
      answersProcessed: answers.length,
    });
  } catch (error) {
    console.error('Error in transcript processing:', error);
    return NextResponse.json(
      { error: 'Failed to process transcript' },
      { status: 500 }
    );
  }
}