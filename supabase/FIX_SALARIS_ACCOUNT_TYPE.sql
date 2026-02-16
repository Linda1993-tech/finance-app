-- FIX: Verplaats salaris naar correcte account (Spanish)
-- Dit is de transactie van €4122,14 die nu in Dutch staat maar Spanish zou moeten zijn

-- 1. CHECK: Toon de transactie VOOR de fix
SELECT 
  '❌ VOOR FIX (verkeerde account)' as status,
  transaction_date,
  description,
  amount,
  account_type,
  is_income,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND description ILIKE '%CITYTOURS DREAMS%'
  AND amount > 4000;

-- 2. FIX: Zet account_type naar 'spanish'
UPDATE transactions
SET account_type = 'spanish'
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND description ILIKE '%CITYTOURS DREAMS%'
  AND amount > 4000;

-- 3. CHECK: Toon de transactie NA de fix
SELECT 
  '✅ NA FIX (correcte account)' as status,
  transaction_date,
  description,
  amount,
  account_type,
  is_income,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND description ILIKE '%CITYTOURS DREAMS%'
  AND amount > 4000;

-- 4. NIEUWE BEREKENING PER ACCOUNT
SELECT 
  '🏦 NIEUWE BALANS BEREKENING' as info,
  account_type,
  50.52 as dutch_start,
  3404.61 as spanish_start,
  SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) as transacties,
  CASE 
    WHEN account_type = 'dutch' THEN 50.52 + SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END)
    WHEN account_type = 'spanish' THEN 3404.61 + SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END)
  END as nieuw_saldo
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
GROUP BY account_type;

-- 5. TOTAAL CURRENT ACCOUNT SALDO
SELECT 
  '💰 NIEUWE CURRENT ACCOUNT SALDO' as info,
  50.52 + 
    COALESCE((SELECT SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) 
              FROM transactions 
              WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
                AND account_type = 'dutch' 
                AND transaction_date > '2025-12-31'), 0) as dutch_total,
  3404.61 + 
    COALESCE((SELECT SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) 
              FROM transactions 
              WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
                AND account_type = 'spanish' 
                AND transaction_date > '2025-12-31'), 0) as spanish_total,
  50.52 + 
    COALESCE((SELECT SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) 
              FROM transactions 
              WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
                AND account_type = 'dutch' 
                AND transaction_date > '2025-12-31'), 0) +
  3404.61 + 
    COALESCE((SELECT SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) 
              FROM transactions 
              WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
                AND account_type = 'spanish' 
                AND transaction_date > '2025-12-31'), 0) as current_account_totaal;

SELECT '✅ FIX COMPLEET! Refresh je app (Cmd+R) en check het saldo!' as resultaat;
