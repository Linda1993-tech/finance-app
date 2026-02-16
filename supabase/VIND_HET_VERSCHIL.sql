-- VIND HET VERSCHIL VAN €122,67
-- Dit script helpt te vinden waar de €122,67 vandaan komt

-- 1. TOTAAL OVERZICHT
SELECT 
  '📊 TOTAAL OVERZICHT' as info,
  COUNT(*) as aantal_transacties,
  SUM(amount) as totaal_alle_transacties,
  SUM(CASE WHEN is_transfer THEN amount ELSE 0 END) as totaal_transfers,
  SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) as totaal_excl_transfers,
  SUM(CASE WHEN is_income THEN amount ELSE 0 END) as totaal_income,
  SUM(CASE WHEN NOT is_income AND NOT is_transfer THEN amount ELSE 0 END) as totaal_expenses
FROM transactions
WHERE user_id = auth.uid()
  AND transaction_date > '2025-12-31';

-- 2. VERDELING PER ACCOUNT
SELECT 
  '🏦 PER ACCOUNT' as info,
  account_type,
  COUNT(*) as aantal,
  SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) as bedrag_excl_transfers
FROM transactions
WHERE user_id = auth.uid()
  AND transaction_date > '2025-12-31'
GROUP BY account_type;

-- 3. GROTE UITGAVEN DIE MISSCHIEN TRANSFERS ZIJN
-- Zoek naar uitgaven > €50 die niet als transfer gemarkeerd zijn
SELECT 
  '🔍 MOGELIJKE GEMISTE TRANSFERS (uitgaven > €50)' as info,
  transaction_date,
  description,
  amount,
  is_transfer,
  account_type
FROM transactions
WHERE user_id = auth.uid()
  AND transaction_date > '2025-12-31'
  AND amount < -50  -- Grote uitgaven
  AND is_transfer = false
ORDER BY amount ASC
LIMIT 20;

-- 4. POSITIEVE TRANSACTIES DIE GEEN INCOME ZIJN
-- Dit zijn waarschijnlijk reimbursements of split bills
SELECT 
  '💰 POSITIEVE TRANSACTIES (geen income)' as info,
  transaction_date,
  description,
  amount,
  is_income,
  is_transfer
FROM transactions
WHERE user_id = auth.uid()
  AND transaction_date > '2025-12-31'
  AND amount > 0
  AND is_income = false
  AND is_transfer = false
ORDER BY amount DESC;

-- 5. BEREKENING: Waar komt €451,59 vandaan?
WITH balance_calc AS (
  SELECT 
    3455.13 as starting_balance,
    COALESCE(SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END), 0) as transaction_total
  FROM transactions
  WHERE user_id = auth.uid()
    AND transaction_date > '2025-12-31'
)
SELECT 
  '🧮 BALANCE BEREKENING' as info,
  starting_balance as startbalans,
  transaction_total as transacties_totaal,
  starting_balance + transaction_total as berekend_saldo,
  451.59 as verwacht_app_saldo,
  (starting_balance + transaction_total) - 451.59 as verschil
FROM balance_calc;

-- 6. DUPLICATES CHECK
-- Zoek naar mogelijk dubbele transacties
SELECT 
  '⚠️ MOGELIJKE DUPLICATES' as info,
  transaction_date,
  description,
  amount,
  COUNT(*) as aantal_keer
FROM transactions
WHERE user_id = auth.uid()
  AND transaction_date > '2025-12-31'
GROUP BY transaction_date, description, amount
HAVING COUNT(*) > 1;

-- 7. TRANSACTIES ROND DE €122,67
-- Misschien is er één specifieke transactie van ongeveer dit bedrag
SELECT 
  '🎯 TRANSACTIES ROND €122,67' as info,
  transaction_date,
  description,
  amount,
  is_transfer,
  account_type
FROM transactions
WHERE user_id = auth.uid()
  AND transaction_date > '2025-12-31'
  AND ABS(amount + 122.67) < 10  -- Binnen €10 van -€122,67
ORDER BY transaction_date DESC;
