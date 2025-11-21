DBA — Documentazione per la creazione e il provisioning del database MongoDB
=======================================================================

Scopo
-----
Documento rivolto al DBA per creare e configurare il database MongoDB necessario all'app `travel-incentive-app`.
Contiene: nome DB, utenti/ruoli consigliati, collection schema summary, indici critici, comandi mongo per creazione/validatori, esempi di documenti, raccomandazioni operative e note di migrazione.

Informazioni generali
---------------------
- Nome DB (consigliato): `travel-incentive`
- URI di connessione (esempio locale): `mongodb://<db_user>:<db_password>@db-host:27017/travel-incentive?authSource=admin`
- Versione raccomandata: MongoDB 6.x o superiore (compatibile con Mongoose 8.x usato nel progetto).
- Storage engine: WiredTiger (default). Abilitare compression (zlib/snappy) se necessario.

Sicurezza e accesso
-------------------
- Autenticazione: attivare `auth` (non consentire connessioni anonime).
- TLS: usare TLS tra app e DB in produzione.
- Network: limitare accesso solo alle IP delle applicazioni / VPC.
- Creare due utenti DB:
  - `app_user` (username di applicazione): ruolo `readWrite` sul database `travel-incentive`.
  - `dba_user` (per operazioni di amministrazione/restore): ruolo `dbAdmin`, `readWrite` sul DB `travel-incentive` e `backup` se necessario.

Esempio di comandi `mongosh` per creare utenti

```js
// Connetti come admin
use admin
// Crea l'utente DB admin (se non esiste già)
db.createUser({
  user: 'dba_user',
  pwd: 'SostituisciConPasswordSicura',
  roles: [ { role: 'userAdminAnyDatabase', db: 'admin' }, { role: 'clusterMonitor', db: 'admin' } ]
})

// Crea l'utente dell'app
use travel-incentive
db.createUser({
  user: 'app_user',
  pwd: 'ReplaceWithStrongPassword',
  roles: [ { role: 'readWrite', db: 'travel-incentive' } ]
})
```


Collections principali e schema dettagliato
-----------------------------------------
Qui sotto trovi un documento esteso e strutturato per ciascuna collection principale: schema (tipi), campi obbligatori, suggerimenti per indici, validatore JSON Schema (quando opportuno), e un esempio di documento. Questo è pensato per essere consegnato al DBA.

Nota: i nomi delle collection corrispondono ai file `server/models/*.mjs` e all'output del dump locale.

------------------------------------------------------------
1) `travelinfos`
- Scopo: singolo documento contenente informazioni globali sull'evento/viaggio (banner, voli, contatti di emergenza, configurazione registrazione).
- Tipi principali:
  - `welcomeBannerImageUrl`: String
  - `outboundFlights`: Array of Objects {
      id: String,
      airline: String,
      flightNumber: String,
      departureGroup: String,
      departure: { airport: String, code: String, time: String, date: String },
      arrival: { airport: String, code: String, time: String, date: String },
      duration: String
    }
  - `returnFlights`: same shape as `outboundFlights`
  - `emergencyContacts`: Array of Objects {
      id: String (required),
      name: String (required),
      phone: String (required),
      type: String (required),
      email: String,
      availability: String,
      languages: [String],
      services: [String],
      targetAirports: [String],
      response_time: String,
      notes: String
    }
  - `registration`: Object {
      deadline: String (ISO date string, required),
      status: String (required),
      config: { formPath: String, successRedirect: String, requiredDocuments: [String] }
    }
- Campi obbligatori (operativi): `registration.deadline`, `registration.status`.
- Indici: collection tipicamente single-doc; non servono indici particolari. Se si normalizza `emergencyContacts` in collection separata, prevedere indici su `eventId` e `type`.
- Esempio:

