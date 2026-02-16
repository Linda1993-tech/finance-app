-- DEBUG: Waar komt het saldo van €451,59 vandaan?
-- Run dit om te zien welke componenten het wealth overview vormen

-- 1. Check startbalansen in user_preferences
SELECT 
  '1️⃣ STARTBALANSEN' as component,
  dutch_account_starting_balance,
  spanish_account_starting_balance,
  (dutch_account_starting_balance + spanish_account_starting_balance) as total_starting_balance,
  dutch_account_starting_date,
  spanish_account_starting_date
FROM user_preferences
WHERE user_id = auth.uid();

-- 2. Check transactions (we weten al dat dit 0 is)
SELECT 
  '2️⃣ TRANSACTIES' as component,
  COUNT(*) as aantal_transacties,
  COALESCE(SUM(CASE WHEN NOT is_transfer THEN amount ELSE 0 END), 0) as totaal_bedrag_excl_transfers
FROM transactions
WHERE user_id = auth.uid();

-- 3. Check savings accounts
SELECT 
  '3️⃣ SAVINGS ACCOUNTS' as component,
  COUNT(*) as aantal_accounts,
  name,
  interest_rate
FROM savings_accounts
WHERE user_id = auth.uid()
  AND is_pension = false;

-- 4. Check savings entries
SELECT 
  '4️⃣ SAVINGS ENTRIES' as component,
  sa.name as account_name,
  se.entry_date,
  se.entry_type,
  se.amount,
  se.balance_snapshot
FROM savings_entries se
JOIN savings_accounts sa ON se.account_id = sa.id
WHERE sa.user_id = auth.uid()
  AND sa.is_pension = false
ORDER BY se.entry_date DESC
LIMIT 10;

-- 5. Check pension accounts
SELECT 
  '5️⃣ PENSION ACCOUNTS' as component,
  COUNT(*) as aantal_accounts,
  name
FROM savings_accounts
WHERE user_id = auth.uid()
  AND is_pension = true;

-- 6. Check stocks
SELECT 
  '6️⃣ STOCKS' as component,
  ticker,
  quantity,
  average_cost,
  current_price,
  currency,
  (quantity * COALESCE(current_price, average_cost)) as current_value
FROM stocks
WHERE user_id = auth.uid();

-- 7. TOTAAL BEREKENING
-- Dit simuleert wat de wealth overview doet
SELECT 
  '7️⃣ WEALTH TOTAAL BEREKENING' as info,
  COALESCE((
    SELECT dutch_account_starting_balance + spanish_account_starting_balance
    FROM user_preferences 
    WHERE user_id = auth.uid()
  ), 0) as current_account_balance,
  'Als dit €451,59 is, dan komt het saldo van de startbalansen!' as uitleg;
