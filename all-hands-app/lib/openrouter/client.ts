// OpenRouter API client for sending requests to various AI models

// Function to extract answers from a transcript based on questions
export async function extractAnswersFromTranscript(
    transcript: string,
    questions: { id: string; question: string; assignedTo: string }[]
  ) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }
  
    // Format the prompt for the AI
    const prompt = `
  You are analyzing a transcript from a company all-hands meeting. 
  Below are questions that were submitted before the meeting, and the full transcript.
  
  Please find the answers to each question in the transcript.
  If a question wasn't answered in the transcript, indicate that.
  For each question, provide:
  1. The answer from the transcript (direct quotes when possible)
  2. A confidence score (0-1) of how well the answer addresses the question
  
  QUESTIONS:
  ${questions.map(q => `ID: ${q.id}
  Question: ${q.question}
  Assigned to: ${q.assignedTo}`).join('\n\n')}
  
  TRANSCRIPT:
  ${transcript}
  
  FORMAT YOUR RESPONSE AS JSON:
  {
    "answers": [
      {
        "question_id": "question_id_here",
        "answer_text": "The extracted answer here...",
        "confidence_score": 0.95
      },
      ...
    ]
  }
  `;
  
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://all-hands-app.vercel.app', // Replace with your actual domain
          'X-Title': 'All Hands Q&A App'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku-20240307', // Default model, can be configured
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
      const content = data.choices[0].message.content;
      
      // Parse the JSON response
      const parsedResponse = JSON.parse(content);
      return parsedResponse.answers;
    } catch (error) {
      console.error('Error extracting answers:', error);
      throw error;
    }
  }
  
  // Function for the "Ask Anything" feature
  export async function askAnything(question: string, transcripts: { id: string; content: string; month_year: string }[]) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }
  
    // Sort transcripts by date (newest first)
    const sortedTranscripts = [...transcripts].sort((a, b) => {
      // Convert month_year (e.g., "April 2024") to a comparable date value
      const dateA = new Date(a.month_year);
      const dateB = new Date(b.month_year);
      return dateB.getTime() - dateA.getTime();
    });
  
    // Format all transcripts into one context
    // More recent transcripts are prioritized by putting them first
    const transcriptContext = sortedTranscripts.map(t => 
      `MEETING DATE: ${t.month_year}\n${t.content}\n\n`
    ).join('---\n\n');
  
    const prompt = `
  You are answering questions based on transcripts from company all-hands meetings.
  The user's question is: "${question}"
  
  Please answer based ONLY on information found in these meeting transcripts.
  More recent meetings (listed first) should be given higher relevance.
  
  If you can't find a clear answer in any transcript, respond with: "I don't have enough information to answer this question confidently. This would be a great question to ask in the next all-hands meeting."
  
  TRANSCRIPTS:
  ${transcriptContext}
  
  Your answer should be helpful, concise, and based only on information in the transcripts.
  Also provide the meeting dates where you found the information in your answer.
  
  FORMAT YOUR RESPONSE AS JSON:
  {
    "answer": "Your comprehensive answer here...",
    "sources": ["April 2025", "March 2025"],
    "confidence": 0.85
  }
  `;
  
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://all-hands-app.vercel.app', // Replace with your actual domain
          'X-Title': 'All Hands Q&A App'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku-20240307', // Default model, can be configured
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
      const content = data.choices[0].message.content;
      
      // Parse the JSON response
      const parsedResponse = JSON.parse(content);
      return parsedResponse;
    } catch (error) {
      console.error('Error in askAnything:', error);
      throw error;
    }
  }