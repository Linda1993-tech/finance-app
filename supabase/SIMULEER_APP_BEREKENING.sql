-- SIMULEER EXACTE APP BEREKENING
-- Dit simuleert wat wealth-actions.ts doet

-- Dutch account berekening (zoals de app het doet)
SELECT 
  '🇳🇱 DUTCH ACCOUNT (app berekening)' as account,
  50.52 as starting_balance,
  COUNT(*) as transaction_count,
  SUM(amount) as transactions_total,
  50.52 + SUM(amount) as calculated_balance
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND account_type = 'dutch'
  AND is_transfer = false
  AND transaction_date > '2025-12-31';

-- Spanish account berekening (zoals de app het doet)
SELECT 
  '🇪🇸 SPANISH ACCOUNT (app berekening)' as account,
  3404.61 as starting_balance,
  COUNT(*) as transaction_count,
  SUM(amount) as transactions_total,
  3404.61 + SUM(amount) as calculated_balance
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND account_type = 'spanish'
  AND is_transfer = false
  AND transaction_date > '2025-12-31';

-- Totaal Current Account (zoals app het berekent)
SELECT 
  '💰 CURRENT ACCOUNT TOTAAL (app berekening)' as total,
  50.52 + COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'dutch'
      AND is_transfer = false
      AND transaction_date > '2025-12-31'
  ), 0) +
  3404.61 + COALESCE((
    SELECT SUM(amount)
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'spanish'
      AND is_transfer = false
      AND transaction_date > '2025-12-31'
  ), 0) as current_account_balance;

-- Check: Hoeveel transfers zijn er?
SELECT 
  '🔄 TRANSFERS (deze tellen NIET mee)' as info,
  COUNT(*) as aantal_transfers,
  SUM(amount) as totaal_bedrag_transfers
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND is_transfer = true
  AND transaction_date > '2025-12-31';
