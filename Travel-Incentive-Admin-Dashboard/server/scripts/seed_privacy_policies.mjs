#!/usr/bin/env node
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import PrivacyPolicy from '../models/PrivacyPolicy.js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-admin';

const globalPrivacyText = `CONSENSO AL TRATTAMENTO DEI DATI PERSONALI FORNITI
Preso atto della specifica informativa di cui all’art. 10 della legge n. 675/96 e del seguente decreto legislativo n. 467 del 28 dicembre 2001, acconsento, al trattamento e alla comunicazione dei miei dati personali, forniti con il modulo di adesione al viaggio, a opera dei soggetti indicati nella predetta informativa e nei limiti di cui alla stessa, vale a dire in funzione di una corretta gestione delle finalità indicate nell’informativa stessa.

Rimane fermo che tale consenso è condizionato al rispetto delle disposizioni della vigente normativa.

Acconsento, inoltre, alla pubblicazione delle immagini sul sito web dell’organizzatore www.sararossoincentive.com per utilizzarle, senza fini di lucro, come documentazione del viaggio svolto. L'utilizzo delle immagini è da considerarsi effettuato in forma del tutto gratuita.

Il partecipante al viaggio prende atto e riconosce che [NOME CLIENTE] e la società organizzativa SaraRosso Incentive Sa, non saranno in alcun modo responsabili per danni di ogni genere che il partecipante dovesse subire o causare per qualsivoglia ragione, in occasione del viaggio.`;

const ibizaPrivacyText = `INFORMATIVA SPECIFICA PER IL VIAGGIO A IBIZA

CONDIVISIONE DATI CON AUTORITÀ LOCALI
Si informa che, in ottemperanza alle normative locali delle Isole Baleari, i dati del passaporto e i nominativi dei partecipanti saranno condivisi con le autorità portuali per le escursioni marittime previste.

IMMAGINI E VIDEO DURANTE EVENTI ESCLUSIVI
Durante il "White Party" e le attività in catamarano, verranno effettuate riprese video professionali. La partecipazione a tali eventi implica il consenso esplicito all'utilizzo di tale materiale per video aziendali interni.`;

const createInitialHtml = (text) => {
  const textWithLink = text.replace(
    'www.sararossoincentive.com',
    '<a href="http://www.sararossoincentive.com" target="_blank" rel="noopener noreferrer">www.sararossoincentive.com</a>'
  );
  return textWithLink.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`).join('');
}

const policies = [
  { title: 'Global Privacy Policy', trip: null, content: createInitialHtml(globalPrivacyText) },
  { title: 'Privacy Policy - Trip to Ibiza', trip: 'Trip to Ibiza', content: createInitialHtml(ibizaPrivacyText) }
];

(async () => {
  try {
    console.log('Connecting to', MONGO_URI);
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    for (const p of policies) {
      const exists = await PrivacyPolicy.findOne({ title: p.title }).exec();
      if (exists) {
        console.log('Policy exists, updating:', p.title);
        exists.content = p.content;
        exists.trip = p.trip;
        await exists.save();
      } else {
        console.log('Creating policy:', p.title);
        await PrivacyPolicy.create(p);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
