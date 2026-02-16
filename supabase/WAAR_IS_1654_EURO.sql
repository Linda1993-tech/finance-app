-- WAAR IS €1654,67?
-- Verschil tussen berekend (€1983,59) en wat jij zegt (€328,92)

-- €1983,59 - €328,92 = €1654,67

-- Mogelijk zijn dit:
-- 1. Transfers die NOG NIET als transfer gemarkeerd zijn
-- 2. Duplicates
-- 3. Verkeerde startbalans
-- 4. Grote transacties die niet zouden moeten tellen

-- OPTIE 1: Zoek grote uitgaven die mogelijk transfers zijn
SELECT 
  '💰 GROTE UITGAVEN (> €100, geen transfer)' as check,
  transaction_date,
  description,
  amount,
  account_type,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND amount < -100
  AND is_transfer = false
ORDER BY amount ASC
LIMIT 20;

-- OPTIE 2: Som van alle grote uitgaven
SELECT 
  '📊 TOTAAL GROTE UITGAVEN' as info,
  COUNT(*) as aantal,
  SUM(amount) as totaal
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND amount < -100
  AND is_transfer = false;

-- OPTIE 3: Check of startbalans verkeerd is
-- Als startbalans €1654,67 lager zou zijn:
SELECT 
  '🔢 ALS STARTBALANS €1654,67 LAGER WAS' as scenario,
  (50.52 + 3404.61) as huidige_startbalans,
  (50.52 + 3404.61) - 1654.67 as nieuwe_startbalans,
  (50.52 + 3404.61) - 1654.67 + 
    (SELECT SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END)
     FROM transactions 
     WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
       AND transaction_date > '2025-12-31') as nieuw_saldo;

-- OPTIE 4: Zoek transacties rond €1654 of ~€827 (helft)
SELECT 
  '🎯 TRANSACTIES ROND €1654' as check,
  transaction_date,
  description,
  amount,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND transaction_date > '2025-12-31'
  AND (
    ABS(amount + 1654.67) < 50
    OR ABS(amount - 1654.67) < 50
    OR ABS(amount + 827) < 20  -- helft
    OR ABS(amount - 827) < 20
  )
ORDER BY transaction_date DESC;
