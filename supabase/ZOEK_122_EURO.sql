-- ZOEK €122,67
-- Dit is het originele verschil tussen app (€451,59) en correct (€328,92)

-- 1. Check: Zijn er savings/pension entries van rond dit bedrag?
SELECT 
  '💰 SAVINGS/PENSION ENTRIES ROND €122' as check,
  sa.name as account_name,
  sa.is_pension,
  se.entry_date,
  se.entry_type,
  se.amount
FROM savings_entries se
JOIN savings_accounts sa ON se.account_id = sa.id
WHERE sa.user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND se.entry_date > '2025-12-31'
  AND (
    ABS(se.amount - 122.67) < 5
    OR ABS(se.amount + 122.67) < 5
  )
ORDER BY se.entry_date DESC;

-- 2. Check: Totaal van savings/pension deposits na 31/12
SELECT 
  '📊 TOTAAL SAVINGS/PENSION DEPOSITS' as info,
  sa.is_pension,
  COUNT(*) as aantal_entries,
  SUM(CASE WHEN se.entry_type = 'deposit' THEN se.amount ELSE 0 END) as totaal_deposits
FROM savings_entries se
JOIN savings_accounts sa ON se.account_id = sa.id
WHERE sa.user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND se.entry_date > '2025-12-31'
GROUP BY sa.is_pension;

-- 3. Check: Zijn er transacties van ~€122 die niet als transfer gemarkeerd zijn?
SELECT 
  '🔍 TRANSACTIES ROND €122 (geen transfer)' as check,
  transaction_date,
  description,
  amount,
  account_type,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND (
    ABS(amount - 122.67) < 5
    OR ABS(amount + 122.67) < 5
    OR ABS(amount - 61.33) < 2  -- helft
  )
  AND is_transfer = false
ORDER BY transaction_date DESC;

-- 4. Check: Alle savings/pension deposits (om te zien of er een link is)
SELECT 
  '📋 ALLE SAVINGS/PENSION DEPOSITS NA 31/12' as info,
  sa.name,
  sa.is_pension,
  se.entry_date,
  se.entry_type,
  se.amount
FROM savings_entries se
JOIN savings_accounts sa ON se.account_id = sa.id
WHERE sa.user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND se.entry_date > '2025-12-31'
  AND se.entry_type IN ('deposit', 'transfer_in')
ORDER BY se.entry_date DESC;

-- 5. ANALYSE: Misschien zijn het meerdere kleine transacties?
SELECT 
  '🧮 KLEINE UITGAVEN DIE SAMEN €122 KUNNEN ZIJN' as check,
  transaction_date,
  description,
  amount,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND amount BETWEEN -50 AND -10
  AND is_transfer = false
ORDER BY amount ASC
LIMIT 15;
