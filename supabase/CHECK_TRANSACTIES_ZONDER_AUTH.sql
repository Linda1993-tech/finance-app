-- CHECK TRANSACTIES ZONDER AUTH FILTER
-- Dit werkt ook als je niet bent ingelogd in SQL Editor

-- 1. TOTAAL AANTAL TRANSACTIES (alle users)
SELECT 
  '📊 TOTAAL IN DATABASE' as info,
  COUNT(*) as totaal_transacties,
  COUNT(DISTINCT user_id) as aantal_users,
  MIN(transaction_date) as oudste,
  MAX(transaction_date) as nieuwste
FROM transactions;

-- 2. TRANSACTIES PER USER
SELECT 
  '👥 PER USER' as info,
  user_id,
  COUNT(*) as aantal_transacties,
  MIN(transaction_date) as oudste,
  MAX(transaction_date) as nieuwste,
  SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) as totaal_bedrag_excl_transfers
FROM transactions
GROUP BY user_id;

-- 3. RECENTE TRANSACTIES (van alle users)
SELECT 
  '📋 LAATSTE 20 TRANSACTIES (alle users)' as info,
  transaction_date,
  description,
  amount,
  is_transfer,
  account_type,
  LEFT(user_id::text, 8) as user_id_preview
FROM transactions
ORDER BY transaction_date DESC, created_at DESC
LIMIT 20;

-- 4. TRANSACTIES VOOR/NA 2025-12-31
SELECT 
  '📅 VOOR/NA STARTDATUM (alle users)' as info,
  user_id,
  COUNT(CASE WHEN transaction_date <= '2025-12-31' THEN 1 END) as voor_2025_12_31,
  COUNT(CASE WHEN transaction_date > '2025-12-31' THEN 1 END) as na_2025_12_31,
  SUM(CASE WHEN transaction_date > '2025-12-31' AND NOT is_transfer THEN amount ELSE 0 END) as bedrag_na_start
FROM transactions
GROUP BY user_id;

-- 5. CHECK USER_PREFERENCES (zonder auth)
SELECT 
  '⚙️ USER PREFERENCES' as info,
  LEFT(user_id::text, 8) as user_id_preview,
  dutch_account_starting_balance,
  spanish_account_starting_balance,
  dutch_account_starting_date,
  spanish_account_starting_date
FROM user_preferences;

-- 6. BEREKENING PER USER
SELECT 
  '🧮 BALANCE PER USER' as info,
  t.user_id,
  COALESCE(up.dutch_account_starting_balance, 0) + COALESCE(up.spanish_account_starting_balance, 0) as startbalans,
  SUM(CASE WHEN NOT t.is_transfer THEN t.amount ELSE 0 END) as transacties_totaal,
  (COALESCE(up.dutch_account_starting_balance, 0) + COALESCE(up.spanish_account_starting_balance, 0)) + 
    SUM(CASE WHEN NOT t.is_transfer THEN t.amount ELSE 0 END) as berekend_saldo
FROM transactions t
LEFT JOIN user_preferences up ON t.user_id = up.user_id
GROUP BY t.user_id, up.dutch_account_starting_balance, up.spanish_account_starting_balance;
