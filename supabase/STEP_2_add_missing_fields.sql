-- STEP 2: Add missing fields to transactions
-- ONLY run this if STEP 1 showed that fields are missing!
-- This will NOT delete your data

-- Add account_type field
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'dutch' 
CHECK (account_type IN ('dutch', 'spanish', 'other'));

-- Add is_transfer field
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_income field
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_income BOOLEAN NOT NULL DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON transactions(user_id, account_type);
CREATE INDEX IF NOT EXISTS idx_transactions_is_transfer ON transactions(is_transfer);
CREATE INDEX IF NOT EXISTS idx_transactions_is_income ON transactions(is_income);

SELECT 'Fields added successfully! ✅ Now run STEP_3' as result;
