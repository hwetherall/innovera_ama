import { NextRequest, NextResponse } from 'next/server';
import { AskAnythingRequestBody } from '@/types/ai-generation';
import { AskAnythingService } from '@/lib/services/backend/ask-anything.service';

// POST /api/ai/ask-anything/all-hands - Direct question answering
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AskAnythingRequestBody;
    
    // Validate required fields
    if (!body.question || typeof body.question !== 'string' || !body.question.trim()) {
      return NextResponse.json(
        { error: 'Question is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const result = await AskAnythingService.allHands(body.question);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in ask-anything all-hands:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}