```json
{
  "welcomeBannerImageUrl": "https://.../banner.png",
  "outboundFlights": [ { "id": "fl_mxp_out", "airline": "Etihad", "flightNumber": "EY 82", "departureGroup": "Milano Malpensa", "departure": { "airport":"Milano Malpensa", "code":"MXP", "time":"09:55", "date":"2025-11-06" }, "arrival": { "airport":"Abu Dhabi", "code":"AUH", "time":"19:00", "date":"2025-11-06" }, "duration":"06h05" } ],
  "emergencyContacts": [ { "id":"ec1", "name":"Assistenza Viaggio 24/7", "phone":"+39 02 123456", "type":"Coordinatore" } ],
  "registration": { "deadline": "2025-09-30T23:59:59Z", "status": "open", "config": { "formPath":"/registration", "successRedirect":"/profile" } }
}
```

------------------------------------------------------------
2) `configs` (collection `config`)
- Scopo: key-value globali e liste di opzioni utilizzate dall'app (es. `emergencyContactsType`).
- Tipi: oggetto con chiavi dinamiche; tipicamente single-doc.
- Indici: non necessari per single-doc.
- Esempio:

```json
{ "emergencyContactsType": ["Tour Leader","Assistenza Aeroportuale","Assistenza Hotel"] }
```

------------------------------------------------------------
3) `users`
- Scopo: anagrafica utenti e credenziali (password hashed).
- Schema (principali campi e tipi):
  - `_id`: ObjectId
  - `email`: String (required, unique, indexed)
  - `firstName`, `lastName`: String (required)
  - `password`: String (hashed, required, `select:false` in Mongoose)
  - `passwordHash`: String (compatibilità test)
  - `groupName`: String
  - `auth_provider_id`: String (sparse unique)
  - `role`: String enum ['admin','user','super_admin','guide'] (required)
  - `authorizationCode`: String (required se role == 'admin')
  - `certifications`: [String] (required se role == 'guide')
  - `passport`: { number: String, issueDate: Date, expiryDate: Date }
  - `preferences`: Map
  - `mobilePhone`: String
  - `createdAt`, `updatedAt`: Date
- Indici consigliati (dal modello):
  - `email` unique
  - `auth_provider_id` unique sparse
  - `lastName, firstName` compound
  - `groupName`, `role`
- Validazione/trigger: pre-validate copies `passwordHash` to `password` for compatibility; pre-save updates `updatedAt`.
- Esempio:

```json
{
  "_id": "690f9a3d0f849e8f4d5fa020",
  "email": "tonypakati@gmail.com",
  "firstName": "Tony",
  "lastName": "Pakati",
  "password": "$2b$10$...",
  "groupName": "Default",
  "role": "user",
  "mobilePhone": "+39 3470303003"
}
```

------------------------------------------------------------
4) `events`
- Scopo: definizione eventi (titolo, date, agenda, immagini).
- Schema (principali campi):
  - `title`: String (required)
  - `subtitle`, `brandImageUrl`, `backgroundImageUrl`
  - `registrationDeadline`: Date
  - `agenda`: Array di giorni > items (vedi `Event.mjs`)
  - `timestamps`
- Esempio ridotto: vedi `server/models/Event.mjs`.

------------------------------------------------------------
5) `flights`
- Scopo: singoli voli collegati ad un `eventId`.
- Schema:
  - `eventId`: ObjectId (ref `events`, required)
  - `direction`: 'outbound'|'return'
  - `airline`, `flightNumber`, `departureGroup` (String)
  - `departure`: { airport, code, time, date (Date) }
  - `arrival`: { airport, code, time, date (Date) }
  - `duration`: String
- Indici consigliati: `{ eventId: 1 }`, `{ eventId:1, departureGroup:1, flightNumber:1 }` se ricerche frequenti.
- Esempio:

```json
{
  "_id": "691732e1675a189de975c55a",
  "eventId": "691732e1675a189de975c53a",
  "direction": "outbound",
  "airline": "Etihad Airways",
  "flightNumber": "EY 82",
  "departureGroup": "Milano Malpensa",
  "departure": { "airport":"Milano Malpensa", "code":"MXP", "time":"09:55", "date":"2025-11-05T23:00:00.000Z" },
  "arrival": { "airport":"Abu Dhabi", "code":"AUH", "time":"19:00", "date":"2025-11-05T23:00:00.000Z" }
}
```

