-- ANALYSEER: Waar komt het verschil van €122,67 vandaan?
-- Expected: €328,92 maar app toont €451,59

-- 1. TOTAAL BEREKENING NA STARTDATUM
SELECT 
  '🧮 APP BEREKENING' as info,
  50.52 + 3404.61 as startbalans_totaal,
  SUM(CASE 
    WHEN transaction_date > '2025-12-31' AND NOT is_transfer 
    THEN amount 
    ELSE 0 
  END) as transacties_na_start,
  (50.52 + 3404.61) + SUM(CASE 
    WHEN transaction_date > '2025-12-31' AND NOT is_transfer 
    THEN amount 
    ELSE 0 
  END) as app_saldo,
  451.59 as verwacht_app_saldo,
  ((50.52 + 3404.61) + SUM(CASE 
    WHEN transaction_date > '2025-12-31' AND NOT is_transfer 
    THEN amount 
    ELSE 0 
  END)) - 451.59 as verschil_met_app
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';

-- 2. BIZUM ONTVANGSTEN (mogelijke reimbursements)
SELECT 
  '💰 BIZUM ONTVANGSTEN NA STARTDATUM' as info,
  transaction_date,
  description,
  amount,
  is_income,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND description ILIKE '%bizum recibido%'
  AND amount > 0
ORDER BY transaction_date DESC;

-- 3. SOM VAN BIZUM ONTVANGSTEN
SELECT 
  '💵 TOTAAL BIZUM ONTVANGSTEN' as info,
  COUNT(*) as aantal_bizum,
  SUM(amount) as totaal_bizum
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND description ILIKE '%bizum recibido%'
  AND amount > 0;

-- 4. ALLE POSITIEVE TRANSACTIES (geen income, geen transfer)
SELECT 
  '💸 ALLE POSITIEVE TRANSACTIES (reimbursements?)' as info,
  transaction_date,
  description,
  amount,
  account_type
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND amount > 0
  AND is_income = false
  AND is_transfer = false
ORDER BY amount DESC;

-- 5. DETAIL BEREKENING PER ACCOUNT
SELECT 
  '🏦 BEREKENING PER ACCOUNT' as info,
  account_type,
  SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) as totaal_excl_transfers,
  SUM(CASE WHEN NOT is_transfer AND amount < 0 THEN amount ELSE 0 END) as uitgaven,
  SUM(CASE WHEN NOT is_transfer AND amount > 0 AND is_income = false THEN amount ELSE 0 END) as reimbursements
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
GROUP BY account_type;

-- 6. ZOEK TRANSACTIES ROND €122,67
SELECT 
  '🎯 TRANSACTIES ROND €122,67' as info,
  transaction_date,
  description,
  amount,
  is_transfer,
  account_type
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND (
    ABS(amount - 122.67) < 1 
    OR ABS(amount + 122.67) < 1
    OR ABS(amount - 61.335) < 1  -- helft van 122.67
  )
ORDER BY transaction_date DESC;
