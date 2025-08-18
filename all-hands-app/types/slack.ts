export interface SlackRequestHeaders {
  'x-slack-signature': string;
  'x-slack-request-timestamp': string;
}

export interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: Array<{
    type: string;
    [key: string]: unknown;
  }>;
  attachments?: Array<{
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface SlackApiResponse {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface SlackMessageResponse extends SlackApiResponse {
  channel: string;
  ts: string;
  message: {
    [key: string]: unknown;
  };
}

export interface SlackEventPayload {
  token: string;
  team_id?: string;
  api_app_id?: string;
  event?: {
    type: string;
    event_ts: string;
    user?: string;
    channel?: string;
    channel_type?: string;
    text?: string;
    ts?: string;
    tab?: string;
    view?: {
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  type: string;
  event_id?: string;
  event_time?: number;
  authorizations?: Array<{
    enterprise_id: string | null;
    team_id: string;
    user_id: string;
    is_bot: boolean;
    is_enterprise_install: boolean;
  }>;
  is_ext_shared_channel?: boolean;
  event_context?: string;
  challenge?: string; // For url_verification events
}

export interface SlackInteractionPayload {
  type: string;
  user: {
    id: string;
    username?: string;
    name?: string;
    team_id: string;
  };
  api_app_id: string;
  token: string;
  container?: {
    type: string;
    [key: string]: unknown;
  };
  trigger_id?: string;
  team: {
    id: string;
    domain: string;
  };
  enterprise?: {
    id: string;
    name: string;
  } | null;
  is_enterprise_install?: boolean;
  channel?: {
    id: string;
    name?: string;
  };
  message?: {
    [key: string]: unknown;
  };
  view?: {
    id: string;
    team_id: string;
    type: string;
    [key: string]: unknown;
  };
  response_url?: string;
  actions?: Array<{
    action_id: string;
    block_id?: string;
    text?: {
      type: string;
      text: string;
      emoji?: boolean;
    };
    value?: string;
    type: string;
    action_ts: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}