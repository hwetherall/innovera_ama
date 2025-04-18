import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { askAnything } from '@/lib/openrouter/client';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client for server-side usage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch all transcripts with session info
    const { data: transcriptsData, error: transcriptsError } = await supabase
      .from('transcripts')
      .select(`
        id,
        content,
        sessions (
          month_year
        )
      `);

    if (transcriptsError) {
      console.error('Error fetching transcripts:', transcriptsError);
      return NextResponse.json(
        { error: 'Failed to fetch transcripts' },
        { status: 500 }
      );
    }

    // Format transcripts for the AI
    const formattedTranscripts = transcriptsData.map(item => ({
      id: item.id,
      content: item.content,
      month_year: item.sessions && item.sessions[0]?.month_year
    }));

    // If no transcripts found
    if (formattedTranscripts.length === 0) {
      return NextResponse.json({
        answer: "There are no transcripts available yet to answer your question. This would be a great question to ask in the next all-hands meeting.",
        sources: [],
        confidence: 0
      });
    }

    // Call the AI service
    const aiResponse = await askAnything(question, formattedTranscripts);

    // Return the answer
    return NextResponse.json({
      answer: aiResponse.answer,
      sources: aiResponse.sources,
      confidence: aiResponse.confidence
    });
  } catch (error) {
    console.error('Error in ask-anything API:', error);
    return NextResponse.json(
      { error: 'Failed to process your question' },
      { status: 500 }
    );
  }
}