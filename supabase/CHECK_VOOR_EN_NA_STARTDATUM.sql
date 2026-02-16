-- CHECK: Hoeveel transacties VOOR vs NA startdatum 31/12/2025

-- 1. VERDELING VOOR/NA PER ACCOUNT
SELECT 
  '📅 VOOR/NA STARTDATUM PER ACCOUNT' as info,
  account_type,
  COUNT(CASE WHEN transaction_date <= '2025-12-31' THEN 1 END) as voor_startdatum,
  COUNT(CASE WHEN transaction_date > '2025-12-31' THEN 1 END) as na_startdatum,
  SUM(CASE WHEN transaction_date <= '2025-12-31' AND NOT is_transfer THEN amount ELSE 0 END) as bedrag_voor,
  SUM(CASE WHEN transaction_date > '2025-12-31' AND NOT is_transfer THEN amount ELSE 0 END) as bedrag_na
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
GROUP BY account_type;

-- 2. CORRECTE APP BEREKENING
-- Dit simuleert wat de app ECHT doet (alleen transacties NA startdatum)
SELECT 
  '🧮 APP BEREKENING (alleen NA startdatum)' as info,
  3455.13 as startbalans,
  SUM(CASE 
    WHEN transaction_date > '2025-12-31' AND NOT is_transfer 
    THEN amount 
    ELSE 0 
  END) as transacties_na_start,
  3455.13 + SUM(CASE 
    WHEN transaction_date > '2025-12-31' AND NOT is_transfer 
    THEN amount 
    ELSE 0 
  END) as app_saldo
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';

-- 3. VERKEERDE SQL BEREKENING (alle transacties)
SELECT 
  '❌ SQL BEREKENING (ALLE transacties)' as info,
  3455.13 as startbalans,
  SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) as alle_transacties,
  3455.13 + SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) as sql_saldo
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';

-- 4. TRANSACTIES VOOR STARTDATUM
-- Dit zijn de transacties die de SQL telt maar de app NIET
SELECT 
  '⚠️ TRANSACTIES VOOR STARTDATUM (niet meegeteld in app)' as info,
  transaction_date,
  description,
  amount,
  account_type,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date <= '2025-12-31'
  AND is_transfer = false
ORDER BY transaction_date DESC
LIMIT 30;

-- 5. TRANSACTIES NA STARTDATUM
-- Dit zijn de transacties die WEL meegeteld worden
SELECT 
  '✅ TRANSACTIES NA STARTDATUM (wel meegeteld in app)' as info,
  transaction_date,
  description,
  amount,
  account_type,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND is_transfer = false
ORDER BY transaction_date DESC
LIMIT 30;
