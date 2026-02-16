-- FIX SALARIS ZONDER AUTH
-- Dit werkt ook als je niet bent ingelogd

-- BELANGRIJK: RLS policies kunnen dit blokkeren!
-- Als dit niet werkt, moet je het via de app interface doen

-- 1. Eerst: Disable RLS tijdelijk (alleen als je superuser bent)
-- ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 2. Update het salaris naar Spanish account
UPDATE transactions
SET account_type = 'spanish'
WHERE description ILIKE '%CITYTOURS DREAMS%'
  AND amount > 4000
  AND transaction_date = '2026-01-27';

-- 3. Re-enable RLS (als je het had uitgeschakeld)
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 4. Verify de fix
SELECT 
  '✅ CHECK: Is het salaris nu in Spanish?' as status,
  transaction_date,
  description,
  amount,
  account_type,
  is_income
FROM transactions
WHERE description ILIKE '%CITYTOURS DREAMS%'
  AND amount > 4000;

-- 5. Als bovenstaande UPDATE niet werkt door RLS, gebruik dit:
-- (dit zoekt op ID in plaats van user_id)
-- 
-- SELECT id, description, amount, account_type 
-- FROM transactions 
-- WHERE description ILIKE '%CITYTOURS DREAMS%' AND amount > 4000;
--
-- Dan run je:
-- UPDATE transactions SET account_type = 'spanish' WHERE id = '[PLAK HIER HET ID]';
