-- Create savings_accounts table
CREATE TABLE IF NOT EXISTS savings_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('dutch', 'spanish', 'other')),
  currency TEXT NOT NULL DEFAULT 'EUR',
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create savings_entries table
CREATE TABLE IF NOT EXISTS savings_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES savings_accounts(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('balance', 'deposit', 'withdrawal')),
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_savings_accounts_user_id ON savings_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_entries_user_id ON savings_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_entries_account_id ON savings_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_savings_entries_entry_date ON savings_entries(entry_date);

-- Enable Row Level Security
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for savings_accounts
CREATE POLICY "Users can view their own savings accounts"
  ON savings_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings accounts"
  ON savings_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings accounts"
  ON savings_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings accounts"
  ON savings_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for savings_entries
CREATE POLICY "Users can view their own savings entries"
  ON savings_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings entries"
  ON savings_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings entries"
  ON savings_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings entries"
  ON savings_entries FOR DELETE
  USING (auth.uid() = user_id);
