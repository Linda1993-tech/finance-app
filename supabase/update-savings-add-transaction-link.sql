-- Add transaction_id column to savings_entries table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'savings_entries' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE savings_entries ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;
    CREATE INDEX idx_savings_entries_transaction_id ON savings_entries(transaction_id);
  END IF;
END $$;
