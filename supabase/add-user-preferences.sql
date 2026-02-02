-- Create user_preferences table for app settings

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Current Account Starting Balance
  current_account_starting_balance DECIMAL(12, 2) DEFAULT 0,
  current_account_starting_date DATE,
  
  -- Other preferences can be added here in the future
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One preference row per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

COMMENT ON TABLE user_preferences IS 'User-specific app settings and preferences';
COMMENT ON COLUMN user_preferences.current_account_starting_balance IS 'Starting balance of checking account before transaction tracking began';
COMMENT ON COLUMN user_preferences.current_account_starting_date IS 'Date of the starting balance snapshot';
