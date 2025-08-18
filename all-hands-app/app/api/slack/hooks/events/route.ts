import { NextRequest, NextResponse } from 'next/server';
import { SlackEventPayload } from '@/types/slack';
import { SlackAuthService } from '@/lib/services/backend/slack-auth.service';
import { UserWelcomeService } from '@/lib/services/backend/user-welcome.service';
import { WebClient } from '@slack/web-api';
import { SlackAiBotService } from '@/lib/services/backend/slack-ai-bot.service';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Session, SessionWithDetails, Question, Answer } from '@/types/supabase';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function POST(request: NextRequest): Promise<NextResponse> {

    // Extract Slack headers
    const headers = {
        'x-slack-signature': request.headers.get('x-slack-signature') || '',
        'x-slack-request-timestamp': request.headers.get('x-slack-request-timestamp') || ''
    };

    // Get the raw request body as a string
    const body = await request.text();

    // Verify the request is from Slack
    const isVerified = SlackAuthService.verifySlackRequest(body, headers);
        
    if (!isVerified) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let eventPayload: SlackEventPayload;
    try {
        eventPayload = JSON.parse(body) as SlackEventPayload;
    } catch (error) {
        return NextResponse.json({ error: `Invalid payload. Error: ${error}` }, { status: 400 });
    }

    if (eventPayload.type === 'url_verification') {
    return new NextResponse(eventPayload.challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
    });
    }

    if (eventPayload.type === 'event_callback') {
    const event = eventPayload.event;

    if (!event){
        return NextResponse.json({ error: 'No event found in event callback' }, { status: 400 });
    }

    switch (event.type) {
        case 'app_home_opened':
            // Publish the Home tab view for this user
            try {
                
                if (!event.user) {
                    return NextResponse.json({ error: 'No user found in app home opened event' }, { status: 400 });
                }

                // Check if user has already been welcomed
                const hasBeenWelcomed = await UserWelcomeService.hasBeenWelcomed(event.user);
                
                if (!hasBeenWelcomed) {
                    // Open a DM channel with the user
                const dm = await slack.conversations.open({ users: event.user });
                const channel = dm.channel!.id!;

                // Send welcome message
                await slack.chat.postMessage({
                    channel,
                    text: "👋 Welcome to the All-Hands Q&A Bot!",
                    blocks: [
                        {
                            "type": "header",
                            "text": {
                                "type": "plain_text",
                                "text": "👋 Welcome to Innovera's All-Hands Q&A Bot!"
                            }
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "With the bot you can:\n• Submit questions for the upcoming All-Hands\n• Browse all answered questions per session\n• Ask your own questions directly!"
                            }
                        },
                        {
                            "type": "divider"
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "*How to use the Q&A Bot*\nThe Bot is powered by AI, just ask what you want to do!"
                            }
                        },
                        {
                            "type": "context",
                            "elements": [
                                {
                                    "type": "mrkdwn",
                                    "text": "*Note:* When retreiving Q&A from  a specific All-Hands, remember to always include the month and year of the meeting you are referring to."
                                }
                            ]
                        }
                    ]
                });

                // Mark user as welcomed
                await UserWelcomeService.markWelcomed(event.user);
                console.log(`User ${event.user} has been welcomed`);
                } else {
                    console.log(`User ${event.user} has already been welcomed`);
                }
            } catch (error) {
                console.error('Error sending welcome message:', error);
                return NextResponse.json({ error: 'Failed to send welcome message' }, { status: 500 });
            }
            break;

        case 'message':
            if (event.channel_type === 'im' && !!event.client_msg_id) {
                // Process message asynchronously to avoid Slack timeout
                processSlackMessage(event).catch(error => 
                    console.error('Error processing Slack message:', error)
                );
            }
            break;

        default:
            console.log('Unhandled event type:', event.type);
        }
    }

    return NextResponse.json({ ok: true });
}

