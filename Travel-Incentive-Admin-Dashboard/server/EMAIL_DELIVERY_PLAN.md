# Piano attività: Configurazione SMTP e rollout invio email

Questo documento contiene la lista dettagliata delle attività necessarie per abilitare l'invio di email reali dall'applicazione, con priorità, criteri di accettazione, dipendenze e suggerimenti operativi. Lo riprenderemo quando deciderai di procedere con la configurazione SMTP in staging/produzione.

## Obiettivo
- Abilitare invii email affidabili, scalabili e tracciabili per gli inviti ai viaggi (bulk e individuali).
- Garantire sicurezza delle credenziali, monitoraggio degli invii, gestione dei bounce e politiche di retry.

## Ambito
- Endpoint coinvolti: `POST /api/invites/send` (server)
- Workflow: rendering template personalizzato, invio in batch, aggiornamento status partecipanti, logging e metriche.
- Escluso (per ora): interfacce di preferenza marketing, gestione unsubscribe avanzata.

## Attività principali (ordine consigliato)

1) Scelta provider SMTP e account di test
   - Valutare: SendGrid, Mailgun, Amazon SES (costi, limiti, dashboard, supporto DKIM/SPF, regionalità).
   - Creare account di test (staging) e ottenere credenziali SMTP.
   - Criterio di accettazione: account di test pronto e credenziali verificate.

2) Ambiente e segreti
   - Definire dove conservare segreti (es. GitHub Secrets, Vault, .env in staging protetto).
   - Definire variabili env necessarie: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, `REGISTRATION_BASE_URL`, `CONCURRENCY`.
   - Criterio di accettazione: segreti disponibili nello staging e caricabili dal processo server.

3) Verifica mittente e dominio
   - Verificare dominio mittente nel provider (Sender Authentication) per SPF/DKIM.
   - Criterio di accettazione: SPF/DKIM validati o piano per farlo (DNS records pronti).

4) Aggiornare codice server (robustezza)
   - Modifiche già applicate: template personalizzato, batching, concurrency, aggiornamento status partecipante.
   - Azioni aggiuntive raccomandate:
     - Aggiungere logging strutturato (messageId, recipient, result)
     - Esporre metriche (prometheus / simple counters) per invii totali/failed/latency
     - Validare indirizzi email (basic) prima dell'invio
   - Criterio di accettazione: logging e metriche attive in staging.

5) Implementare coda di invio (consigliato per produzione)
   - Scegliere: BullMQ + Redis o altro job queue.
   - Architettura: API push job -> Redis queue -> worker che esegue invii con concurrencies e retry/backoff.
   - Gestire idempotenza e stato job (retry limit, dead-letter queue).
   - Criterio di accettazione: worker POC in staging che elabora job e registra risultati.

6) Test end-to-end (staging)
   - Eseguire invii limitati (5-20 email) verso caselle di test (includere indirizzi Gmail, Outlook, corporate) per verificare deliverability.
   - Verificare bounce, spam, e visibilità nel provider dashboard.
   - Criterio di accettazione: almeno 90% delivery to inbox per caselle di test (o documentare eccezioni e next steps).

7) Monitoraggio e alerting
   - Monitorare tassi di error (per job), bounces, eccessive rifiuti.
   - Configurare alert (es. Slack/email) se tasso di error supera soglia.
   - Criterio di accettazione: alert configurati in staging.

8) Documentazione operativa
   - Aggiornare `server/README.md` (fatto) e aggiungere runbook per problemi comuni (es. credenziali scadute, IP bloccato).
   - Criterio di accettazione: runbook approvato dal team ops.

9) Rollout in produzione
   - Piano a gradini: small cohort -> 10% utenti -> 100% (monitoraggio e rollback pronti).
   - Validare DNS, limiti provider e contatti di supporto pronto.
   - Criterio di accettazione: rollout monitorato e senza regressioni significative.

## Task tecnici dettagliati (per sviluppatori)
- Aggiungere test di integrazione che simulano invio con Ethereal (genera preview URLs) e verificano aggiornamento DB.
- Implementare endpoint amministrativo (protetto) per ri-inviare email fallite e per visualizzare lo stato invii.
- Aggiungere validazione e normalizzazione dei dati dei partecipanti prima dell'invio.
- Implementare reti di retry con esponenziale backoff e DLQ per i destinatari che falliscono ripetutamente.

## Rischi e mitigazioni
- Rischio: email finisce in spam → Mitigazione: verificare SPF/DKIM, migliorare contenuto, usare provider affidabile.
- Rischio: superamento quota provider → Mitigazione: pianificare limiti e contattare supporto/provider o usare più provider (fallback).
- Rischio: gestione credenziali → Mitigazione: usare secret manager e rotazione chiavi.

## Stima temporale indicativa
- Setup account & verif domain: 0.5 - 1 giorno (dipende accesso DNS)
- Implementare worker POC + integr tests: 1 - 2 giorni
- Test in staging & tuning: 1 - 2 giorni
- Rollout progressivo: 0.5 - 2 giorni (monitoraggio incluso)

## Prossimi passi suggeriti
1. Conferma il provider desiderato (o lascia che faccia un confronto rapido per te).
2. Seleziona se preferisci un invio sincrono leggero (attuale endpoint) o implementare subito la queue POC.
3. Ti preparo i playbook/PR per ogni step (worker, CI, secrets, runbook).

---
Se vuoi, posso creare subito il POC worker con BullMQ + Redis e uno script `scripts/enqueue-invites.js` per popolare job di test. Dimmi se procedo con il POC o se preferisci iniziare col provider e i test manuali.
