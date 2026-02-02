-- Add is_pension flag to distinguish pension accounts from regular savings

ALTER TABLE savings_accounts 
ADD COLUMN IF NOT EXISTS is_pension BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN savings_accounts.is_pension IS 'True for pension accounts (not accessible until retirement), false for regular savings';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_savings_accounts_is_pension ON savings_accounts(user_id, is_pension);
