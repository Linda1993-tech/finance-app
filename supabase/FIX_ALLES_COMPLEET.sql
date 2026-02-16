-- FIX ALLES COMPLEET
-- Dit lost alle problemen op

-- STAP 1: Zorg dat salaris in Spanish account staat (als het nog niet zo is)
UPDATE transactions
SET account_type = 'spanish'
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND description ILIKE '%CITYTOURS DREAMS%'
  AND amount > 4000
  AND account_type = 'dutch';

-- STAP 2: Fix de startbalansen
-- Huidige: €3455,13 (€50,52 Dutch + €3404,61 Spanish)
-- Correct: €1800,46 totaal
-- We houden dezelfde verdeling: 1,46% Dutch, 98,54% Spanish

UPDATE user_preferences
SET 
  dutch_account_starting_balance = 26.29,
  spanish_account_starting_balance = 1774.17
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';

-- VERIFICATIE: Check het resultaat
SELECT 
  '✅ SALARIS CHECK' as check,
  description,
  amount,
  account_type
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND description ILIKE '%CITYTOURS DREAMS%';

SELECT 
  '✅ NIEUWE STARTBALANSEN' as check,
  dutch_account_starting_balance as dutch_start,
  spanish_account_starting_balance as spanish_start,
  dutch_account_starting_balance + spanish_account_starting_balance as totaal_start
FROM user_preferences
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';

SELECT 
  '💰 NIEUW CURRENT ACCOUNT SALDO' as result,
  26.29 + COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'dutch'
      AND is_transfer = false
      AND transaction_date > '2025-12-31'
  ), 0) as dutch_balance,
  1774.17 + COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'spanish'
      AND is_transfer = false
      AND transaction_date > '2025-12-31'
  ), 0) as spanish_balance,
  26.29 + COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'dutch'
      AND is_transfer = false
      AND transaction_date > '2025-12-31'
  ), 0) +
  1774.17 + COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'spanish'
      AND is_transfer = false
      AND transaction_date > '2025-12-31'
  ), 0) as current_account_total;

SELECT '🎉 Als current_account_total = €328,92 is, dan is alles gefixt!' as bericht;
