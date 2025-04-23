import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/transcripts/[id] - Get a single transcript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data: transcript, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching transcript:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transcript' },
        { status: 500 }
      );
    }
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Error in GET /api/transcripts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/transcripts/[id] - Update a transcript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    
    // Check if transcript exists
    const { data: existingTranscript, error: fetchError } = await supabase
      .from('transcripts')
      .select('id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingTranscript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }
    
    // Update transcript
    const {  data: transcript, error } = await supabase
      .from('transcripts')
      .update({
        content: body.content,
        session_id: body.session_id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transcript:', error);
      return NextResponse.json(
        { error: 'Failed to update transcript' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Error in PUT /api/transcripts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/transcripts/[id] - Delete a transcript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // Check if transcript exists
    const { data: existingTranscript, error: fetchError } = await supabase
      .from('transcripts')
      .select('id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingTranscript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }
    
    // Delete transcript
    const { error } = await supabase
      .from('transcripts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transcript:', error);
      return NextResponse.json(
        { error: 'Failed to delete transcript' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/transcripts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 