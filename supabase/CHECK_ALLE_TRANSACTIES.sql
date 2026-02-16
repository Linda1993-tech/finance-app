-- CHECK ALLE TRANSACTIES (ongeacht datum)
-- Dit laat zien wat er echt in de database zit

-- 1. Hoeveel transacties heb je IN TOTAAL?
SELECT 
  '📊 TOTAAL AANTAL TRANSACTIES' as info,
  COUNT(*) as aantal,
  MIN(transaction_date) as oudste_transactie,
  MAX(transaction_date) as nieuwste_transactie
FROM transactions
WHERE user_id = auth.uid();

-- 2. Transacties VOOR en NA startdatum
SELECT 
  '📅 TRANSACTIES VOOR/NA STARTDATUM' as info,
  COUNT(CASE WHEN transaction_date <= '2025-12-31' THEN 1 END) as voor_startdatum,
  COUNT(CASE WHEN transaction_date > '2025-12-31' THEN 1 END) as na_startdatum,
  SUM(CASE WHEN transaction_date <= '2025-12-31' AND NOT is_transfer THEN amount ELSE 0 END) as bedrag_voor_start,
  SUM(CASE WHEN transaction_date > '2025-12-31' AND NOT is_transfer THEN amount ELSE 0 END) as bedrag_na_start
FROM transactions
WHERE user_id = auth.uid();

-- 3. Toon recente transacties (ongeacht datum)
SELECT 
  '📋 LAATSTE 20 TRANSACTIES' as info,
  transaction_date,
  description,
  amount,
  is_transfer,
  is_income,
  account_type,
  import_source
FROM transactions
WHERE user_id = auth.uid()
ORDER BY transaction_date DESC, created_at DESC
LIMIT 20;

-- 4. SOM VAN ALLE TRANSACTIES (excl. transfers)
SELECT 
  '💰 TOTAAL ALLE TRANSACTIES (excl transfers)' as info,
  SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END) as totaal_bedrag,
  COUNT(CASE WHEN NOT is_transfer THEN 1 END) as aantal_transacties
FROM transactions
WHERE user_id = auth.uid();

-- 5. BEREKENING MET ALLE TRANSACTIES
SELECT 
  '🧮 BALANCE BEREKENING (ALLE TRANSACTIES)' as info,
  3455.13 as startbalans,
  COALESCE(SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END), 0) as alle_transacties,
  3455.13 + COALESCE(SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END), 0) as berekend_saldo
FROM transactions
WHERE user_id = auth.uid();

-- 6. Check of je ingelogd bent
SELECT 
  '👤 JOUW USER ID' as info,
  auth.uid() as user_id;
