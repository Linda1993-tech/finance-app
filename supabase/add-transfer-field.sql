-- Add is_transfer field to transactions table
-- Transfers are movements between own accounts (not real income/expense)

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN NOT NULL DEFAULT FALSE;

-- Create an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_transactions_is_transfer ON transactions(is_transfer);

-- Add comment for documentation
COMMENT ON COLUMN transactions.is_transfer IS 'TRUE if this is a transfer between own accounts (not counted as income/expense)';

