# XML Parser & Upstash Redis Uploader

Automatický parser, ktorý každých 12 hodín scrapuje XML feed z drogeriadomov.sk a ukladá produkty do Upstash Redis databázy.

## 🚀 Funkcie

- ✅ Automatické sťahovanie a parsovanie XML feedu
- ✅ Ukladanie produktov do Upstash Redis
- ✅ Plánovač spúšťajúci scraping každých 12 hodín
- ✅ Spustenie okamžite pri štarte aplikácie
- ✅ Dávkové spracovanie pre optimálny výkon
- ✅ Logovanie a error handling

## 📋 Požiadavky

- Node.js (v18 alebo vyššia)
- Upstash Redis účet (zadarmo na [upstash.com](https://upstash.com))

## 🔧 Inštalácia

1. **Nainštalujte závislosti:**

```bash
npm install
```

2. **Vytvorte `.env` súbor:**

Skopírujte `.env.example` a vytvorte `.env`:

```bash
copy .env.example .env
```

3. **Nastavte Upstash Redis:**

- Vytvorte si účet na [upstash.com](https://upstash.com)
- Vytvorte novú Redis databázu
- Skopírujte **REST URL** a **REST TOKEN** z dashboard
- Vložte ich do `.env` súboru:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
XML_URL=https://www.drogeriadomov.sk/export/products.xml
```

## 🎯 Spustenie

**Produkčný režim:**

```bash
npm start
```

**Vývojový režim (s auto-reloadom):**

```bash
npm run dev
```

## 📊 Ako to funguje

1. **Okamžité spustenie**: Pri štarte aplikácie sa hneď vykoná prvý scraping
2. **Pravidelné aktualizácie**: Každých 12 hodín (o 00:00 a 12:00) sa automaticky spustí nový scraping
3. **Ukladanie do Redis**:
   - Každý produkt sa uloží pod kľúčom `product:{id}`
   - Zoznam všetkých ID je v `products:all_ids`
   - Metadata o poslednej aktualizácii v `products:last_update`
   - Počet produktov v `products:count`

## 📁 Štruktúra projektu

```
xml-parser-upstash/
│
├── index.js           # Hlavný súbor s plánovačom
├── xmlParser.js       # Modul pre sťahovanie a parsovanie XML
├── redisClient.js     # Modul pre komunikáciu s Upstash Redis
├── package.json       # Node.js závislosti a scripty
├── .env              # Konfigurácia (vytvorte z .env.example)
├── .env.example      # Vzorová konfigurácia
└── README.md         # Táto dokumentácia
```

## 🔑 Redis Kľúče

- `product:{id}` - Údaje o jednotlivom produkte (JSON)
- `products:all_ids` - Set všetkých product ID
- `products:last_update` - ISO timestamp poslednej aktualizácie
- `products:count` - Celkový počet produktov

## 🛠️ Pokročilé použitie

### Zmena intervalu aktualizácií

Upravte cron expression v `index.js`:

```javascript
// Každých 12 hodín (default)
const schedule = '0 */12 * * *';

// Každých 6 hodín
const schedule = '0 */6 * * *';

// Každý deň o polnoci
const schedule = '0 0 * * *';

// Každú hodinu
const schedule = '0 * * * *';
```

### Prístup k dátam v Redis

```javascript
import { getAllProducts, getUpdateMetadata } from './redisClient.js';

// Získať všetky produkty
const products = await getAllProducts();

// Získať metadata
const metadata = await getUpdateMetadata();
console.log(`Last update: ${metadata.lastUpdate}`);
console.log(`Product count: ${metadata.count}`);
```

## 🐛 Riešenie problémov

**Problém s pripojením k Redis:**
- Skontrolujte, či sú správne nastavené `UPSTASH_REDIS_REST_URL` a `UPSTASH_REDIS_REST_TOKEN`
- Overte si, že máte aktívnu Redis databázu na Upstash

**XML sa nepodarilo naparsovať:**
- Skontrolujte, či je URL dostupná
- XML štruktúra sa mohla zmeniť - upravte `extractProducts()` funkciu v `xmlParser.js`

**Node.js chyby:**
- Uistite sa, že používate Node.js v18 alebo vyššiu verziu
- Skúste zmazať `node_modules` a spustiť `npm install` znova

## 📝 Licencia

ISC

## 👨‍💻 Autor

Vytvorené pre automatické scrapovanie produktov z drogeriadomov.sk

---

**Poznámka**: Pred použitím sa uistite, že scrapovanie danej webstránky nie je v rozpore s ich podmienkami použitia.
