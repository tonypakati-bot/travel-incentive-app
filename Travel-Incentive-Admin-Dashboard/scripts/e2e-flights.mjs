import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const logFile = './scripts/e2e-flights.log';
  try { fs.writeFileSync(logFile, '', { flag: 'a' }); } catch (e) {}

  page.on('request', async (req) => {
    try { fs.appendFileSync(logFile, `REQ ${req.method()} ${req.url()} ${req.postData() || ''}\n`); } catch (e) {}
  });
  page.on('console', (msg) => { try { fs.appendFileSync(logFile, `PAGE ${msg.text()}\n`); } catch (e) {} });
  page.on('pageerror', (err) => { try { fs.appendFileSync(logFile, `PAGE_ERROR ${err.stack}\n`); } catch (e) {} });

  const frontendUrl = process.argv[2] || process.env.FRONTEND_URL || 'http://localhost:3000/';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  await page.goto(frontendUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });

  // helper to set input value reliably for React controlled components
  const setValue = async (selector, value) => {
    await page.waitForSelector(selector, { timeout: 8000 });
    await page.evaluate((s, v) => {
      const el = document.querySelector(s);
      if (!el) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      const nativeTextAreaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter && el instanceof HTMLInputElement) nativeSetter.call(el, v);
      else if (nativeTextAreaSetter && el instanceof HTMLTextAreaElement) nativeTextAreaSetter.call(el, v);
      else el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, selector, String(value));
    await new Promise(r => setTimeout(r, 120));
  };

  // open create trip
  const clicked = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('button'));
    for (const b of candidates) {
      const txt = (b.textContent || '').trim();
      if (/^Create New Trip$/i.test(txt) || txt.includes('Crea Nuovo Viaggio') || txt.toLowerCase().includes('create') || txt.toLowerCase().includes('crea')) { b.click(); return true; }
    }
    const headBtn = document.querySelector('header button'); if (headBtn) { headBtn.click(); return true; }
    return false;
  });
  if (!clicked) { await page.goto(new URL('/create-trip', frontendUrl).toString(), { waitUntil: 'domcontentloaded' }); }

  await page.waitForSelector('[data-testid="trip-name"]', { timeout: 20000 });

  // Fill section 1
  // Prefer using the dev E2E helper to set React state directly when available
  const section1SetResult = await page.evaluate((ts) => {
    try {
      const w = window;
      if (w && typeof w.__E2E_setSection1Fields === 'function') {
        return w.__E2E_setSection1Fields({ clientName: 'E2E Flights SRL', name: 'E2E Flights ' + ts, subtitle: 'Subtitle', description: 'E2E description', startDate: '2025-12-01', endDate: '2025-12-05' });
      }
      return { ok: false };
    } catch (e) { return { ok: false, reason: e && e.message }; }
  }, Date.now());
  if (!section1SetResult || section1SetResult.ok === false) {
    await setValue('[data-testid="trip-client"]', 'E2E Flights SRL');
    await setValue('[data-testid="trip-name"]', 'E2E Flights ' + Date.now());
    await setValue('[data-testid="trip-subtitle"]', 'Subtitle');
    await setValue('[data-testid="trip-description"]', 'E2E description');
    // dates
    await page.evaluate(() => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const s = document.querySelector('[data-testid="trip-start-date"]');
      const e = document.querySelector('[data-testid="trip-end-date"]');
      if (s && nativeSetter) nativeSetter.call(s, '2025-12-01');
      if (e && nativeSetter) nativeSetter.call(e, '2025-12-05');
      if (s) s.dispatchEvent(new Event('input', { bubbles: true }));
      if (e) e.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  // wait for save-section-1 to be enabled and click
  await page.waitForFunction(() => { const b = document.querySelector('[data-testid="save-section-1"]'); return b && !b.disabled; }, { timeout: 10000 });
  await page.evaluate(() => { const b = document.querySelector('[data-testid="save-section-1"]'); if (b) b.click(); });

  // wait for POST /api/trips and capture tripId
  const tripResponse = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for trip POST')), 10000);
    page.on('response', async (res) => {
      try {
        const url = res.url();
        if (url.includes('/api/trips') && res.request().method() === 'POST') {
          clearTimeout(timeout);
          const json = await res.json().catch(()=>null);
          resolve(json);
        }
      } catch (e) {}
    });
  });
  if (!tripResponse || !tripResponse.tripId) throw new Error('Trip creation failed or no tripId returned');
  const tripId = tripResponse.tripId;
  fs.appendFileSync(logFile, `TRIP_ID ${tripId}\n`);

  // open Section 4 by clicking the section header (find by title)
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h2'));
    const h = headings.find(h => (h.textContent||'').includes('Sezione 4'));
    if (h) {
      const btn = h.closest('div[role="button"]') || h.parentElement;
      if (btn) btn.click();
    }
  });
  await new Promise(r => setTimeout(r, 400));

  // click the Andata tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const b = tabs.find(t => (t.textContent||'').trim().includes('Voli di Andata'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Click add flight and fill fields
  // Open the Andata add form and fill its inline inputs, then click the inner "Aggiungi Volo" button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const add = btns.find(b => (b.textContent||'').trim().includes('Aggiungi Volo di Andata'));
    if (add) add.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Fill inputs that live next to the inner 'Aggiungi Volo' button, then click it
  await page.evaluate(() => {
    try {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent||'').trim() === 'Aggiungi Volo');
      if (!addBtn) return;
      const container = addBtn.closest('.relative') || addBtn.parentElement || document.body;
      const inputs = Array.from(container.querySelectorAll('input, select, textarea'));
      for (const inp of inputs) {
        const ph = (inp.getAttribute('placeholder')||'').toLowerCase();
        if (ph.includes('compagnia') || ph.includes('etihad')) { inp.value = 'Etihad Airways'; }
        if (ph.includes('numero volo') || ph.includes('numero') || ph.includes('ey')) { inp.value = 'EY999'; }
        if (ph.includes('malpensa') || ph.includes('aeroporto')) { if (!inp.value) inp.value = 'Malpensa'; }
        if (inp.type === 'date') inp.value = '2025-12-02';
        if (inp.type === 'time') { if (!inp.value) inp.value = '09:00'; }
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      addBtn.click();
    } catch (e) {}
  });
  await new Promise(r => setTimeout(r, 500));

  // click Save Flights button
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent||'').includes('Salva Voli')); if (b) b.click(); });

  // wait a bit for network
  await new Promise(r => setTimeout(r, 800));

  // verify persistence via backend GET
  let tripGet = null;
  for (let attempt=0; attempt<5; attempt++) {
    try {
      const res = await fetch(`${backendUrl}/api/trips/${tripId}`);
      const json = await res.json().catch(()=>null);
      tripGet = json;
      if (tripGet && Array.isArray(tripGet.flights)) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 300));
  }

  fs.appendFileSync(logFile, `TRIP_GET ${JSON.stringify(tripGet)}\n`);
  if (!tripGet || !Array.isArray(tripGet.flights) || tripGet.flights.length === 0) {
    console.error('E2E FAILURE: flights not persisted', tripGet);
    await browser.close();
    process.exit(2);
  }

  console.log('E2E SUCCESS: flights persisted', tripGet.flights.length);
  await browser.close();
  process.exit(0);
})();
