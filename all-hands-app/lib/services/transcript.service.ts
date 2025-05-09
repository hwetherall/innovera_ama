import { TranscriptInsert, Transcript } from '@/types/supabase';
import { SessionService } from './session.service';

interface PDFInfo {
  pages: number;
  info: {
    [key: string]: string | number | boolean;
  };
}

/**
 * Service for handling transcript-related operations
 */
export class TranscriptService {

  /**
   * Extract text from a PDF file using the server-side endpoint
   * @param file The PDF file to extract text from
   * @returns The extracted text and metadata
   */
  static async extractTextFromPDF(file: File): Promise<{ text: string; pages: number; info: PDFInfo }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract text from PDF');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in extractTextFromPDF:', error);
      throw error;
    }
  }

  /**
   * Get transcripts from the database
   * @param sessionId Optional session ID to filter transcripts
   * @returns Promise with transcripts data
   */
  static async getTranscripts(sessionId?: string): Promise<Transcript[]> {
    try {
      let url = '/api/transcripts';
      if (sessionId) {
        url += `?session_id=${sessionId}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transcripts');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in TranscriptService.getTranscripts:', error);
      throw error;
    }
  }

  /**
   * Create a new transcript
   * @param transcriptData The transcript data to create
   * @returns The created transcript
   * @throws Error if transcript creation or answer generation fails
   */
  static async createTranscript(transcriptData: TranscriptInsert): Promise<Transcript> {
    try {
      // Create the transcript
      const transcriptResponse = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transcriptData),
      });

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json();
        throw new Error(errorData.error || 'Failed to create transcript');
      }

      const createdTranscript = await transcriptResponse.json();

      return createdTranscript;
    } catch (error) {
      console.error('Error in transcript creation process:', error);
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred during transcript creation');
    }
  }

  /**
   * Delete a transcript from the database
   * @param id The ID of the transcript to delete
   * @returns Promise with success status
   * @throws Error if deletion fails
   */
  static async deleteTranscript(id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`/api/transcripts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete transcript ${id}: ${errorData.error || 'Unknown error'}`);
      }

      return { success: true };
    } catch (error) {
      // Only log at this level if it's not already a formatted error
      if (!(error instanceof Error && error.message.includes('Failed to delete transcript'))) {
        console.error('Error in TranscriptService.deleteTranscript:', error);
      }
      throw error;
    }
  }

  /**
   * Create a new transcript and triggers answer generation
   * @param transcriptData The transcript data to create
   * @returns The created transcript
   * @throws Error if transcript creation or answer generation fails
   */
  static async createTranscriptAndAnswerSession(transcriptData: TranscriptInsert): Promise<Transcript> {
    if (!transcriptData.session_id) {
      throw new Error('Session ID is required');
    }

    try {
      // Create the transcript
      const transcriptResponse = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transcriptData),
      });

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json();
        throw new Error(errorData.error || 'Failed to create transcript');
      }

      const createdTranscript = await transcriptResponse.json();
      const createdTranscriptId = createdTranscript.id;

      try {
        // Generate answers and wait for the result
        const answers = await SessionService.answerSession(transcriptData.session_id);
        
        if (!answers || answers.length === 0) {
          throw new Error('Empty answers array. No answers were generated');
        }
          
        // Update session status to completed only if answers were generated
        await SessionService.updateSession(transcriptData.session_id, {
          status: 'completed'
        });
      
      } catch (error) {
        // Log the error with context but don't re-throw yet
        console.error('Error during answer generation:', error);
      
        // Delete the transcript if answer generation fails
        try {
          await this.deleteTranscript(createdTranscriptId);
        } catch (deleteError) {
          console.error('Error while deleting transcript after answer generation error:', deleteError);
        }
        
        // Re-throw the original error with more context
        throw new Error(`Failed to generate answers for transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return createdTranscript;
    } catch (error) {
      // Only log at this level if it's not already a formatted error
      if (!(error instanceof Error && error.message.includes('Failed to generate answers for transcript'))) {
        console.error('Error in transcript creation process:', error);
      }
      throw error instanceof Error 
        ? error 
        : new Error('An unexpected error occurred during transcript creation');
    }
  }

}
 