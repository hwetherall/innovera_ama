import { CustomerConversation, CustomerConversationInsert, CustomerConversationUpdate, CustomerConversationWithSummary } from '@/types/supabase';

export const ConversationService = {
  
  async getAllConversations(companyId: string): Promise<CustomerConversation[]> {
    try {
      const res = await fetch(`/api/companies/${companyId}/customer-conversations`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch conversations');
      }
      return await res.json();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to fetch conversations';
      throw new Error(errMsg);
    }
  },

  async getAllConversationsWithSummary(companyId: string): Promise<CustomerConversationWithSummary[]> {
    try {
      const res = await fetch(`/api/companies/${companyId}/customer-conversations?withSummary=true`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch conversations with summary');
      }
      return await res.json();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to fetch conversations with summary';
      throw new Error(errMsg);
    }
  },

  async createConversation(companyId: string, conversation: CustomerConversationInsert): Promise<CustomerConversation> {
    try {
      const res = await fetch(`/api/companies/${companyId}/customer-conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversation),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create conversation');
      }
      return await res.json();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to create conversation';
      throw new Error(errMsg);
    }
  },

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const res = await fetch(`/api/customer-conversations/${conversationId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete conversation');
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to delete conversation';
      throw new Error(errMsg);
    }
  },

  async updateConversation(conversationId: string, updateData: CustomerConversationUpdate): Promise<CustomerConversation> {
    try {
      const res = await fetch(`/api/customer-conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update conversation');
      }
      return await res.json();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to update conversation';
      throw new Error(errMsg);
    }
  },
}; 