------------------------------------------------------------
6) `emergencycontacts`
- Scopo: contatti di emergenza per evento/airport/gruppo.
- Schema:
  - `eventId`: ObjectId (ref `events`, required)
  - `name`: String (required)
  - `departureGroup`: String
  - `phone`: String (required)
  - `type`: String (required)
  - `email`: String
  - `targetAirports`: [String]
  - `languages`: [String]
  - `services`: [String]
  - `createdAt`, `updatedAt`
- Indici consigliati:
  - `{ eventId: 1 }`
  - `{ type: 1 }` (se si filtrano per ruolo)
  - `{ departureGroup: 1 }` (se si cercano contatti per gruppo di partenza)
- Nota: il progetto contiene sia `travelinfos.emergencyContacts` (embedded) sia la collection `emergencycontacts`. Suggerisco di normalizzare in `emergencycontacts` e modificare il backend per popolare la vista usata dal frontend.
- Esempio:

```json
{
  "_id": "691732e1675a189de975c56a",
  "eventId": "691732e1675a189de975c53a",
  "name": "Assistenza Viaggio 24/7",
  "phone": "+39 02 123456",
  "type": "Supporto H24",
  "createdAt": "2025-11-14T13:47:13.824Z"
}
```

------------------------------------------------------------
7) `registrations`
- Scopo: registrazione utenti agli eventi (form dati, voli, status).
- Schema notevole (campi principali):
  - `userId`: ObjectId (ref `users`, required)
  - `eventId`: ObjectId (ref `events`, required)
  - `outboundFlightId`, `returnFlightId`: String/ObjectId
  - `groupName`: String
  - `status`: enum ['pending','confirmed','cancelled','waitlisted']
  - `form_data`: Object (molti campi: companyName, firstName, lastName, passport, billing, consents...)
  - `submittedAt`, `createdAt`, `updatedAt`
- Indici critici (da applicare):
  - `{ userId: 1, eventId: 1 }` UNIQUE (garantisce max 1 registrazione per utente/evento)
  - `{ eventId: 1, submittedAt: -1 }`
  - `{ outboundFlightId: 1 }`, `{ returnFlightId: 1 }`, `{ groupName: 1 }`, `{ status: 1 }`
- JSON Schema validator di esempio (minimo):

```js
{
  $jsonSchema: {
    bsonType: 'object',
    required: ['userId','eventId','outboundFlightId','returnFlightId','form_data'],
    properties: {
      userId: { bsonType: 'objectId' },
      eventId: { bsonType: 'objectId' },
      outboundFlightId: { bsonType: 'string' },
      returnFlightId: { bsonType: 'string' },
      groupName: { bsonType: 'string' },
      status: { enum: ['pending','confirmed','cancelled','waitlisted'] }
    }
  }
}
```

Esempio:

```json
{
  "userId": "690f9a3d0f849e8f4d5fa020",
  "eventId": "691732e1675a189de975c53a",
  "outboundFlightId": "fl_mxp_out",
  "returnFlightId": "fl_mxp_ret",
  "groupName": "Default",
  "status": "pending",
  "form_data": { "companyName": "Example Co.", "firstName": "Mario", "lastName": "Rossi" }
}
```

------------------------------------------------------------
8) `documents`
- Scopo: file caricati dagli utenti (boarding pass, assicurazione, ecc.).
- Schema:
  - `userId`: String/ObjectId
  - `flightId`: String
  - `filename`, `originalName`, `mimeType`, `size`, `url`
  - `documentType`: enum ['boarding_pass','insurance','visa','itinerary','general']
  - `uploadedAt`, timestamps
- Indici: `{ userId: 1, flightId: 1, uploadedAt: -1 }`
- Esempio: vedi `server/models/Document.mjs`.

------------------------------------------------------------
9) `photos`
- Scopo: foto caricate durante l'evento.
- Schema:
  - `eventId`, `url`, `thumbnailUrl`, `userId`, `userName`, `caption`, `day`, `timestamp`, `likes`
- Indici consigliati: `{ eventId: 1, timestamp: -1 }`

