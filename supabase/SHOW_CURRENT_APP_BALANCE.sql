-- SHOW CURRENT APP BALANCE
-- Dit simuleert EXACT wat de app laat zien (na onze salary fix)

-- Dutch Account Berekening
SELECT 
  '🇳🇱 DUTCH ACCOUNT' as account,
  50.52 as starting_balance,
  '2025-12-31' as starting_date,
  COUNT(*) as transactions_after_start,
  COALESCE(SUM(amount), 0) as transactions_total,
  50.52 + COALESCE(SUM(amount), 0) as account_balance
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND account_type = 'dutch'
  AND is_transfer = false
  AND transaction_date > '2025-12-31';

-- Spanish Account Berekening  
SELECT 
  '🇪🇸 SPANISH ACCOUNT' as account,
  3404.61 as starting_balance,
  '2025-12-31' as starting_date,
  COUNT(*) as transactions_after_start,
  COALESCE(SUM(amount), 0) as transactions_total,
  3404.61 + COALESCE(SUM(amount), 0) as account_balance
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND account_type = 'spanish'
  AND is_transfer = false
  AND transaction_date > '2025-12-31';

-- CURRENT ACCOUNT TOTAAL (wat de app zou moeten tonen)
SELECT 
  '💰 CURRENT ACCOUNT TOTAL' as label,
  (
    50.52 + COALESCE((
      SELECT SUM(amount) 
      FROM transactions 
      WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
        AND account_type = 'dutch'
        AND is_transfer = false
        AND transaction_date > '2025-12-31'
    ), 0)
  ) + (
    3404.61 + COALESCE((
      SELECT SUM(amount) 
      FROM transactions 
      WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
        AND account_type = 'spanish'
        AND is_transfer = false
        AND transaction_date > '2025-12-31'
    ), 0)
  ) as current_account_balance;

-- VERGELIJKING
SELECT 
  '📊 VERGELIJKING' as info,
  1983.59 as database_saldo_berekend,
  (
    50.52 + COALESCE((
      SELECT SUM(amount) 
      FROM transactions 
      WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
        AND account_type = 'dutch'
        AND is_transfer = false
        AND transaction_date > '2025-12-31'
    ), 0)
  ) + (
    3404.61 + COALESCE((
      SELECT SUM(amount) 
      FROM transactions 
      WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
        AND account_type = 'spanish'
        AND is_transfer = false
        AND transaction_date > '2025-12-31'
    ), 0)
  ) as app_zou_moeten_tonen,
  451.59 as app_toont_nu,
  328.92 as jij_zegt_het_moet_zijn;
