import { Question } from '@/types/supabase';

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
        throw new Error('Failed to delete question');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in QuestionService.deleteQuestion:', error);
      throw error;
    }
  },
}; 