async function processSlackMessage(event: any) {
    try {
        const history = await slack.conversations.history({
            channel: event.channel!,
            include_all_metadata: true,
            limit: 2 // last message before current
        });
                  
        const lastMessage = history.messages?.[1];
        let lastMessageFinal;
        if (lastMessage && !!lastMessage.text && lastMessage.ts && event.ts && 
            parseFloat(event.ts) - parseFloat(lastMessage.ts) <= 300) { // Only consider messages sent in the last 5 minutes
                const lastMessageText = lastMessage.text
                const lastMessageUser = lastMessage.client_msg_id? "User" : "Bot"
                const lastMessageType = lastMessage.metadata?.event_payload ? JSON.stringify(lastMessage.metadata.event_payload) : ""
            
                lastMessageFinal = `[${lastMessageUser}] ${lastMessageText} | Type: ${lastMessageType}`;
            } else {
                lastMessageFinal = "";
            }

        const messageType = await SlackAiBotService.defineRequestType(event.text? event.text : "", lastMessageFinal)
                
        console.log(messageType)

        if (messageType === null) {
            await slack.chat.postMessage({
                channel: event.channel!,
                text: `❌ Sorry, there was an error processing your request. Please try again later.`,
            });
            return;
        }

        switch (messageType.request_type) {
            case "what_can_do":
                const reply = await SlackAiBotService.replyWhatCanDo(event.text? event.text : "")
                if (reply) {
                    await slack.chat.postMessage({
                        channel: event.channel!,
                        text: reply,
                        metadata: {
                            event_type: "allhands_bot_reply",
                            event_payload: {
                                request_type: "what_can_do"
                            }
                        }
                    });
                }
                break;
            case "submit_question":
                try {
                    const supabase = createServerSupabaseClient();
                    
                    // Get the most recent session from the database
                    const { data: session, error } = await supabase
                        .from('sessions')
                        .select('id, status, month_year')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single() as { data: Pick<Session, 'id' | 'status' | 'month_year'> | null, error: any };

                    if (error || !session) {
                        await slack.chat.postMessage({
                            channel: event.channel!,
                            text: "❌ No sessions found. Please contact the bot's administrator.",
                            metadata: {
                                event_type: "allhands_bot_reply",
                                event_payload: {
                                    request_type: "submit_question"
                                }
                            }
                        });
                        break;
                    }

                    // Check if session is active
                    if (session.status !== 'active') {
                        await slack.chat.postMessage({
                            channel: event.channel!,
                            text: "There are currently no open Q&A sessions. Please wait for the next All-Hands session to be announced!",
                            metadata: {
                                event_type: "allhands_bot_reply",
                                event_payload: {
                                    request_type: "submit_question"
                                }
                            }
                        });
                        break;
                    }

                    // Send message with button to submit question
                    await slack.chat.postMessage({
                        channel: event.channel!,
                        text: `📝 Submit a Question - ${session.month_year}`,
                        blocks: [
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": `The *${session.month_year}* All-Hands Q&A session is open for questions!\n\nClick the button below to submit your anonymous question.`
                                }
                            },
                            {
                                "type": "actions",
                                "elements": [
                                    {
                                        "type": "button",
                                        "action_id": "submit_question_modal",
                                        "style": "primary",
                                        "value": JSON.stringify({
                                            session_id: session.id,
                                            month_year: session.month_year
                                        }),
                                        "text": {
                                            "type": "plain_text",
                                            "text": "📝 Submit a Question"
                                        }
                                    }
                                ]
                            },
                            {
                                "type": "context",
                                "elements": [
                                    {
                                        "type": "mrkdwn",
                                        "text": "🔒 *All questions are completely anonymous*"
                                    }
                                ]
                            }
                        ],
                        metadata: {
                            event_type: "allhands_bot_reply",
                            event_payload: {
                                request_type: "submit_question"
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error handling submit_question:', error);
                    await slack.chat.postMessage({
                        channel: event.channel!,
                        text: "❌ Sorry, there was an error processing your request. Please try again later.",
                        metadata: {
                            event_type: "allhands_bot_reply",
                            event_payload: {
                                request_type: "submit_question"
                            }
                        }
                    });
                }
                break;
            
            case "get_session_records":
                try {
                    if (messageType.month_year) {
                        // Call sessions endpoint with details to get all sessions with Q&As
                        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                        const sessionsResponse = await fetch(`${baseUrl}/api/sessions?withDetails=true`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-api-key': process.env.EXTERNAL_REQUEST_API_KEY || ''
                            }
                        });

                        if (!sessionsResponse.ok) {
                            throw new Error(`Sessions API error: ${sessionsResponse.statusText}`);
                        }

                        const sessionsData = await sessionsResponse.json();
                         const sessions: SessionWithDetails[] = sessionsData.sessions || [];
                         
                         // Filter by month_year
                         const session: SessionWithDetails | undefined = sessions.find((s: SessionWithDetails) => s.month_year === messageType.month_year);

                        if (!session) {
                            await slack.chat.postMessage({
                                channel: event.channel!,
                                text: `❌ No session found for ${messageType.month_year}. Please check the month and year format (e.g., "January 2025").`,
                                metadata: {
                                    event_type: "allhands_bot_reply",
                                    event_payload: {
                                        request_type: "get_session_records",
                                        month_year: messageType.month_year
                                    }
                                }
                            });
                            break;
                        }

                        // Check if session has been completed (has Q&As available)
                        if (session.status !== 'completed') {
                            await slack.chat.postMessage({
                                channel: event.channel!,
                                text: `📋 The ${session.month_year} All-Hands session is still ${session.status === 'active' ? 'open' : 'in processing'}. Questions and answers will be available once the session is completed.`,
                                metadata: {
                                    event_type: "allhands_bot_reply",
                                    event_payload: {
                                        request_type: "get_session_records",
                                        month_year: messageType.month_year
                                    }
                                }
                            });
                            break;
                        }
                        
                         // Format the response for Slack
                         const sessionData: SessionWithDetails = session;
                         const questions: (Question & { answer?: Answer })[] = session.questions || [];
                         
                         let responseText = `📊 *${sessionData.month_year} All-Hands Q&A Session*\n\n`;
                         
                         if (questions.length === 0) {
                             responseText += "No questions were submitted for this session.";
                         } else {
                             responseText += `*${questions.length} Questions & Answers:*\n\n`;
                             
                             questions.forEach((q: Question & { answer?: Answer }, index: number) => {
                                responseText += `*${index + 1}. ${q.question_text}*\n`;
                                responseText += `*Assigned to:* ${q.assigned_to}\n`;
                                
                                if (q.answer) {
                                    responseText += `*Answer:* ${q.answer.answer_text}\n`;
                                    if (q.answer.confidence_score) {
                                        responseText += `*Confidence:* ${Math.round(q.answer.confidence_score * 100)}%\n`;
                                    }
                                } else {
                                    responseText += `*Answer:* Not yet answered\n`;
                                }
                                responseText += `\n`;
                            });
                        }

                        await slack.chat.postMessage({
                            channel: event.channel!,
                            text: responseText,
                            metadata: {
                                event_type: "allhands_bot_reply",
                                event_payload: {
                                    request_type: "get_session_records",
                                    month_year: messageType.month_year
                                }
                            }
                        });

                    } else {
                        // No month_year provided, ask user to specify
                        await slack.chat.postMessage({
                            channel: event.channel!,
                            text: `📅 Please provide the month and year of the All-Hands session you are looking for. For example: "June 2025".`,
                            metadata: {
                                event_type: "allhands_bot_reply",
                                event_payload: {
                                    request_type: "get_session_records"
                                }
                            }
                        });
                    }

                } catch (error) {
                    console.error('Error handling get_session_records:', error);
                    await slack.chat.postMessage({
                        channel: event.channel!,
                        text: "❌ Sorry, I encountered an error while retrieving the session records. Please try again later.",
                        metadata: {
                            event_type: "allhands_bot_reply",
                            event_payload: {
                                request_type: "get_session_records",
                                ...(messageType.month_year && { month_year: messageType.month_year })
                            }
                        }
                    });
                }
                break;

            case "ask_anything":
                try {
                    // Call the AI ask-anything endpoint
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                    const aiResponse = await fetch(`${baseUrl}/api/ai/ask-anything/all-hands`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': process.env.EXTERNAL_REQUEST_API_KEY || ''
                        },
                        body: JSON.stringify({
                            question: event.text || ""
                        })
                    });

                    if (!aiResponse.ok) {
                        throw new Error(`AI API error: ${aiResponse.statusText}`);
                    }

                    const aiData = await aiResponse.json();
                    
                    // Format the response with sources and confidence
                    let responseText = aiData.answer;
                    
                    if (aiData.sources && aiData.sources.length > 0) {
                        responseText += `\n\n*Sources:* ${aiData.sources.join(', ')}`;
                    }
                    
                    if (aiData.confidence !== undefined) {
                        const confidencePercent = Math.round(aiData.confidence * 100);
                        responseText += `\n*Confidence:* ${confidencePercent}%`;
                    }

                    await slack.chat.postMessage({
                        channel: event.channel!,
                        text: responseText,
                        metadata: {
                            event_type: "allhands_bot_reply",
                            event_payload: {
                                request_type: "ask_anything"
                            }
                        }
                    });

                } catch (error) {
                    console.error('Error handling ask_anything:', error);
                    await slack.chat.postMessage({
                        channel: event.channel!,
                        text: "❌ Sorry, I encountered an error while processing your question. Please try again later.",
                        metadata: {
                            event_type: "allhands_bot_reply",
                            event_payload: {
                                request_type: "ask_anything"
                                    }
                                }
                            });
                        }
                        break;

            case "outside_scope":
                await slack.chat.postMessage({
                    channel: event.channel!,
                    text: `Sorry, this request is outside my current scope`,
                    metadata: {
                        event_type: "allhands_bot_reply",
                        event_payload: {
                            request_type: "outside_scope"
                        }
                    }
                });
                break;
            default:
                await slack.chat.postMessage({
                    channel: event.channel!,
                    text: `Sorry, I couldn't understand your message. Can you please rephrase it?`,
                });
                break;
        }
    } catch (error) {
        console.error('Error in processSlackMessage:', error);
    }
}
