import { Session, SessionInsert, SessionUpdate, Question, QuestionInsert, Answer } from '@/types/supabase';
import { AIService } from './ai.service';
import { Question as AIQuestion } from '@/types/ai-generation';
import { TranscriptService } from './transcript.service';
import { AnswerService } from './answer.service';
import { QuestionService } from './question.service';

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
  },

  /**
   * Generate answers for all questions in a session using AI
   * @param sessionId Session ID
   * @returns Promise with the generated answers
   */
  async answerSession(sessionId: string): Promise<Answer[]> {
    try {
      // Get session questions
      const questions = await this.getSessionQuestions(sessionId);
      
      // Get session transcript using TranscriptService
      const transcripts = await TranscriptService.getTranscripts(sessionId);

      if (transcripts.length === 0) {
        throw new Error('No transcript found for this session');
      }

      // Get the returned transcript
      const sessionTranscript = transcripts[0];

      // Format questions for AI processing
      const aiQuestions: AIQuestion[] = questions.map(q => ({
        id: q.id,
        question: q.question_text,
        assignedTo: q.assigned_to
      }));

      // Generate answers using AI
      const aiAnswers = await AIService.generateAnswers(sessionTranscript.content, aiQuestions);

      // Process each answer
      const answers: Answer[] = [];
      for (const question of questions) {
        // Find the AI-generated answer for this question
        const aiAnswer = aiAnswers.find(a => a.question_id === question.id);
        
        if (!aiAnswer) {
          console.warn(`No answer generated for question ${question.id}`);
          continue;
        }

        // Delete existing answer if any (and mark question as not answered)
        if (question.is_answered) {
          try {
            await AnswerService.deleteAnswer(question.id);
          } catch (error) {
            console.warn(`Failed to delete answer for question ${question.id} and update question:`, error);
          }
        }

        // Create new answer
        try {
          const answer = await AnswerService.createAnswer(question.id, {
            answer_text: aiAnswer.answer_text,
            confidence_score: aiAnswer.confidence_score,
          });    
          answers.push(answer);
        } catch (error) {
          // Don't log here, just re-throw with more context
          throw new Error(`Failed to save answer for question ${question.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      console.log("RETURNED ANSWERS TO createTranscriptAndAnswerSession:", answers)
      return answers;
    } catch (error) {
      // Only log at this level if it's not already a formatted error
      if (!(error instanceof Error && error.message.includes('Failed to save answer for question'))) {
        console.error('Error in SessionService.answerSession:', error);
      }
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred while answering session');
    }
  },

  /**
   * Get all answers for a session
   * @param id Session ID
   * @returns Promise with the session's answers
   */
  async getSessionAnswers(id: string): Promise<Answer[]> {
    try {
      const response = await fetch(`/api/sessions/${id}/answers`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch answers for session ${id}: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      return data.answers;
    } catch (error) {
      // Only log at this level if it's not already a formatted error
      if (!(error instanceof Error && error.message.includes('Failed to fetch answers'))) {
        console.error('Error in SessionService.getSessionAnswers:', error);
      }
      throw error;
    }
  }
}; 