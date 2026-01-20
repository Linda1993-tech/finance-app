-- Add is_income field to transactions table
-- Only transactions explicitly marked as income count toward income totals

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_income BOOLEAN NOT NULL DEFAULT FALSE;

-- Create an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_transactions_is_income ON transactions(is_income);

-- Add comment for documentation
COMMENT ON COLUMN transactions.is_income IS 'TRUE if this is real income (salary, gifts, etc). FALSE for reimbursements, split bills, etc.';

