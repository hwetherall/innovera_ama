import { ConversationNote, ConversationNoteInsert } from '@/types/supabase';

export const ConversationNoteService = {
  async getAllNotes(): Promise<[]> {
    return [];
  },

  async createNote(note: ConversationNoteInsert): Promise<ConversationNote> {
    try {
      const res = await fetch('/api/conversation-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (!res.ok) {
        throw new Error('Failed to create conversation note');
      }
      return await res.json();
    } catch (err) {
      throw new Error(`Error creating conversation note: ${err instanceof Error ? err.message : err}`);
    }
  },

  async deleteNote(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/conversation-notes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete conversation note');
      }
    } catch (err) {
      throw new Error(`Error deleting conversation note: ${err instanceof Error ? err.message : err}`);
    }
  },
}; 