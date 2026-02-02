-- Add account_type to transactions to distinguish between different checking accounts

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'dutch' CHECK (account_type IN ('dutch', 'spanish', 'other'));

CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON transactions(user_id, account_type);

COMMENT ON COLUMN transactions.account_type IS 'Which checking account this transaction belongs to (dutch = ING NL, spanish = ING ES)';