------------------------------------------------------------
10) `groupflightassignments`
- Scopo: regole di assegnazione dei gruppi ai voli.
- Schema e vincoli (vedi `GroupFlightAssignment.mjs`):
  - unique index: `{ eventId, groupName, departureAirportCode }`
  - campi: `outboundFlightId`, `returnFlightId`, `capacity` (max/current), `priority`, `status`
- Nota: contiene middleware di validazione che verifica coerenza con i voli referenziati.

------------------------------------------------------------
11) `trips`
- Scopo: dati dell'evento/viaggio utilizzati da `GET /api/trip` (eventDetails, agenda, announcements, locationDetails).
- Schema: complesso e annidato (vedi `server/models/Trip.mjs`).


Indici da creare (comandi mongo)
--------------------------------
Eseguire questi comandi con `mongosh` autenticato su `travel-incentive`:

```js
use travel-incentive

// Users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ auth_provider_id: 1 }, { unique: true, sparse: true })
db.users.createIndex({ lastName: 1, firstName: 1 })
db.users.createIndex({ groupName: 1 })

// Registrations
db.registrations.createIndex({ userId: 1, eventId: 1 }, { unique: true })
db.registrations.createIndex({ eventId: 1, submittedAt: -1 })
db.registrations.createIndex({ userId: 1 })

// Documents
db.documents.createIndex({ userId: 1, flightId: 1, uploadedAt: -1 })

// Emergency Contacts
db.emergencycontacts.createIndex({ eventId: 1 })
db.emergencycontacts.createIndex({ type: 1 })

// Flights
db.flights.createIndex({ eventId: 1 })

// Group Flight Assignment
db.groupflightassignments.createIndex({ eventId: 1, groupName: 1, departureAirportCode: 1 }, { unique: true })

// Photos
db.photos.createIndex({ eventId: 1, timestamp: -1 })

// Config (single doc) - optional
// db.config.createIndex({ /* none required for single doc */ })
```

Validazione JSON Schema (opzionale ma raccomandata)
---------------------------------------------------
Per aumentare robustezza, si può abilitare validator per collection critiche (es. `registrations`, `emergencycontacts`). Esempio minimo per `registrations`:

```js
db.createCollection('registrations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId','eventId','outboundFlightId','returnFlightId','form_data'],
      properties: {
        userId: { bsonType: 'objectId' },
        eventId: { bsonType: 'objectId' },
        outboundFlightId: { bsonType: 'string' },
        returnFlightId: { bsonType: 'string' },
        groupName: { bsonType: 'string' },
        status: { enum: ['pending','confirmed','cancelled','waitlisted'] }
      }
    }
  }
})
```

Note operative e di migrazione
------------------------------
- Fonte di verità `emergencyContacts`: nel codice esistono sia `travelinfos.emergencyContacts` (embedded array in `travelinfos`) sia la collection `emergencycontacts` separata.
  - Raccomandazione: scegliere una sola sorgente di verità. Consiglio: mantenere `emergencycontacts` come collection separata con riferimento `eventId`, e modificare `GET /api/travel-info` lato backend per popolare/sincronizzare la vista che ora viene letta da `travelinfos`.
  - Se si decide per la normalizzazione, fornire uno script di migrazione che:
    1. Legge `travelinfos` e estrae `emergencyContacts` embedded
    2. Per ogni contact crea o aggiorna documento in `emergencycontacts` con `eventId` appropriato
    3. Rimuove `emergencyContacts` embedded o mantiene come cache a lettura sola

- Import dati esistenti: usare `mongodump`/`mongorestore` o script Node per trasformazione dei documenti.

Esempi di documenti (estratti dal DB locale)
--------------------------------------------
1) `travelinfos` (estratto - emergencyContacts)

```json
{
  "emergencyContacts": [
    { "id": "ec1", "name": "Assistenza Viaggio 24/7", "phone": "+39 02 123456", "type": "Coordinatore", "availability": "24/7", "languages": ["Italiano","English"] },
    { "id": "ec3", "name": "Responsabile Gruppo", "phone": "+39 333 1234567", "type": "Tour Leader" }
  ]
}
```

2) `configs`

```json
{ "emergencyContactsType": ["Tour Leader","Assistenza Aeroportuale","Assistenza Hotel"] }
```

