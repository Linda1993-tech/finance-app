-- Migration: Add missing fields to transactions table
-- Run this if you've run reset-and-create-schema.sql and are missing fields
-- This will NOT delete your existing data

-- Add account_type field if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN account_type TEXT NOT NULL DEFAULT 'dutch' 
    CHECK (account_type IN ('dutch', 'spanish', 'other'));
    
    CREATE INDEX idx_transactions_account_type ON transactions(user_id, account_type);
    
    RAISE NOTICE 'Added account_type field';
  ELSE
    RAISE NOTICE 'account_type field already exists';
  END IF;
END $$;

-- Add is_transfer field if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'is_transfer'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN is_transfer BOOLEAN NOT NULL DEFAULT FALSE;
    
    CREATE INDEX idx_transactions_is_transfer ON transactions(is_transfer);
    
    RAISE NOTICE 'Added is_transfer field';
  ELSE
    RAISE NOTICE 'is_transfer field already exists';
  END IF;
END $$;

-- Add is_income field if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'is_income'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN is_income BOOLEAN NOT NULL DEFAULT FALSE;
    
    CREATE INDEX idx_transactions_is_income ON transactions(is_income);
    
    RAISE NOTICE 'Added is_income field';
  ELSE
    RAISE NOTICE 'is_income field already exists';
  END IF;
END $$;

-- Success message
SELECT 'Migration complete! Missing fields have been added. ✅' AS message;

-- NEXT STEPS:
-- 1. After running this, check your transactions in the app
-- 2. Mark any transfers to savings/stocks as "is_transfer = true"
-- 3. Mark salary/income as "is_income = true"
-- 4. Set correct account_type ('dutch' or 'spanish') for each transaction
-- 5. Go to Settings and set your correct starting balances
