import { Answer, AnswerInsert } from '@/types/supabase';

/**
 * Service for handling answer-related operations
 */
export const AnswerService = {
  /**
   * Delete an answer for a question
   * @param id Question ID
   * @returns Promise with success status
   */
  async deleteAnswer(id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/questions/${id}/answer`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete answer ${id} and update question: ${errorData.error || 'Unknown error'}`);
      }
      
      return { success: true };
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('Failed to delete answer'))) {
        console.error('Error in AnswerService.deleteAnswer:', error);
      }
      throw error;
    }
  },

  /**
   * Create a new answer for a question
   * @param questionId Question ID
   * @param answerData Answer data to create
   * @returns Promise with created answer
   */
  async createAnswer(questionId: string, answerData: AnswerInsert): Promise<Answer> {
    try {
      const response = await fetch(`/api/questions/${questionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create answer for question ${questionId}: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      return data.answer;
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('Failed to create answer'))) {
        console.error('Error in AnswerService.createAnswer:', error);
      }
      throw error;
    }
  },
}; 