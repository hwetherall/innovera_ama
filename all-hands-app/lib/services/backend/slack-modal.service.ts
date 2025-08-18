import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export const SlackModalService = {
  /**
   * Opens an error modal when session is not available
   * @param triggerId - The trigger ID from the interaction
   * @param message - The error message to display
   * @returns Promise with the API response
   */
  async openErrorModal(triggerId: string, message: string = 'Session closed or unavailable') {
    try {
      return await slack.views.open({
        trigger_id: triggerId,
        view: {
          type: 'modal',
          callback_id: 'session_error',
          title: { type: 'plain_text', text: 'Session Closed' },
          close: { type: 'plain_text', text: 'Close' },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `❌ *This session is no longer accepting questions.*`
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error opening error modal:', error);
      throw error;
    }
  },

  /**
   * Opens the question submission modal
   * @param triggerId - The trigger ID from the interaction
   * @returns Promise with the API response
   */
  async openQuestionModal(triggerId: string, session_details: string) {
    try {
      return await slack.views.open({
        trigger_id: triggerId,
        view: {
          type: 'modal',
          callback_id: 'question_submission',
          title: { type: 'plain_text', text: 'Submit a Question' },
          submit: { type: 'plain_text', text: 'Submit' },
          close: { type: 'plain_text', text: 'Cancel' },
          private_metadata: session_details,
          blocks: [
            {
              type: 'input',
              block_id: 'q_block',
              label: { type: 'plain_text', text: 'Your question' },
              element: {
                type: 'plain_text_input',
                action_id: 'q_input',
                multiline: true,
                placeholder: { type: 'plain_text', text: 'Type your question…' },
                min_length: 5
              }
            },
            {
              type: 'input',
              block_id: 'assignee_block',
              label: { type: 'plain_text', text: 'Assign to' },
              element: {
                type: 'static_select',
                action_id: 'assignee_select',
                placeholder: { type: 'plain_text', text: 'Choose a person' },
                options: [
                  { text: { type: 'plain_text', text: 'Pedram' }, value: 'Pedram' },
                  { text: { type: 'plain_text', text: 'Jeff' }, value: 'Jeff' },
                  { text: { type: 'plain_text', text: 'Daniel' }, value: 'Daniel' },
                  { text: { type: 'plain_text', text: 'Spencer' }, value: 'Spencer' },
                  { text: { type: 'plain_text', text: 'Marilynn' }, value: 'Marilynn' },
                  { text: { type: 'plain_text', text: 'Saeid' }, value: 'Saeid' },
                  { text: { type: 'plain_text', text: 'Other' }, value: 'Other' }
                ]
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error opening question modal:', error);
      throw error;
    }
  },

  /**
   * Parses the submission data from the modal
   * @param viewPayload - The view payload from the modal submission
   * @returns Parsed question data
   */
  parseQuestionSubmission(viewPayload: any) {
    try {
      const values = viewPayload.view?.state?.values;
      
      if (!values) {
        throw new Error('No values found in view payload');
      }
      
      const question = values.q_block?.q_input?.value;
      const assignee = values.assignee_block?.assignee_select?.selected_option?.value;

      return {
        question: question || '',
        assignee: assignee || '',
        userId: viewPayload.user?.id,
        teamId: viewPayload.team?.id,
        submissionTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing question submission:', error);
      throw new Error('Failed to parse question submission data');
    }
  },

  /**
   * Sends a confirmation message after successful question submission
   * @param userId - The user ID who submitted the question
   * @param questionData - The parsed question data
   * @returns Promise with the API response
   */
  async sendSubmissionConfirmation(userId: string, questionData: { question: string; assignee: string; month_year: string }) {
    try {
      // Open a DM with the user
      const dm = await slack.conversations.open({ users: userId });
      const channel = dm.channel?.id;

      if (!channel) {
        throw new Error('Failed to open DM channel');
      }

      return await slack.chat.postMessage({
        channel,
        text: '✅ Question submitted successfully!',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '✅ Question Submitted!'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `The question has been successfully submitted for the upcoming All-Hands meeting (${questionData.month_year}).\n\n*Question:*\n> ${questionData.question}\n\n*Assigned to:* ${questionData.assignee}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: '🔒 Your submission is completely anonymous and will be addressed during the meeting. We do not store any relationship between your user and the question.'
              }
            ]
          }
        ]
      });
    } catch (error) {
      console.error('Error sending submission confirmation:', error);
      throw error;
    }
  },

  /**
   * Sends an error message if question submission fails
   * @param userId - The user ID who attempted to submit
   * @param errorMessage - The error message to display
   * @returns Promise with the API response
   */
  async sendSubmissionError(userId: string, errorMessage: string = 'Failed to submit question') {
    try {
      // Open a DM with the user
      const dm = await slack.conversations.open({ users: userId });
      const channel = dm.channel?.id;

      if (!channel) {
        throw new Error('Failed to open DM channel');
      }

      return await slack.chat.postMessage({
        channel,
        text: '❌ Question submission failed',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '❌ Submission Failed'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Sorry, we couldn't submit your question.\n\n*Error Message:*\n> ${errorMessage}\n\nPlease try again or contact support if the problem persists.`
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error sending submission error message:', error);
      throw error;
    }
  }
};
