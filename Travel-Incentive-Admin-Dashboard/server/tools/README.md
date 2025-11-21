# Debug / DB checks (archivio)

Questo file documenta i comandi e gli snippet usati per debugare la persistenza dei `Trip` durante l'investigazione E2E.

Nota: gli script temporanei (`check-trip-by-id.js`, `check-trip.js`, `find-trip-across-dbs.js`) sono stati rimossi dalla repo per pulizia. Qui trovi invece comandi ed esempi per riprodurre le verifiche manualmente o ricreare gli script se necessario.

## Contesto
- Server dev: `http://localhost:5001` (variabile `PORT` in `.env`).
- DB di default usato dal server in questa repo: `MONGO_URI` impostato in `server/.env` (es. `mongodb://localhost:27017/travel-db`).
- Frontend dev server (vite) proxya `/api` -> `http://127.0.0.1:5001`.

## Comandi rapidi

- Creare un trip via `curl` (test rapido POST):

```bash
curl -i -X POST http://localhost:5001/api/trips \
  -H 'Content-Type: application/json' \
  -d '{"clientName":"CLI Test","name":"CLI Trip","subtitle":"sub","description":"desc","startDate":"2025-12-01","endDate":"2025-12-05","status":"draft","settings":{}}'
```

- Leggere lo stesso trip via `curl` (GET):

```bash
curl -i http://localhost:5001/api/trips/<tripId>
```

Se il GET ritorna `404`, verifica:
- il `MONGO_URI` in `server/.env` (o il valore di `process.env.MONGO_URI`),
- che il server in ascolto su `5001` sia lo stesso processo che legge quella stessa `MONGO_URI`.

## Esempi con `mongo` (CLI)
- Connettersi al DB usato dal server e cercare il documento:

```bash
# esempio: con mongo shell
mongosh "mongodb://localhost:27017/travel-db"
use travel-db
db.trips.find({ _id: ObjectId("6920886e2a323ee5c727a491") })
```

## Come ricreare gli script di debug (veloce)
Se vuoi ricreare i tools eliminati, questi erano i comportamenti principali:

- `tools/check-trip-by-id.js`: script Node che importava `mongoose` e `server/models/Trip.js` e chiamava `Trip.findById(id)`.
- `server/tools/find-trip-across-dbs.js`: script Node che eseguiva `mongoose.createConnection` su più candidate URI locali e cercava gli `_id` passati come argomenti.

Esempio minimale (ricreazione rapida):

```js
// minimal-check.js (posizionato in server/ per risolvere le dipendenze)
import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/travel-db';
(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('connected to', MONGO_URI);
  const id = process.argv[2];
  if (!id) return console.error('Usage: node minimal-check.js <id>');
  const t = await Trip.findById(id).lean();
  console.log(t ? JSON.stringify(t, null, 2) : 'NOT FOUND');
  process.exit(0);
})();
```

Poi esegui:
```bash
cd server
node minimal-check.js 6920886e2a323ee5c727a491
```

## Buone pratiche per future investigazioni
- Preferire `node` (server-side) per chiamare direttamente il backend in modo da evitare il proxy Vite che restituisce pagine HTML in caso di errori.
- Loggare `MONGO_URI` e informazioni minime all'avvio del server in ambienti di debug.
- Usare `find-trip-across-dbs.js` (o un equivalente) quando sospetti che ci siano più DB locali con nomi diversi (es. `travel-db`, `travel-admin`, `travel`).

---
Se vuoi, posso:
- ricreare uno di questi script sotto `server/tools/` (committabile) con modalità `--dry-run` di default;
- aggiungere uno script `npm run debug:check-trip <id>` nel `server/package.json` che esegue un controllo rapido.

Dimmi se preferisci che ricrei lo script o aggiunga lo `npm` helper. 
