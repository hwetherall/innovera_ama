import { Session, SessionInsert, SessionUpdate, Question, QuestionInsert } from '@/types/supabase';

/**
 * Service for handling session-related operations
 */
export const SessionService = {
  /**
   * Get all sessions
   * @returns Promise with sessions data
   */
  async getAllSessions(): Promise<Session[]> {
    try {
      const response = await fetch('/api/sessions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      
      const data = await response.json();
      return data.sessions;
    } catch (error) {
      console.error('Error in SessionService.getAllSessions:', error);
      throw error;
    }
  },
  
  /**
   * Get a single session by ID
   * @param id Session ID
   * @returns Promise with session data
   */
  async getSessionById(id: string): Promise<Session> {
    try {
      const response = await fetch(`/api/sessions/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      
      const data = await response.json();
      return data.session;
    } catch (error) {
      console.error('Error in SessionService.getSessionById:', error);
      throw error;
    }
  },
  
  /**
   * Create a new session
   * @param sessionData Session data to create
   * @returns Promise with created session
   */
  async createSession(sessionData: SessionInsert): Promise<Session> {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await response.json();
      return data.session;
    } catch (error) {
      console.error('Error in SessionService.createSession:', error);
      throw error;
    }
  },
  
  /**
   * Update a session
   * @param id Session ID
   * @param sessionData Session data to update
   * @returns Promise with updated session
   */
  async updateSession(id: string, sessionData: Partial<SessionUpdate>): Promise<Session> {
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update session');
      }
      
      const data = await response.json();
      return data.session;
    } catch (error) {
      console.error('Error in SessionService.updateSession:', error);
      throw error;
    }
  },
  
  /**
   * Delete a session
   * @param id Session ID
   * @returns Promise with success status
   */
  async deleteSession(id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in SessionService.deleteSession:', error);
      throw error;
    }
  },
  
  /**
   * Get all questions for a session
   * @param sessionId Session ID
   * @returns Promise with questions data
   */
  async getSessionQuestions(sessionId: string): Promise<Question[]> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/questions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch session questions');
      }
      
      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error('Error in SessionService.getSessionQuestions:', error);
      throw error;
    }
  },

  /**
   * Create a new question for a session
   * @param sessionId Session ID
   * @param questionData Question data to create
   * @returns Promise with created question
   */
  async createQuestion(sessionId: string, questionData: QuestionInsert): Promise<Question> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create question');
      }
      
      const data = await response.json();
      return data.question;
    } catch (error) {
      console.error('Error in SessionService.createQuestion:', error);
      throw error;
    }
  }
}; 