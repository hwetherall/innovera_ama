import { NextRequest, NextResponse } from 'next/server';
import { AIAnswer, AnswerGenerationRequest, AnswerGenerationResponse, OpenRouterResponse } from '@/types/ai-generation';

// POST /api/ai/answer-generation - Generate answers for questions based on transcript
export async function POST(request: NextRequest) {
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
      throw new Error('OpenRouter API key is not configured');
    }

    const answers: AIAnswer[] = [];

    // Process each question individually
    for (const question of body.questions) {
      // Format the prompt for a single question
      const prompt = `
You are analyzing a transcript from a company all-hands meeting to answer a specific question.
Please find the answer to this question in the transcript and generate a confidence score between 0-1 indicating how confident you are in the answer, hence, with how much certainty you can say that the answer is correct. A score of 0 means you are not confident at all in the answer, and a score of 1 means you are very confident in the answer. If the question wasn't answered in the transcript, return a score that reflects how confident you are that the question wasn't answered.

## GUIDELINES:

1. You should prioritize excerpts from the person assigned to the question but not limit your answer to that person's excerpts. IF the transcript doesn't discriminate between people, consider all information in the transcript as having the same relevance. 
2. The question might be direclty mentioned in the transcript, if so, give higher priority to the text near the question. 
3. Consider that the transcript was generated automatically from a live meeting, so grammar mistakes and other issues may exist.
4. If the question wasn't answered in the transcript, return "There was not enough information in the transcript to answer this question".


## QUESTION:
${question.question}
(Asked to: ${question.assignedTo})

## TRANSCRIPT CONTENT:
${body.transcript}

## OUTPUT FORMAT:
Format your response as a JSON object with the following fields:
{
  "answer_text": "The extracted answer here, or 'This question was not addressed in the transcript' if not found",
  "confidence_score": 0.95 // Score between 0-1 indicating how well the answer addresses the question
}

Verify that the OUTPUT FORMAT is correct and that the JSON is properly formatted. Only return the JSON object, nothing else.
`;

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-4.1-mini',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            response_format: { type: 'json_object' }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json() as OpenRouterResponse;
        const content = data.choices[0].message.content;
        
        // Parse the JSON response
        const parsedResponse = JSON.parse(content);

        // Construct the answer object with the original question ID
        answers.push({
          question_id: question.id,
          answer_text: parsedResponse.answer_text,
          confidence_score: parsedResponse.confidence_score
        });

      } catch (error) {
        console.error(`Error processing question ${question.id}:`, error);
        // Add a failed answer entry
        answers.push({
          question_id: question.id,
          answer_text: "Failed to generate answer due to an error",
          confidence_score: 0
        });
      }
    }

    const response: AnswerGenerationResponse = {
      answers: answers
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in answer generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
 