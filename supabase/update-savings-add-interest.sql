-- Add interest rate fields to savings_accounts table

ALTER TABLE savings_accounts 
ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS interest_type TEXT DEFAULT 'manual' CHECK (interest_type IN ('fixed', 'variable', 'manual')),
ADD COLUMN IF NOT EXISTS interest_payment_frequency TEXT DEFAULT 'annual' CHECK (interest_payment_frequency IN ('monthly', 'quarterly', 'annual')),
ADD COLUMN IF NOT EXISTS fixed_rate_end_date DATE,
ADD COLUMN IF NOT EXISTS last_interest_calculation_date DATE;

COMMENT ON COLUMN savings_accounts.interest_rate IS 'Annual interest rate as decimal (e.g., 0.026 for 2.6%)';
COMMENT ON COLUMN savings_accounts.interest_type IS 'fixed = auto-calculate with fixed rate, variable = manually enter each time, manual = no auto-calculation';
COMMENT ON COLUMN savings_accounts.interest_payment_frequency IS 'How often interest is paid out';
COMMENT ON COLUMN savings_accounts.fixed_rate_end_date IS 'Date when fixed rate expires (e.g., 2048-02-12)';
COMMENT ON COLUMN savings_accounts.last_interest_calculation_date IS 'Last date interest was calculated/paid';

-- Add interest entry type
ALTER TABLE savings_entries DROP CONSTRAINT IF EXISTS savings_entries_entry_type_check;
ALTER TABLE savings_entries ADD CONSTRAINT savings_entries_entry_type_check 
  CHECK (entry_type IN ('balance', 'deposit', 'withdrawal', 'interest'));
