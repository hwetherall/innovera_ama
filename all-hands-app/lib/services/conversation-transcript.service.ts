import { ConversationTranscript, ConversationTranscriptInsert } from '@/types/supabase';

export const ConversationTranscriptService = {
  async getAllTranscripts(): Promise<[]> {
    return [];
  },

  async createTranscript(transcript: ConversationTranscriptInsert): Promise<ConversationTranscript> {
    try {
      const res = await fetch('/api/conversation-transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transcript),
      });
      if (!res.ok) {
        throw new Error('Failed to create conversation transcript');
      }
      return await res.json();
    } catch (err) {
      throw new Error(`Error creating conversation transcript: ${err instanceof Error ? err.message : err}`);
    }
  },

  async deleteTranscript(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/conversation-transcripts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete conversation transcript');
      }
    } catch (err) {
      throw new Error(`Error deleting conversation transcript: ${err instanceof Error ? err.message : err}`);
    }
  },
}; 