import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Session, Question, Answer, SessionWithDetails } from '@/types/supabase';
import { SlackSessionService } from '@/lib/services/backend/slack-session-message.service';
import { convertTo7AmPST, getPreviousMonday, hasDatePassed } from '@/lib/utils/timezone';
import { WebClient } from '@slack/web-api';


// GET /api/sessions - Return all sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const withDetails = searchParams.get('withDetails') === 'true';
    
    // Fetch all sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    if (!withDetails) {
      return NextResponse.json({ sessions });
    }

    // Fetch all questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*');
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // Fetch all answers
    const { data: answers, error: answersError } = await supabase
      .from('ai_answers')
      .select('*');
    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }

    // Build sessions with questions and answers (answer only if session is completed)
    const sessionsWithDetails: SessionWithDetails[] = (sessions as Session[]).map((session) => {
      const sessionQuestions = (questions as Question[]).filter(q => q.session_id === session.id);

      let questionsWithAnswer: (Question & { answer?: Answer })[] = sessionQuestions;
      
      if (session.status === 'completed') {
        questionsWithAnswer = sessionQuestions.map(q => ({
          ...q,
          answer: (answers as Answer[]).find(a => a.question_id === q.id)
        }));
      }
      return {
        ...session,
        questions: questionsWithAnswer
      };
    });

    return NextResponse.json({ sessions: sessionsWithDetails });
  } catch (error) {
    console.error('Error in sessions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    
    // Validate required fields
    if (!body.month_year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    if (!body.meeting_scheduled_date) {
      return NextResponse.json(
        { error: 'Meeting scheduled date is required' },
        { status: 400 }
      );
    }
    
    // Create session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        month_year: body.month_year,
        status: body.status || 'active',
        meeting_scheduled_date: body.meeting_scheduled_date,
      })
      .select();
    
    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Schedule reminder messages
    try {
       await scheduleReminderMessages(supabase, data[0]);
      } catch (error) {
        console.error('Error scheduling reminder messages:', error);
        return NextResponse.json(
          { error: 'Failed to create session - Error scheduling reminder messages: ' + error },
          { status: 500 }
        );
      }

    try {
      // Send the session open message to Slack
      await SlackSessionService.sendSessionOpenMessage(data[0].id, data[0].month_year);
    } catch (error) {
      console.error('Error sending session open message to Slack:', error);
    }
    
    return NextResponse.json({ session: data[0] }, { status: 201 });
  } catch (error) {
    console.error('Error in sessions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Schedules reminder messages for a session using Slack's native scheduling
 * @param supabase Supabase client
 * @param session Session object
 */
async function scheduleReminderMessages(supabase: any, session: Session) {
  // Parse date safely to avoid timezone issues
  // session.meeting_scheduled_date is in YYYY-MM-DD format
  const [year, month, day] = session.meeting_scheduled_date.split('-').map(Number);
  const meetingDate = new Date(year, month - 1, day); // month is 0-indexed
  
  const mondayBefore = getPreviousMonday(meetingDate);
  
  // Calculate reminder times (7am PST)
  const weekBeforeReminder = convertTo7AmPST(mondayBefore);
  const sameDayReminder = convertTo7AmPST(meetingDate);


  // Schedule week before reminder (only if it hasn't passed and is at least 4 days before meeting)
  const daysBetween = Math.floor((meetingDate.getTime() - mondayBefore.getTime()) / (1000 * 60 * 60 * 24));

  const channel = process.env.NODE_ENV === 'development' 
    ? process.env.SLACK_ALL_HANDS_TEST_CHANNEL_ID 
    : process.env.SLACK_ALL_HANDS_CHANNEL_ID;
  if (!channel) {
    throw new Error('SLACK_ALL_HANDS_CHANNEL_ID environment variable is required');
  }
  
  if (!hasDatePassed(weekBeforeReminder) && daysBetween >= 4) {
    try {
      const scheduledMessageId = await SlackSessionService.scheduleSessionReminderMessage(session.id, session.month_year, 'week_before', weekBeforeReminder);

      if (scheduledMessageId) {
        // Save the scheduled message ID to database
        const { error: dbError } = await supabase.from('slack_scheduled_messages').insert({
          session_id: session.id,
          message_type: 'week_before',
          slack_scheduled_message_id: scheduledMessageId,
          slack_channel_id: channel,
          scheduled_for: weekBeforeReminder.toISOString()
        });

        if (dbError) {
          console.error(`Failed to save week before reminder to database for session ${session.id}:`, dbError);
          // Try to cancel the scheduled message since we couldn't save it
          try {
            const slack = new WebClient(process.env.SLACK_BOT_TOKEN, {
              timeout: 15000,
              retryConfig: { retries: 2, factor: 2 }
            });
            await slack.chat.deleteScheduledMessage({
              channel: channel,
              scheduled_message_id: scheduledMessageId
            });
          } catch (cancelError) {
            console.error('Failed to cancel orphaned scheduled message:', cancelError);
          }
        } else {
          console.log(`Scheduled week before reminder for session ${session.id} at ${weekBeforeReminder.toISOString()} (${daysBetween} days before meeting) - Message ID: ${scheduledMessageId}`);
        }
      }
    } catch (error: any) {
      console.error(`Error scheduling week before reminder for session ${session.id}:`, error.message);
      // Re-throw if it's a configuration error
      if (error.message.includes('environment variable')) {
        throw error;
      }
    }
  } else {
    if (hasDatePassed(weekBeforeReminder)) {
      console.log(`Week before reminder for session ${session.id} not scheduled - date has passed`);
    } else {
      console.log(`Week before reminder for session ${session.id} not scheduled - only ${daysBetween} days before meeting (minimum 4 required)`);
    }
  }

  // Schedule same day reminder (only if it hasn't passed)
  if (!hasDatePassed(sameDayReminder)) {
    try {
      const scheduledMessageId = await SlackSessionService.scheduleSessionReminderMessage(
        session.id,
        session.month_year,
        'same_day',
        sameDayReminder
      );

      if (scheduledMessageId) {
        // Save the scheduled message ID to database
        const { error: dbError } = await supabase.from('slack_scheduled_messages').insert({
          session_id: session.id,
          message_type: 'same_day',
          slack_scheduled_message_id: scheduledMessageId,
          slack_channel_id: channel,
          scheduled_for: sameDayReminder.toISOString()
        });

        if (dbError) {
          console.error(`Failed to save same day reminder to database for session ${session.id}:`, dbError);
          // Try to cancel the scheduled message since we couldn't save it
          try {
            const slack = new WebClient(process.env.SLACK_BOT_TOKEN, {
              timeout: 15000,
              retryConfig: { retries: 2, factor: 2 }
            });
            await slack.chat.deleteScheduledMessage({
              channel: channel,
              scheduled_message_id: scheduledMessageId
            });
          } catch (cancelError) {
            console.error('Failed to cancel orphaned scheduled message:', cancelError);
          }
        } else {
          console.log(`Scheduled same day reminder for session ${session.id} at ${sameDayReminder.toISOString()} - Message ID: ${scheduledMessageId}`);
        }
      }
    } catch (error: any) {
      console.error(`Error scheduling same day reminder for session ${session.id}:`, error.message);
      // Re-throw if it's a configuration error
      if (error.message.includes('environment variable')) {
        throw error;
      }
    }
  } else {
    console.log(`Same day reminder for session ${session.id} not scheduled - date has passed`);
  }
} 