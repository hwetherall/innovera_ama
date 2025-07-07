import { AIAnswer, OpenRouterResponse } from '@/types/ai-generation';


// Helper function to process a single question
export async function processQuestion(
    question: { id: string; question: string; assignedTo: string },
    transcript: string,
    apiKey: string
  ): Promise<AIAnswer> {
    const prompt = `
  You are analyzing a transcript from a company all-hands meeting to answer a specific question.
  Please find the answer to this question in the transcript and generate a confidence score between 0-1 indicating how confident you are in the answer, hence, with how much certainty you can say that the answer is correct. A score of 0 means you are not confident at all in the answer, and a score of 1 means you are very confident in the answer. If the question wasn't answered in the transcript, return a score that reflects how confident you are that the question wasn't answered.
  
  ## GUIDELINES:
  
  1. You should prioritize excerpts from the person assigned to the question but not limit your answer to that person's excerpts. IF the transcript doesn't discriminate between people, consider all information in the transcript as having the same relevance. 
  2. The question might be direclty mentioned in the transcript, if so, give higher priority to the text near the question. 
  3. Consider that the transcript was generated automatically from a live meeting, so grammar mistakes and other issues may exist.
  4. If the question wasn't answered in the transcript, return "There was not enough information in the transcript to answer this question".
  
  
  ## QUESTION:
  ${question.question}
  (Asked to: ${question.assignedTo})
  
  ## TRANSCRIPT CONTENT:
  ${transcript}
  
  ## OUTPUT FORMAT:
  Format your response as a JSON object with the following fields:
  {
    "answer_text": "The extracted answer here, or 'This question was not addressed in the transcript' if not found",
    "confidence_score": 0.95 // Score between 0-1 indicating how well the answer addresses the question
  }
  
  Verify that the OUTPUT FORMAT is correct and that the JSON is properly formatted. Only return the JSON object, nothing else.
  `;
  
    // Create AbortController for individual request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds max per request (they run in parallel)
  
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4.1-mini',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
      }
  
      const data = await response.json() as OpenRouterResponse;
      const content = data.choices[0].message.content;
      
      // Parse the JSON response
      const parsedResponse = JSON.parse(content);
  
      // Construct the answer object with the original question ID
      return {
        question_id: question.id,
        answer_text: parsedResponse.answer_text,
        confidence_score: parsedResponse.confidence_score
      };
  
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Log the error with question context
      console.error(`Error processing question ${question.id} (${question.question.substring(0, 50)}...):`, error);
      
      // Throw the error to fail the entire request (all-or-nothing)
      throw error;
    }
  }