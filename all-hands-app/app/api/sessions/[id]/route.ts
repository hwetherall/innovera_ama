import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/sessions/[id] - Get a single session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching session:', error);
      return NextResponse.json(
        { error: 'Failed to fetch session' },
        { status: 500 }
      );
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in session GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id] - Update a session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    
    // Validate session exists
    const { data: existingSession, error: fetchError } = await supabase
      .from('sessions')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    
    if (fetchError || !existingSession) {
    return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
    );
    }
    
    // Update session
    const { data, error } = await supabase
      .from('sessions')
      .update({
        month_year: body.month_year,
        is_active: body.is_active,
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating session:', error);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ session: data[0] });
  } catch (error) {
    console.error('Error in session PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    
    // Validate session exists
    const { data: existingSession, error: fetchError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Start a transaction by using RPC
    const { data: result, error: rpcError } = await supabase.rpc('delete_session_cascade', {
      p_session_id: id
    });

    if (rpcError) {
      console.error('Error in cascade delete:', rpcError);
      return NextResponse.json(
        { error: 'Failed to delete session and related data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Session and all related data (questions and answers) deleted successfully'
    });
  } catch (error) {
    console.error('Error in session DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 