3) `registrations` (schema parziale)

```json
{
  "userId": ObjectId("690f9a3d0f849e8f4d5fa020"),
  "eventId": ObjectId("691732e1675a189de975c53a"),
  "outboundFlightId": "fl_mxp_out",
  "returnFlightId": "fl_mxp_ret",
  "groupName": "Default",
  "status": "pending",
  "form_data": { "companyName": "Example Co.", "firstName": "Mario", "lastName": "Rossi" }
}
```

Backup / restore
----------------
Consigliare procedure di backup regolari (snapshot o `mongodump`). Esempi:

```bash
# Backup completo
mongodump --uri="mongodb://dba_user:pwd@db-host:27017/travel-incentive?authSource=admin" --out /backups/travel-incentive-$(date +%F)

# Restore
mongorestore --uri="mongodb://dba_user:pwd@db-host:27017" --nsInclude="travel-incentive.*" /backups/travel-incentive-YYYY-MM-DD
```

Monitoring e SLA
----------------
- Raccomandato: usare MongoDB Atlas (monitoring integrato) o Prometheus + Grafana.
- Configurare alert su: connection count, replication lag (se replica set), disk usage, page faults.

Replica set e alta disponibilità
-------------------------------
- Per produzione: configurare cluster replica set (minimo 3 nodi) o utilizzare MongoDB Atlas.
- Abilitare backup automatici e point-in-time recovery se possibile.

Passi consigliati per il DBA (checklist)
----------------------------------------
1. Creare il DB `travel-incentive`.
2. Creare gli utenti DB (`app_user`, `dba_user`) con password sicure e ruoli corretti.
3. Creare le collection con eventuali validator (soprattutto `registrations` e `emergencycontacts`).
4. Creare gli indici mostrati sopra.
5. Valutare e pianificare migrazione per `emergencyContacts` (embed → collection) se si sceglie di normalizzare.
6. Abilitare backup e monitoring.
7. Fornire stringa di connessione e credenziali per gli ambienti (dev/staging/prod) all'app team in modo sicuro.

Acceptance criteria (per il handoff)
------------------------------------
- DB `travel-incentive` creato e raggiungibile dalla rete applicativa.
- Utente `app_user` esistente e testable con `readWrite` su `travel-incentive`.
- Indici principali creati e verificati (es. unique index su registrations userId+eventId; email unique users).
- Documentazione del luogo dove sono salvati i backup e quando vengono eseguiti.

Contatti
--------
Per domande su mapping dati o per un run dello script di migrazione, contatta lo sviluppatore responsabile del progetto.


---
File collegati (nel repository):
- `server/models/*.mjs` — definizioni Mongoose usate come riferimento per gli schemi
- `server/config/database.mjs` — contiene la variabile `MONGODB_URI` (attualmente hard-coded)
- `server/controllers/*.mjs` — dove vengono letti/scritti i dati dalle collection





