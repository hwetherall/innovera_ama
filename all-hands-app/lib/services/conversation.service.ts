import { CustomerConversation, CustomerConversationInsert } from '@/types/supabase';

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
}; 