import { NextRequest, NextResponse } from 'next/server';
import {  AnswerGenerationRequest, AnswerGenerationResponse } from '@/types/ai-generation';
import { processQuestion } from '@/lib/services/backend/answer-generation.service';

// POST /api/ai/answer-generation - Generate answers for questions based on transcript
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json() as AnswerGenerationRequest;
    
    // Validate required fields
    if (!body.transcript || !body.questions) {
      return NextResponse.json(
        { error: 'Transcript and questions are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json(
        { error: 'Questions must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate question format
    const invalidQuestions = body.questions.filter(
      q => !q.id || !q.question || !q.assignedTo
    );

    if (invalidQuestions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid question format', 
          details: 'Each question must have id, question, and assignedTo fields' 
        },
        { status: 400 }
      );
    }

    // Generate answers using AI
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OpenRouter API key is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured' },
        { status: 500 }
      );
    }

    // Process all questions in parallel - all or nothing approach
    const answerPromises = body.questions.map(question => 
      processQuestion(question, body.transcript, apiKey)
    );

    // Wait for ALL questions to complete successfully (or fail the entire request)
    const answers = await Promise.all(answerPromises);

    const processingTime = Date.now() - startTime;
    console.log(`Successfully processed ${body.questions.length} questions in ${processingTime}ms`);

    const response: AnswerGenerationResponse = {
      answers: answers
    };

    return NextResponse.json(response);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Error in answer generation after ${processingTime}ms:`, error);
    
    // Ensure we always return valid JSON, even on timeout
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to generate answers. Please try again with fewer questions or contact support.'
      },
      { status: 500 }
    );
  }
}
 