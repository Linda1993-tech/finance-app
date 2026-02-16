-- BEKIJK ALLE TRANSFERS
-- Deze 15 transfers van -€1532 die het saldo beïnvloeden

SELECT 
  '🔄 ALLE TRANSFERS (15 stuks, -€1532 totaal)' as info,
  transaction_date,
  description,
  amount,
  account_type,
  is_transfer
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND is_transfer = true
  AND transaction_date > '2025-12-31'
ORDER BY amount ASC;

-- Check: Zijn deze echt transfers of per ongeluk gemarkeerd?
SELECT 
  '📊 TRANSFER SAMENVATTING' as info,
  COUNT(*) as aantal,
  SUM(amount) as totaal,
  account_type
FROM transactions
WHERE user_id = '96182f85-5b42-476e-b1a6-ae8db36570a9'
  AND is_transfer = true
  AND transaction_date > '2025-12-31'
GROUP BY account_type;
