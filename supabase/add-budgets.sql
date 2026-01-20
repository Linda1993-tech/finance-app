-- Add budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one budget per category per month (or one overall budget per month if category_id is null)
  UNIQUE(user_id, category_id, month, year)
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own budgets
CREATE POLICY "Users can view own budgets"
  ON budgets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own budgets
CREATE POLICY "Users can insert own budgets"
  ON budgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own budgets
CREATE POLICY "Users can update own budgets"
  ON budgets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own budgets
CREATE POLICY "Users can delete own budgets"
  ON budgets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();

-- Create index for better query performance
CREATE INDEX idx_budgets_user_date ON budgets(user_id, year, month);
CREATE INDEX idx_budgets_category ON budgets(category_id);

