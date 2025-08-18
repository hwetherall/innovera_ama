interface RequestTypeResponse {
    request_type: string;
    month_year?: string;
}

async function callOpenRouter(prompt: string, model: string): Promise<any>{
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
  }
 
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response content received');
  }
  
  return JSON.parse(content);
}

export const SlackAiBotService = {
    /**
     * Sends a message announcing that a new All-Hands session is open for questions
     * @param message - The request from the user
     * @returns Promise with the API response
     */
    async defineRequestType(message: string, lastMessage: string): Promise<RequestTypeResponse | null> {
        try {
            const prompt = `
You are a helpful assistant that can help users with their requests. You will be given a message from a user and the previuos message in the conversation. 
You will need to determine the type of request the user is making.
The request can be one of the following types:
- Ask about what the bot can do: If the user is asking about the bot's capabilities. RETURN {"request_type": "what_can_do"}
- Ask for a specific all hands session records with month_year: If the user is asking for a specific all hands session records and has provided the month and year for when the session was held. RETURN {"request_type": "get_session_records", month_year: "Month Year"}.
- Ask for a specific all hands session records without month_year: If the user is asking for a specific all hands session records and has not provided the month and year for when the session was held. RETURN {"request_type": "get_session_records"}.
- Submit a question for the open all hands session: If the user wants to submit a question for the open all hands session. RETURN {"request_type": "submit_question"}.
- Ask Anything: If the user is asking a question about the company or team. RETURN {"request_type": "ask_anything"}.
- Outside the scope of the bot: If the user is asking about anything outside the scope above. RETURN {"request_type": "outside_scope"}.

## INSTRUCTIONS:
- Compare the last message in the conversation with the current message.
- Determine if they are related. If so, output the same request type as the last message. If not, determine the request type based only on the current message, following the rules above.

## LAST MESSAGE ([Sender] Message | Type: Type):
${lastMessage}

## USER MESSAGE:
${message}
        
## OUTPUT FORMAT:
- If the request is {"request_type": "get_session_records", month_year: "Month Year"} please format the month and year as "Full Month Year" (e.g. "June 2025").
- Format your response as a JSON object with the format defined in each case. Verify that the OUTPUT FORMAT is correct and that the JSON is properly formatted. Only return the JSON object, nothing else.
        `;
        
            const response = await callOpenRouter(prompt, 'openai/gpt-oss-20b') as RequestTypeResponse;
            
            // Basic validation
            if (response?.request_type) {
                return response;
            }
            
            throw new Error('Malformed AI response');

        } catch (error) {
            console.error('Error in defineRequestType:', error);
            return null
          }
    },

    async replyWhatCanDo(message: string): Promise<string | null> {

      try {
        const prompt = `
You are a helpful assistant that can help users with their requests. The user is asking about the bot's capabilities. You will reply to his question considering the CONTEXT. Remember: Your goal is to answer the user about the bot's capabilities, nothing else.

## CONTEXT:
You are Innovera’s internal Slack bot assistant. Your purpose is to help employees with company-related questions within your defined scope. 

Allowed capabilities:
- Receive anonymous employee questions for the next monthly All-Hands meeting.
- Provide the full list of questions and answers from a past All-Hands meeting.
- Answer company and team-related questions by analyzing past Q&As and All-Hands transcripts (from May 2025 onward).
Your knowledge dates back to May 2025.

Anything outside the above scope is not allowed and you will reply with a message saying that you are not able to help with that. Anna Hardy is our Operations Manager and she may be able to provide further support with operations questions that are outside the scope of this bot.

### Language rules:
- Always respond in a friendly, professional, and concise manner appropriate for workplace communication.
- Never use slang, curse words, or offensive language.
- Prioritize replying in bullet points if it fits the response.
        
## USER MESSAGE:
${message}
        
## OUTPUT FORMAT:
Format your response as a JSON object with the format:
{ 
  response: "Your response to the user's question about the bot's capabilities"
}

Verify that the OUTPUT FORMAT is correct and that the JSON is properly formatted. Only return the JSON object, nothing else.`

        const response = await callOpenRouter(prompt, 'openai/gpt-oss-20b');

        // Basic validation
        if (response?.response) {
          return response.response;
        }

        throw new Error('Malformed AI response');

    }  catch (error) {
        console.error('Error in replyWhatCanDo:', error);
        return null
    }
  }
};