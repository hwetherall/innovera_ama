import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN, {
  timeout: 15000,
  retryConfig: {
    retries: 2,
    factor: 2
  }
});

export const SlackSessionService = {
  /**
   * Sends a message announcing that a new All-Hands session is open for questions
   * @param month - The month of the All-Hands session
   * @param year - The year of the All-Hands session
   * @returns Promise with the API response
   */
  async sendSessionOpenMessage(session_id: string, month_year: string) {
    try {
      // Get the all hands channel ID from the environment variable
      const channel = process.env.NODE_ENV === 'development' 
        ? process.env.SLACK_ALL_HANDS_TEST_CHANNEL_ID 
        : process.env.SLACK_ALL_HANDS_CHANNEL_ID;
      if (!channel) {
        throw new Error('SLACK_ALL_HANDS_CHANNEL_ID is not set');
      }

      return await slack.chat.postMessage({
        channel,
        text: `📢 New All-Hands Q&A Session Open - ${month_year}`,
        blocks: [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📢 All-Hands Q&A Session Open"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `The *${month_year}* All-Hands Q&A session is now open for questions!\n\nSubmit your anonymous questions and they will be addressed during the upcoming meeting.`
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "action_id": `submit_question_modal`,
                        "style": "primary",
                        "value": JSON.stringify({
                          session_id: session_id,
                          month_year: month_year
                        }),
                        "text": {
                            "type": "plain_text",
                            "text": "📝 Submit a Question"
                        }
                    }
                ]
            }
        ]
      });
    } catch (error) {
      console.error('Error sending session open message:', error);
      throw error;
    }
  },

  /**
   * Sends a reminder message about the All-Hands session
   * @param month - The month of the All-Hands session
   * @param year - The year of the All-Hands session
   * @param reminderType - Type of reminder ('week_before' or 'same_day')
   * @returns Promise with the API response
   */
  async scheduleSessionReminderMessage(
    session_id: string,
    month_year: string, 
    reminderType: 'week_before' | 'same_day',
    scheduledTime: Date
  ): Promise<string | null> {
    // Check configuration before entering try-catch
    const channel = process.env.NODE_ENV === 'development' 
      ? process.env.SLACK_ALL_HANDS_TEST_CHANNEL_ID 
      : process.env.SLACK_ALL_HANDS_CHANNEL_ID;
    if (!channel) {
      throw new Error('SLACK_ALL_HANDS_CHANNEL_ID environment variable is not configured');
    }

    try {
      const timestamp = Math.floor(scheduledTime.getTime() / 1000);

      const reminderText = reminderType === 'week_before' 
        ? '📅 Reminder: One week left to submit questions'
        : '⏰ Last chance to submit questions - All-Hands today!';

      const urgencyEmoji = reminderType === 'same_day' ? '🚨 ' : '⏳ ';

      const result = await slack.chat.scheduleMessage({
        channel,
        text: `${reminderText} - ${month_year} All-Hands`,
        post_at: timestamp,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${urgencyEmoji}All-Hands Q&A Reminder`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: reminderType === 'week_before'
                ? `You have *one week left* to submit questions for the *${month_year}* All-Hands meeting.\n\nDon't miss your chance to get your questions answered!`
                : `*Final reminder!* The *${month_year}* All-Hands Q&A session closes today.\n\nSubmit your questions now before it's too late!`
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                action_id: 'submit_question_modal',
                style: 'primary',
                value: JSON.stringify({
                  session_id: session_id,
                  month_year: month_year
                }),
                text: {
                  type: 'plain_text',
                  text: reminderType === 'same_day' ? '⚡ Submit Now' : '📝 Submit a Question'
                }
              }
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: '🔒 *All questions are completely anonymous*'
              }
            ]
          }
        ]
      });
      return result.scheduled_message_id || null;
    } catch (error: any) {
      // Log with context
      console.error(`Error scheduling ${reminderType} reminder for session ${session_id}:`, error);
      
      // Re-throw with context
      throw new Error(`Failed to schedule ${reminderType} reminder: ${error.message || 'Unknown error'}`);
    }
  },

  /**
   * Sends a message announcing that the All-Hands session is closed
   * @param month - The month of the All-Hands session
   * @param year - The year of the All-Hands session
   * @returns Promise with the API response
   */
  async sendSessionClosedMessage(month_year: string) {
    try {
      // Get the all hands channel ID from the environment variable
      const channel = process.env.NODE_ENV === 'development' 
        ? process.env.SLACK_ALL_HANDS_TEST_CHANNEL_ID 
        : process.env.SLACK_ALL_HANDS_CHANNEL_ID;
      if (!channel) {
        throw new Error('SLACK_ALL_HANDS_CHANNEL_ID is not set');
      }

      return await slack.chat.postMessage({
        channel,
        text: `🔒 All-Hands Q&A Session Closed - ${month_year}`,
        blocks: [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🔒 All-Hands Q&A Session Closed"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `The *${month_year}* All-Hands Q&A session is now *closed* for new questions.\n\nThank you to everyone who submitted questions! We'll address them during the upcoming meeting.`
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "💡 You can *view all questions* from this session — along with their answers — and *ask any question* about the company by chatting with the bot in the Apps tab."
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "🔄 The next All-Hands Q&A session will be announced soon"
                    }
                ]
            }
        ]
      });
    } catch (error) {
      console.error('Error sending session closed message:', error);
      throw error;
    }
  }
};
