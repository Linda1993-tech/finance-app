-- Add current_price column to stocks table
-- This stores the latest fetched market price

ALTER TABLE stocks 
ADD COLUMN IF NOT EXISTS current_price DECIMAL(10, 2);

-- Add comment
COMMENT ON COLUMN stocks.current_price IS 'Latest market price fetched from API (in stock currency)';
