-- RESET NAAR ORIGINELE STARTBALANS EN BEREKEN MET ALLE TRANSACTIES

-- Zet startbalansen terug naar origineel
UPDATE user_preferences
SET 
  dutch_account_starting_balance = 50.52,
  spanish_account_starting_balance = 3404.61
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9';

-- Check: Bereken met ALLE transacties (ook transfers!)
SELECT 
  '💰 MET ALLE TRANSACTIES (incl transfers)' as berekeningsmethode,
  50.52 as dutch_start,
  COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'dutch'
      AND transaction_date > '2025-12-31'
  ), 0) as dutch_transactions_ALL,
  50.52 + COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'dutch'
      AND transaction_date > '2025-12-31'
  ), 0) as dutch_balance,
  
  3404.61 as spanish_start,
  COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'spanish'
      AND transaction_date > '2025-12-31'
  ), 0) as spanish_transactions_ALL,
  3404.61 + COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'spanish'
      AND transaction_date > '2025-12-31'
  ), 0) as spanish_balance,
  
  50.52 + COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'dutch'
      AND transaction_date > '2025-12-31'
  ), 0) +
  3404.61 + COALESCE((
    SELECT SUM(amount) 
    FROM transactions 
    WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
      AND account_type = 'spanish'
      AND transaction_date > '2025-12-31'
  ), 0) as current_account_total;

SELECT '✅ Startbalans is gereset. Nu moeten we de app code aanpassen!' as resultaat;
