import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('session_answers')
      .select('*')
      .eq('session_id', id);

    if (error) {
      if (!(error instanceof Error && error.message.includes('Failed to fetch session answers'))) {
        console.error('Error in GET /api/sessions/[id]/answers (Supabase):', error);
      }
      return NextResponse.json({ error: `Failed to fetch session answers: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ answers: data });
  } catch (err) {
    if (!(err instanceof Error && err.message.includes('Failed to fetch session answers'))) {
      console.error('Error in GET /api/sessions/[id]/answers (Unexpected):', err);
    }
    return NextResponse.json(
      { error: 'Failed to fetch session answers: An unexpected error occurred.' },
      { status: 500 }
    );
  }
}