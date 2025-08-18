-- Table to store Slack scheduled message IDs
CREATE TABLE IF NOT EXISTS slack_scheduled_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('week_before', 'same_day')),
  slack_scheduled_message_id TEXT NOT NULL,
  slack_channel_id TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to sessions table with CASCADE delete
  -- When a session is deleted, all its scheduled messages are automatically deleted
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate message types per session
  UNIQUE(session_id, message_type)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_slack_scheduled_messages_session_id 
ON slack_scheduled_messages (session_id);

CREATE INDEX IF NOT EXISTS idx_slack_scheduled_messages_slack_id 
ON slack_scheduled_messages (slack_scheduled_message_id);

-- Grant permissions
GRANT ALL ON slack_scheduled_messages TO authenticated, service_role;

