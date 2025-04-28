import { Question, QuestionUpdate } from '@/types/supabase';

/**
 * Service for handling question-related operations
 */
export const QuestionService = {
  /**
   * Delete a question by ID
   * @param id Question ID
   * @returns Promise with success status
   */
  async deleteQuestion(id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete question ${id}: ${errorData.error || 'Unknown error'}`);
      }
      
      return { success: true };
    } catch (error) {
      // Only log at this level if it's not already a formatted error
      if (!(error instanceof Error && error.message.includes('Failed to delete question'))) {
        console.error('Error in QuestionService.deleteQuestion:', error);
      }
      throw error;
    }
  },

  /**
   * Update a question by ID
   * @param id Question ID
   * @param questionData Question data to update (can be partial)
   * @returns Promise with updated question
   */
  async updateQuestion(id: string, questionData: QuestionUpdate): Promise<Question> {
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update question ${id}: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      return data.question;
    } catch (error) {
      // Only log at this level if it's not already a formatted error
      if (!(error instanceof Error && error.message.includes('Failed to update question'))) {
        console.error('Error in QuestionService.updateQuestion:', error);
      }
      throw error;
    }
  },
}; 