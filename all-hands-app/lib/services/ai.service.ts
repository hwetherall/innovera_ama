import { Question, AIAnswer, AnswerGenerationRequest, AnswerGenerationResponse, AskAnythingResponse, SummaryGenerationRequest, SummaryGenerationResponse } from '@/types/ai-generation';

export class AIService {
  /**
   * Generates answers for a list of questions based on a transcript using AI.
   * @param transcript - The transcript text to analyze
   * @param questions - Array of questions to answer
   * @returns Promise containing the generated answers
   * @throws Error if the request fails
   */
  static async generateAnswers(transcript: string, questions: Question[]): Promise<AIAnswer[]> {
    try {
      const request: AnswerGenerationRequest = {
        transcript,
        questions
      };

      const response = await fetch('/api/ai/answer-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate answers');
      }

      const data = await response.json() as AnswerGenerationResponse;
      return data.answers;
    } catch (error) {
      console.error('Error in generateAnswers:', error);
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred while generating answers');
    }
  }

  /**
   * Calls the /api/ai/ask-anything/all-hands endpoint with a question.
   * @param question - The question to ask
   * @returns Promise containing the answer, sources, and confidence
   */
  static async askAnythingAllHands(question: string): Promise<AskAnythingResponse> {
    try {
      const response = await fetch('/api/ai/ask-anything/all-hands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get answer');
      }

      const data = await response.json() as AskAnythingResponse;
      return data;
    } catch (error) {
      console.error('Error in askAnything:', error);
      throw error instanceof Error
        ? error
        : new Error('An unexpected error occurred while asking the question');
    }
  }

  /**
   * Calls the /api/ai/ask-anything/customer-conversations endpoint with a question.
   * @param question - The question to ask
   * @returns Promise containing the answer, sources, and confidence
   */
  static async askAnythingConversations(question: string): Promise<AskAnythingResponse> {
    try {
      const response = await fetch('/api/ai/ask-anything/customer-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get answer');
      }

      const data = await response.json() as AskAnythingResponse;
      return data;
    } catch (error) {
      console.error('Error in askAnything:', error);
      throw error instanceof Error
        ? error
        : new Error('An unexpected error occurred while asking the question');
    }
  }

  static async generateSummary(request: SummaryGenerationRequest): Promise<SummaryGenerationResponse> {
    try {
      const res = await fetch('/api/ai/summary-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        throw new Error('Failed to generate summary');
      }
      return await res.json();
    } catch (err) {
      throw new Error(`Error generating summary: ${err instanceof Error ? err.message : err}`);
    }
  }
} 