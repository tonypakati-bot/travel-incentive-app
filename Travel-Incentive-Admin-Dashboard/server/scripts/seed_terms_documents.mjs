#!/usr/bin/env node
import mongoose from 'mongoose';
import path from 'path';
import TermsDocument from '../models/TermsDocument.js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-admin';

const termsText = `PENALI, RIMBORSI E ASSICURAZIONI

PENALI
Dal 19 Luglio alla data partenza in caso di cancellazione la penale applicata sarà pari al 100% della quota.

RIMBORSI
Nessun rimborso verrà riconosciuto per mancata presentazione alla partenza, per interruzione del viaggio iniziato qualsiasi ne sia il motivo o la ragione, per mancanza o per irregolarità dei documenti personali, come nessuna responsabilità compete a SaraRosso Incentive per le situazioni sopracitate.

Assicurazione viaggio medico/bagaglio Nobis inclusa:
Massimale bagaglio di  € 1.500,00;
Massimale di € 50.000,00 per spese mediche, farmaceutiche ed ospedaliere

POLIZZA FACOLTATIVA SPESE MEDICHE E ANNULLAMENTO

Puoi stipulare la polizza più adatta alle tue esigenze contattando: emissioni@clikki.it

Usufruendo dello sconto riservato. Ricordiamo che un'eventuale polizza annullamento va stipulata almeno 30 giorni prima della partenza (prego notare che l’evento che impedisce la partecipazione al viaggio deve essere imprevedibile, documentabile, non conosciuto al momento della prenotazione e non dipendente dalla volontà dell’assicurato).`;

const tripSpecificText = `TERMINI SPECIFICI PER IL VIAGGIO A IBIZA

CLAUSOLA METEO
In caso di condizioni meteorologiche avverse che impediscano le attività in barca, verranno proposte attività alternative a terra di pari valore. Non sono previsti rimborsi monetari.

ASSICURAZIONE AGGIUNTIVA
È fortemente consigliata la stipula di un'assicurazione aggiuntiva per la copertura di attività sportive acquatiche. L'organizzazione non si assume responsabilità per incidenti derivanti da tali attività.`;

const createInitialHtml = (text) => {
  const textWithLink = text.replace(
    /emissioni@clikki\.it/g,
    '<a href="mailto:emissioni@clikki.it">emissioni@clikki.it</a>'
  );
  return textWithLink.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`).join('');
}

const docs = [
  { title: 'Termini e Condizioni', trip: null, content: createInitialHtml(termsText) },
  { title: 'Termini e Condizioni', trip: 'Trip to Ibiza', content: createInitialHtml(tripSpecificText) }
];

(async () => {
  try {
    console.log('Connecting to', MONGO_URI);
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    for (const p of docs) {
      const exists = await TermsDocument.findOne({ title: p.title, trip: p.trip }).exec();
      if (exists) {
        console.log('Document exists, updating:', p.title, p.trip);
        exists.content = p.content;
        exists.trip = p.trip;
        await exists.save();
      } else {
        console.log('Creating document:', p.title, p.trip);
        await TermsDocument.create(p);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
