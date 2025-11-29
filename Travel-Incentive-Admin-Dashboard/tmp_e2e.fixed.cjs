const puppeteer = require('puppeteer');
const url = process.argv[2] || 'http://localhost:3000';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Create a real trip via API so server-side endpoints (flights/agenda) work
    let tripId = null;
    try {
      const created = await page.evaluate(async () => {
        try {
          const payload = { name: 'E2E Test Trip', clientName: 'E2E' };
          const res = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) return { ok: false, status: res.status, text: await res.text() };
          const json = await res.json();
          return { ok: true, json };
        } catch (e) { return { ok: false, reason: e && e.message } }
      });
      if (created && created.ok && created.json) {
        tripId = String(created.json._id || created.json.id || created.json.tripId || created.json.tripId);
      } else {
        console.log('PAGE LOG: Failed creating trip via API', created);
      }
    } catch (e) {
      console.log('PAGE LOG: create trip error', e && e.message ? e.message : e);
    }

    // Inject the created trip id into the page so React picks it up
    if (tripId) {
      try {
        await page.evaluate((id) => {
          try { if (window.__E2E_setTripDraft) return window.__E2E_setTripDraft({ tripId: id, name: 'E2E Test Trip' }); } catch (e) {}
          try { window.__E2E_injectedTrip = { tripId: id, name: 'E2E Test Trip' }; } catch (e) {}
        }, tripId);
      } catch (e) {}
    }

    // small wait for React to pick up injected trip
    await sleep(800);

    // Helper: click a button by text
    const clickButtonWithText = async (text) => await page.evaluate((t) => {
      const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.textContent && b.textContent.trim().includes(t));
      if (btn) { btn.click(); return true; }
      return false;
    }, text);

    // From dashboard: open Create New Trip first (so the CreateTrip component mounts)
    await clickButtonWithText('Create New Trip');
    await sleep(800);

    // Open Sezione 4
    await clickButtonWithText('Sezione 4');
    await sleep(600);

    // Open Voli di Andata
    await clickButtonWithText('Voli di Andata');
    await sleep(300);

    // Click add flight (andata)
    await clickButtonWithText('Aggiungi Volo di Andata');
    await sleep(600);

    // Fill fields in the Flights area by matching labels
    const andataResult = await page.evaluate(() => {
      function setByLabel(labelText, value) {
        const label = Array.from(document.querySelectorAll('label')).find(l => l.textContent && l.textContent.includes(labelText));
        if (!label) return false;
        // prefer input/select/textarea within the same FormField container
        let node = null;
        // 1) direct sibling
        if (label.nextElementSibling && /INPUT|SELECT|TEXTAREA/.test(label.nextElementSibling.nodeName)) node = label.nextElementSibling;
        // 2) descendant of label's parent (FormField wrapper)
        if (!node && label.parentElement) node = label.parentElement.querySelector('input,select,textarea');
        // 3) fallback: nearest input/select/textarea in document order after the label
        if (!node) {
          const all = Array.from(document.querySelectorAll('input,select,textarea'));
          const idx = all.findIndex(el => el.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_PRECEDING);
          node = all[idx+1] || null;
        }
        if (!node) return false;
        try { node.focus && node.focus(); node.value = value; node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { return false; }
        return true;
      }
      return {
        'Gruppo Partenza': setByLabel('Gruppo Partenza', 'Gruppo X'),
        'Compagnia Aerea': setByLabel('Compagnia Aerea', 'Etihad Airways'),
        'Numero Volo': setByLabel('Numero Volo', 'EY 82'),
        'Aeroporto Partenza': setByLabel('Aeroporto Partenza', 'Malpensa'),
        'Aeroporto Arrivo': setByLabel('Aeroporto Arrivo', 'Abu Dhabi'),
        'Data Partenza': setByLabel('Data Partenza', '01/12/2025'),
        'Ora Partenza': setByLabel('Ora Partenza', '08:00'),
        'Ora Arrivo': setByLabel('Ora Arrivo', '12:00')
      };
    });

    // Switch to ritorno tab and repeat
    await clickButtonWithText('Voli di Ritorno');
    await sleep(300);
    await clickButtonWithText('Aggiungi Volo di Ritorno');
    await sleep(600);

    const ritornoResult = await page.evaluate(() => {
      function setByLabel(labelText, value) {
        const label = Array.from(document.querySelectorAll('label')).find(l => l.textContent && l.textContent.includes(labelText));
        if (!label) return false;
        let node = label.nextElementSibling;
        if (!node) node = label.parentElement && label.parentElement.querySelector('input,select,textarea');
        if (!node) return false;
        try { node.value = value; node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { return false; }
        return true;
      }
      return {
        'Compagnia Aerea': setByLabel('Compagnia Aerea', 'Etihad'),
        'Numero Volo': setByLabel('Numero Volo', 'EY 83'),
        'Aeroporto Partenza': setByLabel('Aeroporto Partenza', 'Abu Dhabi'),
        'Aeroporto Arrivo': setByLabel('Aeroporto Arrivo', 'Malpensa'),
        'Data Partenza': setByLabel('Data Partenza', '05/12/2025'),
        'Ora Partenza': setByLabel('Ora Partenza', '14:00'),
        'Ora Arrivo': setByLabel('Ora Arrivo', '18:00')
      };
    });

    // Print a compact result
    console.log(JSON.stringify({ andata: andataResult, ritorno: ritornoResult }));
  } catch (e) {
    console.error('E2E error', e && e.message ? e.message : e);
  } finally {
    await browser.close();
  }
})();
