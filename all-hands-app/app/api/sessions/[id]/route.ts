import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SlackSessionService } from '@/lib/services/backend/slack-session-message.service';
import { WebClient } from '@slack/web-api';


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
    
    const { data, error } = await supabase
      .from('sessions')
      .update({
        month_year: body.month_year,
        status: body.status,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating session:', error);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (data.status === 'waiting_transcript') {
      try {
        await SlackSessionService.sendSessionClosedMessage(data.month_year);
      } catch (error) {
        console.error('Error sending session closed message to Slack:', error);
      }
    } else if (data.status === 'completed') {
      try {
        await SlackSessionService.sendSessionCompletedMessage(data.id, data.month_year);
      } catch (error) {
        console.error('Error sending session completed message to Slack:', error);
      }
    }
    
    return NextResponse.json({ session: data });
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

    // First, check if session exists
    const { data: session, error: checkError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Clean up scheduled messages in Slack BEFORE deleting the session
    try {
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN, {
        timeout: 15000,
        retryConfig: { retries: 2, factor: 2 }
      });
      
      // Fetch scheduled messages directly from the table
      const { data: scheduledMessages, error: fetchError } = await supabase
        .from('slack_scheduled_messages')
        .select('slack_scheduled_message_id, slack_channel_id, message_type')
        .eq('session_id', id);
      
      if (fetchError) {
        console.error('Error fetching scheduled messages:', fetchError);
        return NextResponse.json({ 
          error: 'Failed to fetch scheduled messages for cleanup' 
        }, { status: 500 });
      }
      
      // Cancel each scheduled message in Slack
      const failedCancellations = [];
      for (const message of scheduledMessages || []) {
        try {
          await slack.chat.deleteScheduledMessage({
            channel: message.slack_channel_id,
            scheduled_message_id: message.slack_scheduled_message_id
          });
          console.log(`Cancelled ${message.message_type} scheduled message: ${message.slack_scheduled_message_id}`);
        } catch (slackError: any) {
          console.error(`Error cancelling scheduled message ${message.slack_scheduled_message_id}:`, slackError);
          failedCancellations.push({
            message_id: message.slack_scheduled_message_id,
            error: slackError.message || 'Unknown error'
          });
        }
      }
      
      // If any cancellations failed, abort the deletion
      if (failedCancellations.length > 0) {
        return NextResponse.json({ 
          error: 'Failed to cancel scheduled messages in Slack',
          details: failedCancellations
        }, { status: 500 });
      }
      
      if (scheduledMessages && scheduledMessages.length > 0) {
        console.log(`Successfully cancelled ${scheduledMessages.length} scheduled messages for session ${id}`);
      }
    } catch (cleanupError) {
      console.error('Error during scheduled message cleanup:', cleanupError);
      return NextResponse.json({ 
        error: `Scheduled message cleanup failed: ${cleanupError}` 
      }, { status: 500 });
    }

    // Now delete the session (scheduled messages will be CASCADE deleted)
    const { error: deleteError, count } = await supabase
      .from('sessions')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Session, all related data (questions and answers), and scheduled messages deleted successfully'
    });
  } catch (error) {
    console.error('Error in session DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 