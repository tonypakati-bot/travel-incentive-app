# Server - Configurazione invio email

Questa documentazione descrive le variabili d'ambiente e come testare l'endpoint di invio email presente in `server/routes/sendInvites.js`.

## Variabili d'ambiente rilevanti

- `SMTP_HOST` - host del server SMTP (es. `smtp.sendgrid.net`). Se non impostato, verrà usato Ethereal per test locali.
- `SMTP_PORT` - porta del server SMTP (es. `587` o `465`). Default: `587`.
- `SMTP_SECURE` - `true` se si usa TLS su porta 465, altrimenti `false`.
- `SMTP_USER` - username o API key per autenticazione SMTP.
- `SMTP_PASS` - password o API key per autenticazione SMTP.
- `FROM_EMAIL` - indirizzo mittente (es. `no-reply@tuodominio.com`). Default: `no-reply@example.com`.
- `REGISTRATION_BASE_URL` - base URL usato per generare `[LINK_REGISTRAZIONE]` nel template (es. `https://app.example.com/register`).
- `CONCURRENCY` - numero massimo di invii concorrenti (default `6`).

> Nota: assicurati che il mittente (`FROM_EMAIL`) sia autorizzato dal provider SMTP e che SPF/DKIM siano configurati per il dominio in produzione.

## Esempio `.env` per test locale (Ethereal)

Se vuoi usare Ethereal (comodo per sviluppo), non impostare `SMTP_HOST` e il server genererà automaticamente un account Ethereal temporaneo.

Esempio minimale (.env):

```
# leave SMTP_HOST empty to use Ethereal
FROM_EMAIL=no-reply@local.test
REGISTRATION_BASE_URL=http://localhost:3000/register
CONCURRENCY=4
```

## Esempi per provider (SendGrid)

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=no-reply@tuodominio.com
REGISTRATION_BASE_URL=https://app.tuodominio.com/register
CONCURRENCY=8
```

## Come testare localmente

1. Avvia il server:

```bash
cd server
npm install
npm run dev   # o il comando che usi per avviare il server
```

2. Esegui una richiesta di prova (curl):

```bash
curl -X POST http://localhost:5001/api/invites/send \
  -H "Content-Type: application/json" \
  -d '{"tripName":"Sales Kick-off Dubai","emailBody":"Ciao [NOME_PARTECIPANTE],\nPartecipa al viaggio: [LINK_REGISTRAZIONE]"}'
```

3. Se usi Ethereal, la risposta JSON conterrà `previews` con link `previewUrl` per visualizzare l'email inviata su Ethereal.

## Raccomandazioni per produzione

- Usa un provider affidabile (SendGrid, Mailgun, SES). Configura SPF/DKIM per il dominio.
- Non esporre endpoint di invio senza autenticazione o autorizzazioni adeguate.
- Per invii massivi, usa una coda (es. BullMQ + Redis) e gestisci retry/backoff e metriche.
- Tieni traccia dei bounce/hard-failures e implementa un meccanismo di rimozione o sospensione per indirizzi con troppe segnalazioni.

Se vuoi, posso aggiungere un esempio di `docker-compose` che include Redis e una job worker POC.
