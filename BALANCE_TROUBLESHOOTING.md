# Balance Troubleshooting Guide 🔍

## Problem
Your Current Account balance shows **€ 451,59** but should be **€ 328,92** (difference: € 122,67)

## Root Cause
The balance calculation requires specific fields in the `transactions` table:
- `account_type` - Which account (dutch/spanish)
- `is_transfer` - Whether it's a transfer (shouldn't count toward balance)
- `is_income` - Whether it's real income

If these fields are missing or incorrectly set, the balance will be wrong.

## Solution Steps

### Step 1: Add Missing Fields (if needed)
If you recently ran `reset-and-create-schema.sql`, you need to add the missing fields:

1. Open Supabase SQL Editor
2. Run: `supabase/fix-missing-transaction-fields.sql`

This will add the fields **without deleting your data**.

### Step 2: Verify Your Starting Balances
The balance formula is:
```
Current Account = Starting Balance + All Transactions - Transfers
```

1. Go to `/dashboard/settings`
2. Check your starting balances:
   - **Dutch Account (ING NL)** starting balance
   - **Spanish Account (ING ES)** starting balance
   - Starting dates for both
3. Make sure these match your actual bank balances on those dates

### Step 3: Mark Transfers Correctly
Transfers to savings/stocks should be marked as `is_transfer = true`:

```sql
-- Example: Mark transfers to savings as transfers
UPDATE transactions 
SET is_transfer = true 
WHERE description ILIKE '%naar spaarrekening%'
  OR description ILIKE '%to savings%'
  OR description ILIKE '%overboeking%';
```

### Step 4: Mark Income Correctly
Real income (salary, gifts) should be marked as `is_income = true`:

```sql
-- Example: Mark salary as income
UPDATE transactions 
SET is_income = true 
WHERE description ILIKE '%salaris%'
  OR description ILIKE '%salary%'
  OR description ILIKE '%loon%';
```

### Step 5: Set Correct Account Type
Each transaction should have the correct `account_type`:

```sql
-- Transactions from ING NL should be 'dutch'
UPDATE transactions 
SET account_type = 'dutch' 
WHERE import_source = 'ING_NL';

-- Transactions from ING ES should be 'spanish'
UPDATE transactions 
SET account_type = 'spanish' 
WHERE import_source = 'ING_ES';
```

### Step 6: Debug and Verify
1. Go to `/dashboard/settings`
2. Look at the **Debug Info** section at the bottom
3. It shows:
   - Starting balances
   - Transaction counts per account
   - Calculated balance

Compare these numbers to verify the calculation is correct.

## Common Issues

### Issue 1: Transfers are being counted twice
**Symptom:** Balance is too high

**Fix:** Mark transfers to savings/stocks as `is_transfer = true`

### Issue 2: Starting balance is wrong
**Symptom:** Balance is consistently off by the same amount

**Fix:** Update your starting balance in Settings to match your actual bank balance on the starting date

### Issue 3: Income not properly marked
**Symptom:** Balance includes reimbursements or split bills as income

**Fix:** Only mark real income (salary, gifts) as `is_income = true`. Reimbursements should be `is_income = false`.

### Issue 4: Wrong account type
**Symptom:** Dutch transactions counted in Spanish account or vice versa

**Fix:** Set `account_type` correctly based on which bank account the transaction belongs to

## Verification
After fixing, your balance should match your calculation (€ 328,92).

The console logs will show:
```
💳 Dutch account: €[starting] + €[transactions] = €[total]
💳 Spanish account: €[starting] + €[transactions] = €[total]
```

If you're still seeing issues, check:
1. Are there duplicate transactions?
2. Are all import sources set correctly?
3. Is the starting date set correctly (transactions before this date are ignored)?
