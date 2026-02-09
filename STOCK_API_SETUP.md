# 📈 Stock API Setup Guide

WorthFlow uses een **multi-API strategie** om betrouwbaar koersen op te halen voor verschillende markten.

## 🎯 Hoe het werkt

Het systeem kiest **automatisch** de beste bron per aandeel:

### 🇪🇺 Europese aandelen (ASML, ING, ADYEN, etc.)
1. **Financial Modeling Prep (FMP)** - Eerste keuze voor EU data
2. **Yahoo Finance** - Gratis fallback

### 🇺🇸 Amerikaanse aandelen (AAPL, MSFT, TSLA, etc.)
1. **Yahoo Finance** - Gratis en betrouwbaar
2. **Alpha Vantage** - Optionele fallback
3. **FMP** - Extra optie

### ⚡ Caching
- Koersen worden **5 minuten** gecached
- Voorkomt rate limits
- Snellere laadtijden

---

## 🔑 API Keys verkrijgen

### 1. Financial Modeling Prep (Aangeraden voor EU stocks)

**Gratis tier:** 250 requests/dag - ruim voldoende voor persoonlijk gebruik

1. Ga naar: https://site.financialmodelingprep.com/developer/docs
2. Klik op "Get your Free API Key"
3. Maak een account aan
4. Kopieer je API key
5. Voeg toe aan `.env.local`:
   ```
   NEXT_PUBLIC_FMP_API_KEY=your-key-here
   ```

**Voordelen:**
- ✅ Beste data voor Nederlandse/Europese aandelen
- ✅ Dividend informatie included
- ✅ 250 requests/dag is meer dan genoeg

---

### 2. Alpha Vantage (Optioneel, voor US stocks)

**Gratis tier:** 25 requests/dag

1. Ga naar: https://www.alphavantage.co/support/#api-key
2. Vul je email in
3. Je krijgt direct een API key
4. Voeg toe aan `.env.local`:
   ```
   NEXT_PUBLIC_ALPHA_VANTAGE_KEY=your-key-here
   ```

**Voordelen:**
- ✅ Goede US stock data
- ✅ Crypto support (voor toekomstige features)
- ⚠️ Beperkt tot 25 requests/dag (minder belangrijk als je FMP hebt)

---

### 3. Yahoo Finance (Geen key nodig!)

**Gratis** en altijd beschikbaar als fallback.

**Voordelen:**
- ✅ Geen registratie nodig
- ✅ Breed bereik (EU + US)
- ✅ Betrouwbaar
- ⚠️ Geen officiële API (kan soms trager zijn)

---

## 🚀 Installatie

1. Kopieer `.env.example` naar `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Vul minimaal de **Supabase** credentials in

3. *Optioneel:* Voeg FMP API key toe voor beste resultaten

4. *Optioneel:* Voeg Alpha Vantage key toe als backup

---

## 🎨 Wat gebeurt er zonder API keys?

**Zonder FMP key:**
- ✅ Yahoo Finance wordt automatisch gebruikt
- ✅ Alle stocks blijven werken
- ⚠️ EU stocks kunnen iets minder accuraat zijn
- ⚠️ Geen dividend data

**Met alleen FMP key:**
- ✅ Beste ervaring voor EU stocks
- ✅ Dividend informatie beschikbaar
- ✅ Yahoo als fallback voor problemen

**Met FMP + Alpha Vantage:**
- ✅ Maximum betrouwbaarheid
- ✅ 3 bronnen als backup
- ✅ Beste data voor alle markten

---

## 📊 API Routing Logica

```
Ticker komt binnen
    ↓
Is het een EU stock? (bijv. ASML.AS)
    ├─ JA → Probeer FMP
    │        ├─ Succes? → Gebruik die data ✅
    │        └─ Mislukt? → Probeer Yahoo
    │                    ├─ Succes? → Gebruik die data ✅
    │                    └─ Mislukt? → Geef foutmelding ❌
    │
    └─ NEE → Is het een US stock?
             ├─ JA → Probeer Yahoo
             │        ├─ Succes? → Gebruik die data ✅
             │        └─ Mislukt? → Probeer Alpha Vantage → Probeer FMP
             │
             └─ ONBEKEND → Probeer alle APIs
```

---

## 🔧 Troubleshooting

### "Failed to fetch prices"

1. **Check je internet connectie**
2. **Ververs de pagina** (cache kan helpen)
3. **Kijk in de console** (F12) voor specifieke errors:
   - `401 Unauthorized` = API key incorrect
   - `429 Too Many Requests` = Rate limit bereikt (wacht even)
   - `404 Not Found` = Ticker bestaat niet op die exchange

### Rate limits bereikt?

- **FMP:** 250/dag - reset om middernacht (UTC)
- **Alpha Vantage:** 25/dag - reset na 24 uur
- **Yahoo:** Geen harde limiet, maar kan tijdelijk blokkeren bij overmatig gebruik

**Oplossing:** 
- Gebruik de "Refresh Prices" knop niet te vaak
- Cache voorkomt meeste problemen automatisch

### Ticker niet gevonden?

Zorg dat je de juiste format gebruikt:
- ✅ Nederlandse stocks: `ASML.AS`, `INGA.AS`, `ADYEN.AS`
- ✅ US stocks: `AAPL`, `MSFT`, `TSLA`
- ❌ Verkeerd: `ASML` (zonder `.AS` voor EU stocks)

---

## 💡 Tips

1. **Start met alleen FMP** - meestal voldoende
2. **Monitor je usage** op de FMP dashboard
3. **Ververs niet te vaak** - 1x per uur is genoeg
4. **Cache wordt automatisch gebruikt** - tweede keer laden is instant

---

## 🆓 Kosten

Alle genoemde APIs zijn **gratis** voor persoonlijk gebruik!

- FMP Free: €0/maand (250 req/dag)
- Alpha Vantage Free: €0/maand (25 req/dag)
- Yahoo Finance: Altijd gratis

**Betaalde opties** (alleen als je veel gebruikers hebt):
- FMP Pro: $14.99/maand (750 req/dag)
- Alpha Vantage Premium: $50/maand (1200 req/dag)

Voor persoonlijk gebruik is de gratis tier meer dan genoeg! 🎉
