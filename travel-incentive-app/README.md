<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# travel-incentive-app

Breve guida per avviare il progetto in locale, variabili d'ambiente richieste e comandi utili.

## Prerequisiti

- Node.js (v18+ raccomandato)
- npm
- MongoDB in esecuzione su `mongodb://localhost:27017`

## Installazione

Dalla radice del progetto:

```bash
# Installa dipendenze frontend + root dev deps
npm install

# Installa dipendenze backend (cartella server)
cd server
npm install
cd ..
```

## Variabili d'ambiente richieste

- `JWT_SECRET` (obbligatoria): stringa segreta per firmare/verificare JWT. Deve essere una stringa sufficientemente lunga e sicura.
- `PORT` (opzionale): porta su cui il backend ascolta (default `5001`).
- `MONGODB_URI` (opzionale): stringa di connessione a MongoDB (default: `mongodb://localhost:27017/travel-incentive`).

Crea un file `.env` nella cartella `server` (o a livello di root se preferisci) con contenuti esempio:

```env
JWT_SECRET=metti_qui_un_segretissimo_valore_random
PORT=5001
MONGODB_URI=mongodb://localhost:27017/travel-incentive
```

## Avvio in sviluppo

1) Avvia il backend

```bash
# dalla cartella server
cd server
node server.js
# oppure (hot reload durante sviluppo)
npm run server
```

2) Avvia il frontend

```bash
# dalla radice del progetto
npm run dev
```

## Accesso

- Frontend (Vite): `http://localhost:3000` (o porta scelta da Vite, es. `3003`)
- API backend: `http://localhost:5001/api`

## Comandi utili

- `npm run build` — builda il frontend (Vite)
- `npm run preview` — preview della build Vite
- `npm start` (in `server`) — avvia il backend
- `npm run test` — esegue i test (Jest)

## Note di sicurezza e sviluppo

- Attualmente il server richiede `JWT_SECRET` al startup e terminerà se non è impostata.
- I token JWT sono salvati nel `localStorage` dal frontend (file `api.ts`). Valuta l'uso di cookie `httpOnly` per maggiore sicurezza.
- La connessione a MongoDB è al database `travel-incentive` di default; modifica `MONGODB_URI` se necessario.

## File e cartelle principali

- `server/` — codice backend (Express, Mongoose)
- `src/` — (se presente) codice sorgente frontend TypeScript/React
- `components/`, `pages/` — componenti React
- `api.ts` — client HTTP centralizzato (axios)

## Domande frequenti / Debug

- Se il server si arresta con errore su startup, verifica che `JWT_SECRET` sia impostata.
- Se Vite apre una porta diversa da `3000`, apri l'URL mostrato nel terminale.
- Per problemi con MongoDB assicurati che il servizio sia in esecuzione: `brew services start mongodb-community` (se usi Homebrew), oppure avvia `mongod` manualmente.

## Attività opzionali che posso fare

- aggiungere script `dev.sh` per avviare backend e frontend insieme;
- spostare `MONGODB_URI` in `.env` e aggiornare `server/config/database.mjs` per usarla;
- rimuovere i log sensibili (es. stampa di `JWT_SECRET`) e aprire una PR con queste modifiche.
