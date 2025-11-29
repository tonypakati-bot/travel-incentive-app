#!/usr/bin/env node
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-db';

const expectedFields = {
  'dati-partecipante': [
    { id: 'ragione-sociale', name: 'Ragione Sociale', enabled: false, required: false },
    { id: 'nome', name: 'Nome', enabled: false, required: false },
    { id: 'cognome', name: 'Cognome', enabled: false, required: false },
    { id: 'data-di-nascita', name: 'Data di Nascita', enabled: false, required: false },
    { id: 'nazionalita', name: 'Nazionalità', enabled: false, required: false },
    { id: 'n-tel-cellulare', name: 'N. Tel. Cellulare', enabled: false, required: false },
    { id: 'email', name: 'E-mail', enabled: false, required: false },
    { id: 'passaporto', name: 'Passaporto', enabled: false, required: false },
    { id: 'esigenze-alimentari', name: 'Esigenze Alimentari', enabled: false, required: false },
  ],
  'logistica': [
    { id: 'tipologia-camera', name: 'Tipologia Camera', enabled: false, required: false },
    { id: 'aeroporto-di-partenza', name: 'Aeroporto di Partenza', enabled: false, required: false },
    { id: 'viaggio-in-business', name: 'Viaggio in Business', enabled: false, required: false },
  ],
  'consensi': [
    { id: 'informativa-sulla-privacy', name: 'Informativa sulla Privacy', enabled: false, required: true },
    { id: 'termini-e-condizioni', name: 'Termini e Condizioni', enabled: false, required: true },
  ],
  'accompagnatore': [
    { id: 'nome-accompagnatore', name: 'Nome', enabled: false, required: false },
    { id: 'cognome-accompagnatore', name: 'Cognome', enabled: false, required: false },
    { id: 'data-di-nascita-accompagnatore', name: 'Data di Nascita', enabled: false, required: false },
    { id: 'nazionalita-accompagnatore', name: 'Nazionalità', enabled: false, required: false },
    { id: 'passaporto-accompagnatore', name: 'Passaporto', enabled: false, required: false },
    { id: 'esigenze-alimentari-accompagnatore', name: 'Esigenze Alimentari', enabled: false, required: false },
    { id: 'partecipazione-meeting', name: 'Partecipazione Meeting', enabled: false, required: false },
  ],
  'fatturazione': [
    { id: 'intestatario-fattura', name: 'Intestatario Fattura', enabled: false, required: false },
    { id: 'indirizzo-di-fatturazione', name: 'Indirizzo di Fatturazione', enabled: false, required: false },
    { id: 'partita-iva', name: 'Partita IVA', enabled: false, required: false },
    { id: 'codice-sdi', name: 'Codice SDI', enabled: false, required: false },
  ],
};

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const forms = db.collection('forms');

  // Backup current forms to JSON file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.resolve(process.cwd(), `./backups/forms-before-migrate-${timestamp}.json`);
  const all = await forms.find({}).toArray();
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(all, null, 2));
  console.log(`Backed up ${all.length} forms to ${backupPath}`);

  // For each form, ensure each expected section has expected fields
  const cursor = forms.find({});
  let updated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const sections = doc.sections || [];
    let modified = false;

    for (const [sectionId, expectedList] of Object.entries(expectedFields)) {
      let section = sections.find(s => s.id === sectionId);
      if (!section) {
        // add the missing section with default fields
        section = { id: sectionId, title: sectionId, order: 0, fields: expectedList.map((f, idx) => ({ ...f, order: idx })) };
        sections.push(section);
        modified = true;
        continue;
      }

      const savedIds = (section.fields || []).map(f => f.id);
      // ensure we insert missing fields in the order as in expectedList
      const toAdd = expectedList.filter(f => !savedIds.includes(f.id)).map((f, idx) => ({ ...f, order: (section.fields || []).length + idx }));
      if (toAdd.length) {
        // place new fields respecting expectedList ordering: merge existing and toAdd by expectedList order
        const merged = [];
        const existingMap = new Map((section.fields || []).map((fl, i) => [fl.id, fl]));
        for (const expectedField of expectedList) {
          if (existingMap.has(expectedField.id)) merged.push(existingMap.get(expectedField.id));
          else if (toAdd.find(t => t.id === expectedField.id)) merged.push(toAdd.find(t => t.id === expectedField.id));
        }
        // assign orders sequentially
        merged.forEach((f, i) => { f.order = i });
        section.fields = merged;
        modified = true;
      }
    }

    if (modified) {
      await forms.updateOne({ _id: new ObjectId(doc._id) }, { $set: { sections } });
      updated++;
    }
  }

  console.log(`Updated ${updated} forms`);
  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
