#!/usr/bin/env node
import process from 'process';

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

const expected = {
  'dati-partecipante': ['ragione-sociale','nome','cognome','data-di-nascita','nazionalita','n-tel-cellulare','email','passaporto','esigenze-alimentari'],
  'logistica': ['tipologia-camera','aeroporto-di-partenza','viaggio-in-business'],
  'consensi': ['informativa-sulla-privacy','termini-e-condizioni'],
  'accompagnatore': ['nome-accompagnatore','cognome-accompagnatore','data-di-nascita-accompagnatore','nazionalita-accompagnatore','passaporto-accompagnatore','esigenze-alimentari-accompagnatore','partecipazione-meeting'],
  'fatturazione': ['intestatario-fattura','indirizzo-di-fatturazione','partita-iva','codice-sdi'],
};

function summarize(form) {
  const report = {};
  for (const [sectionId, expectedFields] of Object.entries(expected)) {
    const section = (form.sections || []).find(s => s.id === sectionId);
    const savedIds = (section && Array.isArray(section.fields)) ? section.fields.map(f => f.id) : [];
    const missing = expectedFields.filter(id => !savedIds.includes(id));
    const extra = savedIds.filter(id => !expectedFields.includes(id));
    report[sectionId] = { missing, extra, savedIds };
  }
  return report;
}

(async function main(){
  const raw = await readStdin();
  if (!raw) {
    console.error('No input on stdin. Usage: curl http://localhost:5001/api/forms | node scripts/compare_form_fields.mjs');
    process.exit(2);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse JSON from stdin:', e.message);
    process.exit(2);
  }

  const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
  if (!items.length) {
    console.error('No forms found in input');
    process.exit(0);
  }

  // pick most recent by createdAt
  items.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const latest = items[0];

  console.log('Comparing expected fields with latest form:');
  console.log(`  _id: ${latest._id}  title: ${latest.title}  createdAt: ${latest.createdAt}`);
  console.log('------------------------------------------------------------');

  const report = summarize(latest);
  for (const [sectionId, info] of Object.entries(report)) {
    console.log(`Section: ${sectionId}`);
    console.log(`  Saved fields: ${info.savedIds.join(', ') || '<none>'}`);
    console.log(`  Missing expected: ${info.missing.join(', ') || '<none>'}`);
    console.log(`  Extra fields: ${info.extra.join(', ') || '<none>'}`);
    console.log('');
  }

  process.exit(0);
})();
