import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AskAnythingRequestBody, AskAnythingResponse, OpenRouterResponse } from '@/types/ai-generation';

// POST /api/ai/ask-anything - Direct question answering
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = (await request.json()) as AskAnythingRequestBody;
    
    // Validate required fields
    if (!body.question || typeof body.question !== 'string' || !body.question.trim()) {
      return NextResponse.json(
        { error: 'Question is required and must be a non-empty string' },
        { status: 400 }
      );
    }
    
    // 1. Fetch all transcripts from the view
    const { data: transcripts, error } = await supabase
      .from('transcript_with_session_info')
      .select('content, month_year')
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch transcripts');
    }

    // 2. Build the prompt with <month_year>...</month_year> and <resources>...</resources>
    let promptTranscripts = '';
    let resourcesContent = '';
    let transcriptsAndResources = '';

    for (const t of transcripts) {
      if (t.month_year) {
        promptTranscripts += `<${t.month_year}>${t.content}</${t.month_year}>\n\n`;
      } else {
        resourcesContent += t.content + '\n\n';
      }
    }

    transcriptsAndResources = promptTranscripts;

    if (resourcesContent.trim()) {
      transcriptsAndResources += `<resources>${resourcesContent.trim()}</resources>\n\n`;
    }

    // 3. Call OpenRouter API
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const prompt = `
You are answering questions based on transcripts from company all-hands meetings and additional <resources> if provided.
The user's QUESTION is: "${body.question}"

## GUIDELINES:

Please answer based ONLY on information found in these transcripts and resources. Each transcript is wrapped in <month_year>...</month_year> tags where the month and year are the date of the meeting. ALWAYS give higher relevance to more recent meetings. All resources, if present, are wrapped in a single <resources>...</resources> tag and they provide additional context about the company and its operations.

Consider that the transcripts were generated automatically from a live meeting, so grammar mistakes and other issues may exist.

If you can't find a clear answer in any transcript, respond with: "I don't have enough information to answer this question confidently. This would be a great question to ask in the next all-hands meeting."

Generate a confidence score between 0-1 indicating how confident you are in the answer, hence, with how much certainty you can say that the answer is correct. A score of 0 means you are not confident at all in the answer, and a score of 1 means you are very confident in the answer. If the question wasn't answered in the transcript, return a score that reflects how confident you are that the question wasn't answered.


## TRANSCRIPTS (AND RESOURCES):
${transcriptsAndResources}

Your answer should be helpful, concise, and based only on the provided information.
Also provide the meeting dates, if sourced from transcripts, or the source name, if sourced from resources, where you found the information in your answer.


## OUTPUT FORMAT:
Format your response as a JSON object with the following fields:
{
  "answer": "Your answer here...",
  "sources": ["April 2025", "March 2025"],
  "confidence": 0.85
}

Verify that the OUTPUT FORMAT is correct and that the JSON is properly formatted. Only return the JSON object, nothing else.
`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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
    
    try {
      const parsedResponse: AskAnythingResponse = JSON.parse(content);
      // Validate the structure of the response
      if (
        typeof parsedResponse.answer === 'string' &&
        Array.isArray(parsedResponse.sources) &&
        typeof parsedResponse.confidence === 'number'
      ) {
        return NextResponse.json(parsedResponse);
      } else {
        throw new Error('Malformed response from OpenRouter');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenRouter response:', parseError);
      return NextResponse.json({
        answer: "Failed to generate answer due to an error",
        sources: [],
        confidence: 0.0
      });
    }
  } catch (error) {
    console.error('Error in ask-anything:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}