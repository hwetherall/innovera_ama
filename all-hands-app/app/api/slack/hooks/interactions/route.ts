import { NextRequest, NextResponse } from 'next/server';
import { SlackInteractionPayload } from '@/types/slack';
import { SlackAuthService } from '@/lib/services/backend/slack-auth.service';
import { SlackModalService } from '@/lib/services/backend/slack-modal.service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function saveQuestionToDb(questionData: any, sessionMetadata: any) {
    let sessionId = null;
                        
    if (sessionMetadata) {
        try {
            sessionId = sessionMetadata.session_id;
        } catch (error) {
            throw new Error(`Failed to parse session metadata: ${error}`);
        }
    }

    // Save the question using the existing API endpoint
    if (sessionId) {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/sessions/${sessionId}/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.EXTERNAL_REQUEST_API_KEY || ''
                },
                body: JSON.stringify({
                    question_text: questionData.question,
                    assigned_to: questionData.assignee
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to save question: ${response.statusText}`);
            }

            console.log('Question saved successfully via API endpoint');
        } catch (error) {
            throw new Error(`Failed to save question: ${error}`);
        }
    } else {
        throw new Error ('No session ID found in metadata, question not saved');
    }
}

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
  
    // Parse the payload based on the webhook type
    let interactionPayload: SlackInteractionPayload;
    try {
        // For interactions, parse as URL-encoded form data
        const formData = new URLSearchParams(body);
        const payloadStr = formData.get('payload');
        
        if (!payloadStr) {
            return NextResponse.json({ error: 'No payload found in interaction request' }, { status: 400 });
        }
        
        interactionPayload = JSON.parse(payloadStr) as SlackInteractionPayload;
    } catch (error) {
        return NextResponse.json({ error: `Invalid payload. Error: ${error}` }, { status: 400 });
    }

    // Handle different interaction types
    switch (interactionPayload.type) {
        case 'block_actions':
            const actionId = interactionPayload.actions?.[0]?.action_id;

            if (!actionId) {
                return NextResponse.json({ error: 'No action ID found in interaction payload' }, { status: 400 });
            }

            switch (actionId) {
                case 'submit_question_modal':
                    try {
                        // Get the trigger_id to open the modal
                        const triggerId = interactionPayload.trigger_id;
                        
                        if (!triggerId) {
                            return NextResponse.json({ error: 'No trigger ID found' }, { status: 400 });
                        }

                        // Extract session details from button value
                        const buttonValue = interactionPayload.actions?.[0]?.value || '{}';
                        let sessionData;
                        
                        try {
                            sessionData = JSON.parse(buttonValue);
                        } catch (error) {
                            console.error('Error parsing button value:', error);
                            await SlackModalService.openErrorModal(triggerId, 'Invalid session data');
                            return NextResponse.json({ ok: true });
                        }

                        // Check session status in Supabase
                        if (sessionData.session_id) {
                            const supabase = createServerSupabaseClient();
                            const { data: session, error } = await supabase
                                .from('sessions')
                                .select('status')
                                .eq('id', sessionData.session_id)
                                .single();

                            if (error || !session) {
                                console.error('Error fetching session:', error);
                                await SlackModalService.openErrorModal(triggerId, 'Session not found');
                                return NextResponse.json({ ok: true });
                            }

                            // Check if session is active
                            if (session.status !== 'active') {
                                await SlackModalService.openErrorModal(triggerId, 'Session closed');
                                return NextResponse.json({ ok: true });
                            }
                        } else {
                            await SlackModalService.openErrorModal(triggerId, 'Invalid session data');
                            return NextResponse.json({ ok: true });
                        }
                        
                        // Open the question submission modal with session details
                        await SlackModalService.openQuestionModal(triggerId, buttonValue);
                                                
                    } catch (error) {
                        console.error('Error opening question modal:', error);
                        return NextResponse.json({ error: 'Failed to open modal' }, { status: 500 });
                    }
                    break;

                default:
                    console.log('Received unknown action ID:', actionId);
                    break;
            }
            break;

        case 'view_submission':
            // Handle modal submissions
            const callbackId = interactionPayload.view?.callback_id;
            
            switch (callbackId) {
                case 'question_submission': 
                    (async () => {
                        try {
                            // Parse the submitted question data
                            const questionData = SlackModalService.parseQuestionSubmission(interactionPayload);
                            
                            // Extract session details from private_metadata
                            const sessionMetadata = interactionPayload.view?.private_metadata;
                            const parsedSessionMetadata = sessionMetadata ? JSON.parse(sessionMetadata as string) : "{}";

                            await saveQuestionToDb(questionData, parsedSessionMetadata);
                            
                            // Send confirmation to the user
                            await SlackModalService.sendSubmissionConfirmation(
                            questionData.userId!, 
                            { question: questionData.question, assignee: questionData.assignee, month_year: parsedSessionMetadata.month_year })

                        } catch (error) {
                            console.error('Error processing question submission:', error);
                        
                            // Send error message to user
                            const userId = interactionPayload.user?.id;
                            if (userId) {
                                await SlackModalService.sendSubmissionError(userId, error as string || 'Failed to process your submission').catch(err => console.error('Error sending error message:', err));
                            }
                        }
                    })();

                    // Return success immediately to Slack
                    return NextResponse.json({ response_action: 'clear' });
                default:
                    console.log('Received unknown view submission callback ID:', callbackId);
                    break;
            }
            break;

        default:
            console.log('Received unknown interaction type:', interactionPayload.type);
            break;
    }

    return NextResponse.json({ ok: true });
}
