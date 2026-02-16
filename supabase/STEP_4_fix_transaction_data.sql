-- STEP 4: Fix transaction data (account types and transfers)
-- This updates your existing transactions with correct values

-- First, let's see what we're working with
SELECT 
  'Current state BEFORE fixes:' as status,
  COUNT(*) as total,
  COUNT(CASE WHEN account_type = 'dutch' THEN 1 END) as dutch,
  COUNT(CASE WHEN account_type = 'spanish' THEN 1 END) as spanish,
  COUNT(CASE WHEN is_transfer = true THEN 1 END) as transfers,
  COUNT(CASE WHEN is_income = true THEN 1 END) as income
FROM transactions
WHERE user_id = auth.uid();

-- Set account_type based on import_source
UPDATE transactions 
SET account_type = 'dutch' 
WHERE import_source = 'ING_NL' 
  AND user_id = auth.uid();

UPDATE transactions 
SET account_type = 'spanish' 
WHERE import_source = 'ING_ES' 
  AND user_id = auth.uid();

-- Mark common transfer descriptions as transfers
-- (You might need to adjust these patterns based on your actual descriptions)
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

-- Mark common income descriptions
-- (You might need to adjust these patterns)
UPDATE transactions 
SET is_income = true 
WHERE user_id = auth.uid()
  AND amount > 0
  AND (
    description ILIKE '%salaris%'
    OR description ILIKE '%salary%'
    OR description ILIKE '%loon%'
    OR description ILIKE '%wage%'
    OR description ILIKE '%gift%'
    OR description ILIKE '%cadeau%'
  );

-- Show results AFTER fixes
SELECT 
  'Current state AFTER fixes:' as status,
  COUNT(*) as total,
  COUNT(CASE WHEN account_type = 'dutch' THEN 1 END) as dutch,
  COUNT(CASE WHEN account_type = 'spanish' THEN 1 END) as spanish,
  COUNT(CASE WHEN is_transfer = true THEN 1 END) as transfers,
  COUNT(CASE WHEN is_income = true THEN 1 END) as income
FROM transactions
WHERE user_id = auth.uid();

SELECT 'Transaction data updated! ✅ Now check your app!' as result;
