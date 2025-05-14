import { ConversationSummary, ConversationSummaryInsert, ConversationSummaryUpdate } from '@/types/supabase';

export const ConversationSummaryService = {
  async getSummary(conversationId: string): Promise<ConversationSummary | null> {
    try {
      const res = await fetch(`/api/customer-conversations/${conversationId}/summary`);
      if (!res.ok) {
        throw new Error('Failed to fetch conversation summary');
      }
      return await res.json();
    } catch (err) {
      throw new Error(`Error fetching conversation summary: ${err instanceof Error ? err.message : err}`);
    }
  },

  async createSummary(conversationId: string, summary: ConversationSummaryInsert): Promise<ConversationSummary> {
    try {
      const res = await fetch(`/api/customer-conversations/${conversationId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary),
      });
      if (!res.ok) {
        throw new Error('Failed to create conversation summary');
      }
      return await res.json();
    } catch (err) {
      throw new Error(`Error creating conversation summary: ${err instanceof Error ? err.message : err}`);
    }
  },

  async updateSummary(conversationId: string, summary: ConversationSummaryUpdate): Promise<ConversationSummary> {
    try {
      const res = await fetch(`/api/customer-conversations/${conversationId}/summary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary),
      });
      if (!res.ok) {
        throw new Error('Failed to update conversation summary');
      }
      return await res.json();
    } catch (err) {
      throw new Error(`Error updating conversation summary: ${err instanceof Error ? err.message : err}`);
    }
  },

  async deleteSummary(conversationId: string): Promise<void> {
    try {
      const res = await fetch(`/api/customer-conversations/${conversationId}/summary`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete conversation summary');
      }
    } catch (err) {
      throw new Error(`Error deleting conversation summary: ${err instanceof Error ? err.message : err}`);
    }
  },
}; 