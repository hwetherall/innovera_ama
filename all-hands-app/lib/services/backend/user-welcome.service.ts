import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Service for managing user welcome status
 */
export const UserWelcomeService = {
  /**
   * Check if a Slack user has been welcomed
   * @param slackUserId Slack user ID
   * @returns Promise<boolean> true if user has been welcomed
   */
  async hasBeenWelcomed(slackUserId: string): Promise<boolean> {
    try {
      const supabase = createServerSupabaseClient();
      
      const { data, error } = await supabase
        .rpc('has_been_welcomed', { p_slack_user_id: slackUserId });
      
      if (error) {
        console.error('Error checking welcome status:', error);
        return false; // Default to not welcomed on error
      }
      
      return data === true;
    } catch (error) {
      console.error('Error in UserWelcomeService.hasBeenWelcomed:', error);
      return false; // Default to not welcomed on error
    }
  },

  /**
   * Mark a Slack user as welcomed
   * @param slackUserId Slack user ID
   * @returns Promise<boolean> true if successfully marked
   */
  async markWelcomed(slackUserId: string): Promise<boolean> {
    try {
      const supabase = createServerSupabaseClient();
      
      const { error } = await supabase
        .rpc('mark_user_welcomed', { p_slack_user_id: slackUserId });
      
      if (error) {
        console.error('Error marking user as welcomed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in UserWelcomeService.markWelcomed:', error);
      return false;
    }
  },

  /**
   * Get all welcomed users (for admin purposes)
   * @returns Promise<Array> list of welcomed users
   */
  async getWelcomedUsers(): Promise<any[]> {
    try {
      const supabase = createServerSupabaseClient();
      
      const { data, error } = await supabase
        .from('user_welcome_status')
        .select('*')
        .order('welcomed_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching welcomed users:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in UserWelcomeService.getWelcomedUsers:', error);
      return [];
    }
  }
};
