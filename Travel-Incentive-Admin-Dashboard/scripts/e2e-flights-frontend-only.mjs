import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const logFile = './scripts/e2e-flights-frontend-only.log';
  try { fs.writeFileSync(logFile, '', { flag: 'a' }); } catch (e) {}

  page.on('request', async (req) => {
    try { fs.appendFileSync(logFile, `REQ ${req.method()} ${req.url()} ${req.postData() || ''}\n`); } catch (e) {}
  });
  page.on('console', (msg) => { try { fs.appendFileSync(logFile, `PAGE ${msg.text()}\n`); } catch (e) {} });
  page.on('pageerror', (err) => { try { fs.appendFileSync(logFile, `PAGE_ERROR ${err.stack}\n`); } catch (e) {} });

  const frontendUrl = process.argv[2] || process.env.FRONTEND_URL || 'http://localhost:3001/';
  await page.goto(frontendUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });

  // create a trip locally by filling Section 1 and clicking the save button if present
  const setValue = async (selector, value) => {
    await page.waitForSelector(selector, { timeout: 8000 });
    await page.evaluate((s, v) => {
      const el = document.querySelector(s);
      if (!el) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (nativeSetter && el instanceof HTMLInputElement) nativeSetter.call(el, v);
      else el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, selector, String(value));
  };

  // navigate to create trip if possible
  await page.evaluate(() => {
    const createBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent||'').toLowerCase().includes('crea') || (b.textContent||'').toLowerCase().includes('create'));
    if (createBtn) createBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // try to find trip name input, otherwise assume route already on create page
  const nameExists = await page.$('[data-testid="trip-name"]');
  if (nameExists) {
    await setValue('[data-testid="trip-client"]', 'E2E Local');
    await setValue('[data-testid="trip-name"]', 'E2E Local ' + Date.now());
  }

  // Ensure the page has a tripDraft with tripId so saveFlights will persist
  await page.evaluate(() => {
    try {
      if (window.__E2E_setTripDraft) {
        window.__E2E_setTripDraft({ tripId: 'e2e-local-123' });
      } else {
        // set injected trip before mount and reload
        window.__E2E_injectedTrip = { tripId: 'e2e-local-123' };
      }
    } catch (e) { }
  });
  await new Promise(r => setTimeout(r, 200));

  // open flights section
  await page.evaluate(() => {
    const h2s = Array.from(document.querySelectorAll('h2'));
    const h = h2s.find(h => (h.textContent||'').includes('Sezione 4'));
    if (h) { const btn = h.closest('[role="button"]'); if (btn) btn.click(); }
  });
  await new Promise(r => setTimeout(r, 300));

  // click andata tab
  await page.evaluate(() => { const tabs = Array.from(document.querySelectorAll('button')); const b = tabs.find(t => (t.textContent||'').includes('Voli di Andata')); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 200));

  // open add form
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent||'').includes('Aggiungi Volo di Andata')); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 200));

  // fill few inputs in the opened form
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.relative.p-4'));
    const r = rows[rows.length-1];
    if (!r) return;
    const inputs = r.querySelectorAll('input, select, textarea');
    for (const inp of inputs) {
      if (inp.type === 'date') { inp.value = '2025-12-02'; }
      if (inp.type === 'time') { inp.value = '10:00'; }
      if (inp.placeholder && inp.placeholder.toLowerCase().includes('compagnia')) inp.value = 'TestAir';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 200));

  // click inner add button
  await page.evaluate(() => { const bs = Array.from(document.querySelectorAll('button')); const add = bs.find(b => (b.textContent||'').trim() === 'Aggiungi Volo'); if (add) add.click(); });
  await new Promise(r => setTimeout(r, 200));

  // intercept outgoing requests and check for POST/PATCH containing flights
  const requests = [];
  page.on('request', req => { try { requests.push({ url: req.url(), method: req.method(), post: req.postData() }); } catch (e) {} });

  // click Save Flights
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent||'').includes('Salva Voli')); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 600));

  fs.appendFileSync(logFile, `REQUESTS ${JSON.stringify(requests)}\n`);
  // check for POST/PATCH with flights in body
  const match = requests.find(r => (r.method === 'POST' || r.method === 'PATCH') && (r.post && r.post.includes('flights')));
  if (!match) {
    console.error('FRONTEND E2E FAILURE: no flights request captured', requests.map(r => r.url));
    await browser.close();
    process.exit(2);
  }

  console.log('FRONTEND E2E SUCCESS: captured flights request', match.url);
  await browser.close();
  process.exit(0);
})();
