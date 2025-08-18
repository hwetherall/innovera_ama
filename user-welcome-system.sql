-- Create table to track user welcome status
CREATE TABLE IF NOT EXISTS user_welcome_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slack_user_id TEXT NOT NULL UNIQUE,
  welcomed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_welcome_slack_user_id 
ON user_welcome_status (slack_user_id);

-- Function to check if user has been welcomed
CREATE OR REPLACE FUNCTION has_been_welcomed(p_slack_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_welcome_status 
    WHERE slack_user_id = p_slack_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark user as welcomed
CREATE OR REPLACE FUNCTION mark_user_welcomed(p_slack_user_id TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO user_welcome_status (slack_user_id)
  VALUES (p_slack_user_id)
  ON CONFLICT (slack_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON user_welcome_status TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION has_been_welcomed TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_user_welcomed TO authenticated, service_role;
