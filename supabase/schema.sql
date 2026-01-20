-- Finance App Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zjfowrsdxupludsybzid/sql

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
-- User-defined categories with optional parent (for subcategories)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  color TEXT, -- Optional hex color for UI
  icon TEXT, -- Optional emoji or icon name
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique category names per user (within same parent level)
  UNIQUE(user_id, name, parent_id)
);

-- Index for faster lookups
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
-- Imported bank transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Original data from bank
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL, -- Positive for income, negative for expenses
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Normalized data
  normalized_description TEXT NOT NULL, -- Cleaned version for matching
  learning_key TEXT, -- First 8 chars of normalized description (or NULL if excluded)
  
  -- Categorization
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_manually_categorized BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Learning behavior flags
  exclude_from_learning BOOLEAN NOT NULL DEFAULT FALSE, -- "Do not learn from this transaction"
  disable_auto_rules BOOLEAN NOT NULL DEFAULT FALSE, -- "Do not auto-apply rules" (for Amazon, etc)
  
  -- Import metadata
  import_source TEXT, -- 'ING_NL', 'ING_ES', etc
  import_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  original_row_data JSONB, -- Store original CSV/XLS row for reference
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_learning_key ON transactions(learning_key) WHERE learning_key IS NOT NULL;

-- ============================================================================
-- CATEGORIZATION RULES TABLE
-- ============================================================================
-- The learning system: maps learning keys to categories
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  learning_key TEXT NOT NULL, -- The 8-char normalized prefix
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Rule metadata
  confidence INTEGER NOT NULL DEFAULT 1, -- How many times this rule was confirmed
  created_by_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One rule per learning key per user
  UNIQUE(user_id, learning_key)
);

-- Indexes
CREATE INDEX idx_categorization_rules_user_id ON categorization_rules(user_id);
CREATE INDEX idx_categorization_rules_learning_key ON categorization_rules(learning_key);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Categorization rules policies
CREATE POLICY "Users can view their own rules"
  ON categorization_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rules"
  ON categorization_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rules"
  ON categorization_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rules"
  ON categorization_rules FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorization_rules_updated_at
  BEFORE UPDATE ON categorization_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment the lines below if you want some starter categories

-- INSERT INTO categories (user_id, name, color, icon) VALUES
--   (auth.uid(), 'Housing', '#3B82F6', '🏠'),
--   (auth.uid(), 'Food & Dining', '#10B981', '🍔'),
--   (auth.uid(), 'Transportation', '#F59E0B', '🚗'),
--   (auth.uid(), 'Healthcare', '#EF4444', '⚕️'),
--   (auth.uid(), 'Entertainment', '#8B5CF6', '🎬'),
--   (auth.uid(), 'Income', '#059669', '💰'),
--   (auth.uid(), 'Utilities', '#6B7280', '💡'),
--   (auth.uid(), 'Shopping', '#EC4899', '🛍️');

