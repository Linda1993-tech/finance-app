-- FIX ALLES IN 1 KEER
-- Dit script doet alle stappen in één keer
-- Kopieer en plak dit VOLLEDIG in Supabase SQL Editor en klik RUN

-- ============================================================================
-- STAP 1: Voeg ontbrekende velden toe aan transactions
-- ============================================================================

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'dutch' 
CHECK (account_type IN ('dutch', 'spanish', 'other'));

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_income BOOLEAN NOT NULL DEFAULT FALSE;

-- Maak indexes
CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON transactions(user_id, account_type);
CREATE INDEX IF NOT EXISTS idx_transactions_is_transfer ON transactions(is_transfer);
CREATE INDEX IF NOT EXISTS idx_transactions_is_income ON transactions(is_income);

-- ============================================================================
-- STAP 2: Maak user_preferences tabel aan als die niet bestaat
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dutch_account_starting_balance DECIMAL(12, 2) DEFAULT 0,
  dutch_account_starting_date DATE,
  spanish_account_starting_balance DECIMAL(12, 2) DEFAULT 0,
  spanish_account_starting_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================================================
-- STAP 3: Fix transaction data
-- ============================================================================

-- Zet account_type op basis van import_source
UPDATE transactions 
SET account_type = 'dutch' 
WHERE import_source = 'ING_NL' AND user_id = auth.uid();

UPDATE transactions 
SET account_type = 'spanish' 
WHERE import_source = 'ING_ES' AND user_id = auth.uid();

-- Markeer transfers (pas dit aan voor jouw specifieke omschrijvingen!)
UPDATE transactions 
SET is_transfer = true 
WHERE user_id = auth.uid()
  AND (
    description ILIKE '%spaarrekening%'
    OR description ILIKE '%savings%'
    OR description ILIKE '%transfer to%'
    OR description ILIKE '%overboeking naar%'
    OR description ILIKE '%naar sparen%'
    OR description ILIKE '%degiro%'
    OR description ILIKE '%bux%'
    OR description ILIKE '%trade republic%'
    OR description ILIKE '%investment%'
  );

-- Markeer income (pas dit aan voor jouw specifieke omschrijvingen!)
UPDATE transactions 
SET is_income = true 
WHERE user_id = auth.uid()
  AND amount > 0
  AND (
    description ILIKE '%salaris%'
    OR description ILIKE '%salary%'
    OR description ILIKE '%loon%'
    OR description ILIKE '%wage%'
  );

-- ============================================================================
-- RESULTAAT: Toon wat er gefixt is
-- ============================================================================

SELECT 
  '✅ FIX COMPLEET!' as status,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN account_type = 'dutch' THEN 1 END) as dutch_transactions,
  COUNT(CASE WHEN account_type = 'spanish' THEN 1 END) as spanish_transactions,
  COUNT(CASE WHEN is_transfer = true THEN 1 END) as marked_as_transfers,
  COUNT(CASE WHEN is_income = true THEN 1 END) as marked_as_income,
  SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) as balance_affecting_amount
FROM transactions
WHERE user_id = auth.uid();

-- ============================================================================
-- VOLGENDE STAP:
-- Ga naar /dashboard/settings en stel je startbalansen in!
-- ============================================================================
