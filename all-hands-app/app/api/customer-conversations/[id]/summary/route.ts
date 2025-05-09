import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('conversation_summaries')
      .select('*')
      .eq('conversation_id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('GET summary error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data || null);
  } catch (error) {
    console.error('GET summary exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    // Upsert: if a summary exists for this conversation, update it; otherwise, insert
    const { data, error } = await supabase
      .from('conversation_summaries')
      .upsert([{ content, conversation_id: id }], { onConflict: 'conversation_id' })
      .select()
      .single();

    if (error) {
      console.error('POST summary error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST summary exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = createServerSupabaseClient();

    const { error, count } = await supabase
      .from('conversation_summaries')
      .delete({ count: 'exact' })
      .eq('conversation_id', id);

    if (error) {
      console.error('DELETE summary error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE summary exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
