# Balance Fix Instructies 🔧

## Probleem
Je Current Account saldo is **€ 451,59** maar zou **€ 328,92** moeten zijn.

## Stappen om op te lossen

### 1️⃣ Open Supabase SQL Editor
1. Ga naar: https://supabase.com/dashboard/project/zjfowrsdxupludsybzid/sql
2. Log in als dat nodig is

### 2️⃣ Run STEP_1_check_status.sql
1. Open `supabase/STEP_1_check_status.sql` in Cursor
2. Selecteer ALLES (Cmd+A)
3. Kopieer (Cmd+C)
4. Plak in Supabase SQL Editor
5. Klik **RUN**

**Wat je ziet:**
- Als je **3 velden** ziet (account_type, is_income, is_transfer) → Ga naar stap 4
- Als je **0 velden** ziet → Ga naar stap 3

### 3️⃣ Run STEP_2_add_missing_fields.sql (alleen als velden ontbreken)
1. Open `supabase/STEP_2_add_missing_fields.sql`
2. Selecteer ALLES → Kopieer → Plak in SQL Editor
3. Klik **RUN**
4. Wacht tot je ziet: "Fields added successfully! ✅"

### 4️⃣ Run STEP_3_create_user_preferences.sql (als user_preferences niet bestaat)
1. Open `supabase/STEP_3_create_user_preferences.sql`
2. Selecteer ALLES → Kopieer → Plak in SQL Editor
3. Klik **RUN**
4. Wacht tot je ziet: "user_preferences table created! ✅"

### 5️⃣ Run STEP_4_fix_transaction_data.sql
1. Open `supabase/STEP_4_fix_transaction_data.sql`
2. Selecteer ALLES → Kopieer → Plak in SQL Editor
3. Klik **RUN**
4. Bekijk de output:
   - BEFORE: hoeveel transactions per type
   - AFTER: hoeveel na de fix

### 6️⃣ Check je app
1. Ga naar je app: `/dashboard`
2. Refresh de pagina (Cmd+R)
3. Controleer het Current Account saldo

### 7️⃣ Stel je startbalansen in
1. Ga naar `/dashboard/settings`
2. Vul in:
   - **Dutch Account Starting Balance**: Het saldo van je ING NL rekening op de startdatum
   - **Dutch Account Starting Date**: Datum van de eerste geïmporteerde transactie
   - **Spanish Account Starting Balance**: Het saldo van je ING ES rekening op de startdatum
   - **Spanish Account Starting Date**: Datum van de eerste geïmporteerde transactie
3. Klik **Save Settings**

### 8️⃣ Controleer de Debug Info
1. Scroll naar beneden in Settings
2. Bekijk de **Debug Info**
3. Controleer of de berekening nu klopt:
   ```
   Starting Balance + Transactions = Current Account
   ```

## Als het nog steeds niet klopt

### Check transfers handmatig
Sommige transfers worden misschien niet automatisch herkend. Check in Supabase:

```sql
-- Toon alle grote positieve transacties (mogelijke transfers)
SELECT transaction_date, description, amount, is_transfer
FROM transactions
WHERE user_id = auth.uid()
  AND amount > 100
  AND is_transfer = false
ORDER BY transaction_date DESC;
```

Als je een transfer ziet die niet gemarkeerd is:

```sql
-- Markeer specifieke transaction als transfer
UPDATE transactions
SET is_transfer = true
WHERE id = 'PLAK_HIER_HET_ID_VAN_DE_TRANSACTIE'
  AND user_id = auth.uid();
```

### Check duplicates
Misschien heb je dubbele transacties:

```sql
-- Zoek dubbele transacties
SELECT transaction_date, description, amount, COUNT(*)
FROM transactions
WHERE user_id = auth.uid()
GROUP BY transaction_date, description, amount
HAVING COUNT(*) > 1;
```

## Hulp nodig?
Stuur me de output van STEP_1 en de Debug Info uit Settings!
