/**
 * Lightweight Slack client for Edge Runtime compatibility
 * Only includes methods we actually use, avoiding Node.js dependencies
 */

interface SlackResponse {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

interface ChatPostMessageArgs {
  channel: string;
  text: string;
  blocks?: any[];
  metadata?: any;
}

interface ConversationsOpenArgs {
  users: string;
}

interface ConversationsHistoryArgs {
  channel: string;
  limit?: number;
  include_all_metadata?: boolean;
}

interface ViewsOpenArgs {
  trigger_id: string;
  view: any;
}

interface ChatScheduleMessageArgs {
  channel: string;
  text: string;
  post_at: number;
  blocks?: any[];
}

interface ChatDeleteScheduledMessageArgs {
  channel: string;
  scheduled_message_id: string;
}

export class SlackEdgeClient {
  private token: string;
  private baseUrl = 'https://slack.com/api';

  constructor(token: string) {
    this.token = token;
  }

  private async makeRequest(method: string, data: any, httpMethod: 'GET' | 'POST' = 'POST'): Promise<SlackResponse> {
    let url = `${this.baseUrl}/${method}`;
    let body: string | undefined;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
    };

    if (httpMethod === 'GET') {
      // For GET requests, add data as query parameters
      const params = new URLSearchParams();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          params.append(key, String(data[key]));
        }
      });
      url += `?${params.toString()}`;
    } else {
      // For POST requests, send data as JSON body
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const response = await fetch(url, {
      method: httpMethod,
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    // Check if Slack returned an error in the response body
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error || 'Unknown error'}`);
    }

    return result;
  }

  // Chat methods
  chat = {
    postMessage: async (args: ChatPostMessageArgs): Promise<SlackResponse> => {
      return this.makeRequest('chat.postMessage', args, 'POST');
    },

    scheduleMessage: async (args: ChatScheduleMessageArgs): Promise<SlackResponse> => {
      return this.makeRequest('chat.scheduleMessage', args, 'POST');
    },

    deleteScheduledMessage: async (args: ChatDeleteScheduledMessageArgs): Promise<SlackResponse> => {
      return this.makeRequest('chat.deleteScheduledMessage', args, 'POST');
    },
  };

  // Conversations methods
  conversations = {
    open: async (args: ConversationsOpenArgs): Promise<SlackResponse> => {
      return this.makeRequest('conversations.open', args, 'POST');
    },

    history: async (args: ConversationsHistoryArgs): Promise<SlackResponse> => {
      return this.makeRequest('conversations.history', args, 'GET');
    },
  };

  // Views methods (for modals)
  views = {
    open: async (args: ViewsOpenArgs): Promise<SlackResponse> => {
      return this.makeRequest('views.open', args, 'POST');
    },
  };
}

// Export a factory function for consistent usage
export function createSlackClient(token: string): SlackEdgeClient {
  return new SlackEdgeClient(token);
}
