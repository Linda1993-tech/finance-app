-- FIX STARTBALANSEN
-- Huidige startbalans: €3455,13
-- Correcte startbalans: €1800,46
-- Verschil: €1654,67 te hoog!

-- Opties voor nieuwe startbalansen:
-- Je moet kiezen welke verdeling je wilt gebruiken

-- OPTIE 1: Houd dezelfde verdeling (1,46% Dutch, 98,54% Spanish)
-- Dutch:   €26,29
-- Spanish: €1774,17

-- OPTIE 2: Zelf invullen op basis van je echte banksaldo op 31/12/2025
-- Dutch:   €___
-- Spanish: €___

-- Uncomment en pas aan wat je wilt gebruiken:

-- OPTIE 1: Gebruik berekende verdeling
UPDATE user_preferences
SET 
  dutch_account_starting_balance = 26.29,
  spanish_account_starting_balance = 1774.17
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';

-- OPTIE 2: Gebruik jouw exacte bedragen (pas aan!)
-- UPDATE user_preferences
-- SET 
--   dutch_account_starting_balance = 0,  -- ← PAS DIT AAN
--   spanish_account_starting_balance = 1800.46  -- ← PAS DIT AAN
-- WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';

-- Check het resultaat
SELECT 
  '✅ NIEUWE STARTBALANSEN' as check,
  dutch_account_starting_balance,
  spanish_account_starting_balance,
  dutch_account_starting_balance + spanish_account_starting_balance as totaal,
  dutch_account_starting_date,
  spanish_account_starting_date
FROM user_preferences
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';

-- Bereken het nieuwe saldo
SELECT 
  '💰 NIEUWE CURRENT ACCOUNT SALDO' as info,
  (SELECT dutch_account_starting_balance + spanish_account_starting_balance 
   FROM user_preferences 
   WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9') +
  COALESCE((
    SELECT SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END)
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND transaction_date > '2025-12-31'
  ), 0) as current_account_balance;
