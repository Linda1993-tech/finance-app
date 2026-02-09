-- Add exchange rate tracking for currency gain/loss calculations
-- This allows us to show "Product W/V" and "Valuta W/V" like DeGiro

-- Add exchange_rate_at_purchase to stock_transactions
ALTER TABLE stock_transactions 
ADD COLUMN IF NOT EXISTS exchange_rate_at_purchase DECIMAL(10, 6);

-- Add exchange_rate_at_purchase to stocks (for average)
ALTER TABLE stocks 
ADD COLUMN IF NOT EXISTS exchange_rate_at_purchase DECIMAL(10, 6);

-- Add comments
COMMENT ON COLUMN stock_transactions.exchange_rate_at_purchase IS 'EUR/currency rate at time of purchase (e.g., 1 USD = 0.92 EUR)';
COMMENT ON COLUMN stocks.exchange_rate_at_purchase IS 'Weighted average EUR/currency rate for all purchases';

-- For existing records, set a default rate (current approximate rates)
UPDATE stock_transactions 
SET exchange_rate_at_purchase = 
  CASE 
    WHEN currency = 'USD' THEN 0.92
    WHEN currency = 'GBP' THEN 1.16
    ELSE 1.0
  END
WHERE exchange_rate_at_purchase IS NULL;

UPDATE stocks 
SET exchange_rate_at_purchase = 
  CASE 
    WHEN currency = 'USD' THEN 0.92
    WHEN currency = 'GBP' THEN 1.16
    ELSE 1.0
  END
WHERE exchange_rate_at_purchase IS NULL;
