-- Create stocks table (holdings/positions)
CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL, -- e.g. AAPL, ASML, etc.
  name TEXT NOT NULL, -- Company name
  quantity DECIMAL(10, 4) NOT NULL DEFAULT 0, -- Number of shares
  average_cost DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Average cost per share
  currency TEXT NOT NULL DEFAULT 'EUR',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- Create stock_transactions table
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id UUID REFERENCES stocks(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL, -- Link to bank transaction
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'dividend')),
  ticker TEXT NOT NULL,
  quantity DECIMAL(10, 4), -- Number of shares (null for dividends)
  price_per_share DECIMAL(10, 2), -- Price per share (null for dividends)
  total_amount DECIMAL(10, 2) NOT NULL, -- Total amount (positive for sell/dividend, negative for buy)
  fees DECIMAL(10, 2) DEFAULT 0, -- Transaction fees
  currency TEXT NOT NULL DEFAULT 'EUR',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stocks_user_id ON stocks(user_id);
CREATE INDEX IF NOT EXISTS idx_stocks_ticker ON stocks(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_user_id ON stock_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_stock_id ON stock_transactions(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_date ON stock_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_transaction_id ON stock_transactions(transaction_id);

-- Enable Row Level Security
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stocks
CREATE POLICY "Users can view their own stocks"
  ON stocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stocks"
  ON stocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stocks"
  ON stocks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stocks"
  ON stocks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for stock_transactions
CREATE POLICY "Users can view their own stock transactions"
  ON stock_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock transactions"
  ON stock_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock transactions"
  ON stock_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock transactions"
  ON stock_transactions FOR DELETE
  USING (auth.uid() = user_id);