1. Scheda Tecnica (Technical Specification)
Panoramica Architetturale
L'applicazione è una Single Page Application (SPA) progettata per la gestione amministrativa di viaggi incentive. L'architettura è modulare, basata su componenti riutilizzabili, con un rendering interamente lato client (Client-Side Rendering).
Stack Tecnologico
Linguaggio: TypeScript (v. ES6+), per garantire tipizzazione statica e robustezza del codice.
Framework Frontend: React (v. 19.2.0), utilizzato per la gestione del ciclo di vita dei componenti e del DOM virtuale.
Styling & UI:
Tailwind CSS: Framework utility-first per la gestione dello stile, layout responsive (Grid/Flexbox) e design system coerente (colori, spaziature, tipografia).
Font: "Inter" (Google Fonts) per una leggibilità ottimale su interfacce data-heavy.
Icone: Set di icone SVG personalizzate (icons.tsx) integrate direttamente come componenti React per ridurre le dipendenze esterne.
Gestione dello Stato e dei Dati
State Management: Utilizzo esclusivo dei React Hooks (useState, useEffect, useMemo, useRef) per la gestione dello stato locale e globale.
Data Flow: Pattern "Lifting State Up". Lo stato principale (viaggi, partecipanti, documenti, contatti) è centralizzato nel componente root (App.tsx) e distribuito ai componenti figli tramite props.
Mock Data: Attualmente, l'applicazione utilizza array di oggetti JSON statici (es. initialContacts, participantsData) per simulare il database.
Persistenza: Attualmente volatile (in memoria). In un ambiente di produzione, questo strato verrebbe sostituito da chiamate API REST o GraphQL.
Funzionalità Tecniche Avanzate
Editor WYSIWYG Semplificato: Implementato custom (document.execCommand) per la formattazione di testi legali (Privacy/Termini).
Drag & Drop: Implementato nativamente tramite HTML5 Drag and Drop API per il builder dei Form (ordinamento sezioni).
Export CSV: Generazione client-side di file CSV (Blob creation) per l'esportazione dei dati dei partecipanti.
Dynamic Routing (Simulato): Navigazione gestita tramite renderizzazione condizionale basata sullo stato activeView e formMode, senza ricaricamento della pagina.
2. Scheda Funzionale (Functional Specification)
Obiettivo del Prodotto
Fornire agli amministratori uno strumento centralizzato per configurare, monitorare e gestire ogni aspetto operativo dei viaggi incentive aziendali, dalla creazione dell'evento fino alla gestione delle emergenze in loco.
Moduli Funzionali Principali
1. Dashboard Operativa
Panoramica a Schede: Visualizzazione dello stato dei viaggi suddivisi per fase:
In Creazione: Monitoraggio completezza dati (progress bar).
Pronti per l'invio: Azioni rapide per inviare inviti massivi.
Registrazioni: Grafici circolari per monitorare l'avanzamento delle iscrizioni.
Partiti/In Corso: Alert operativi in tempo reale (es. ritardi voli).
Ricerca Globale: Barra di ricerca per individuare rapidamente viaggi o partecipanti.
2. Gestione Viaggi (Trip Management)
Wizard di Creazione: Configurazione passo-passo di un viaggio.
Info Base: Date, cliente, destinazione, gruppi (Milano, Roma, VIP, ecc.).
Logistica Voli: Gestione tratte andata/ritorno differenziate per gruppo.
Dettagli: Dress code, hotel, agenda, contatti dedicati.
Documentazione: Associazione di Privacy Policy e Termini specifici o globali.
Lista Viaggi: Tabella ordinabile e filtrabile con indicatori di stato (Draft, Ready, Completed).
3. Gestione Partecipanti
Database Iscritti: Lista dettagliata per ogni viaggio con stato (Invited, Registered, To Invite).
Azioni Massive:
Selezione multipla per invio solleciti (Reminder) o inviti.
Export in formato CSV per uso esterno.
Filtri: Filtraggio avanzato per stato iscrizione o gruppo di appartenenza.
4. Form Builder (Costruttore Moduli)
Design Drag & Drop: Interfaccia visuale per comporre il form di registrazione che vedranno gli utenti.
Personalizzazione Campi: Possibilità di attivare/disattivare campi specifici (es. Passaporto, Intolleranze) e renderli obbligatori o opzionali.
Sezioni Modulari: Gestione di sezioni come "Dati Anagrafici", "Logistica", "Accompagnatori".
5. Comunicazioni & Inviti
Gestore Template Email: Creazione e modifica dei testi delle email di invito con variabili dinamiche (es. [NOME_PARTECIPANTE]).
Centro Messaggi: Invio di comunicazioni di servizio (Info) o allerte urgenti (Alert) ai partecipanti, notifiche push o email.
6. Gestione Legale e Info Utili
Privacy & Termini: Editor di testo ricco per redigere informative. Supporta logica "Globale" (valida per tutti) o "Specifica" (sovrascritta per singolo viaggio).
Info Utili: Schede informative sulla destinazione (Valuta, Fuso Orario, Documenti necessari) riutilizzabili su più viaggi.
7. Anagrafica Staff (Contatti)
Rubrica: Gestione dei contatti operativi (Tour Leader, Assistenza Aeroportuale).
Assegnazione: Possibilità di assegnare specifici referenti a specifici gruppi di viaggio per l'assistenza in app.