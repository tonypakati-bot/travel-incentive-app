import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const logFile = './scripts/e2e-out.log';
  try { fs.writeFileSync(logFile, '', { flag: 'a' }); } catch (e) {}

  page.on('request', async (req) => {
    try {
      const method = req.method();
      const url = req.url();
      let postData = null;
      try { postData = req.postData(); } catch (e) {}
      const entry = `REQ ${method} ${url}` + (postData ? ` BODY:${postData}` : '') + '\n';
      try { fs.appendFileSync(logFile, entry); } catch (e) {}
      console.log(entry.trim());
    } catch (err) {
      console.error('Request log error:', err);
    }
  });
    page.on('console', (msg) => {
      try { fs.appendFileSync(logFile, `PAGE_CONSOLE ${msg.text()}\n`); } catch (e) {}
      console.log('PAGE:', msg.text());
    });
    page.on('pageerror', (err) => {
      try { fs.appendFileSync(logFile, `PAGE_ERROR ${err.stack}\n`); } catch (e) {}
      console.error('PAGE ERROR:', err);
    });
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000/';
  await page.goto(frontendUrl, { timeout: 120000, waitUntil: 'domcontentloaded' });
  try { await page.screenshot({ path: './scripts/e2e-screenshots/step-01-home.png', fullPage: false }); } catch(e) {}

  // Wait for initial render
  await page.waitForSelector('body');

  // Click Create New Trip button by searching button text via page.evaluate
  const clicked = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('button'));
    for (const b of candidates) {
      const txt = (b.textContent || '').trim();
      if (/^Create New Trip$/i.test(txt) || txt.includes('Crea Nuovo Viaggio') || txt.toLowerCase().includes('create') || txt.toLowerCase().includes('crea')) {
        b.click();
        return true;
      }
    }
    // fallback: click first header button
    const headBtn = document.querySelector('header button');
    if (headBtn) { headBtn.click(); return true; }
    return false;
  });

  if (!clicked) {
    // try direct navigation to /create-trip route if available
    try {
      await page.goto(new URL('/create-trip', frontendUrl).toString(), { timeout: 20000, waitUntil: 'domcontentloaded' });
    } catch (e) {
      throw new Error('Could not find Create Trip button on page and fallback route /create-trip failed');
    }
  }

  // Wait for CreateTrip form to appear by data-testid
  await page.waitForSelector('[data-testid="trip-name"]', { timeout: 20000 });
  try { await page.screenshot({ path: './scripts/e2e-screenshots/step-02-form.png', fullPage: false }); } catch(e) {}

  // Fill Section 1 using keyboard typing to trigger React controlled inputs
  const typeInto = async (selector, value) => {
    await page.waitForSelector(selector, { timeout: 5000 });
    // set via native setter so React controlled inputs detect changes reliably
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
      el.blur && el.blur();
    }, selector, String(value));
    // small pause to let React process state updates
    await new Promise(r => setTimeout(r, 120));
  };

  await typeInto('[data-testid="trip-client"]', 'Puppeteer Srl');
  await typeInto('[data-testid="trip-name"]', 'E2E Trip ' + Date.now());
  await typeInto('[data-testid="trip-subtitle"]', 'Subtitle E2E');
  await typeInto('[data-testid="trip-description"]', 'Automated test description');
  // Date inputs: set via evaluate to ensure exact ISO format
  await page.evaluate(() => {
    // Use native setter so React's value tracker picks up changes
    const setDate = (sel, val) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(el, val);
      const ev = new Event('input', { bubbles: true });
      el.dispatchEvent(ev);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setDate('[data-testid="trip-start-date"]', '2025-12-01');
    setDate('[data-testid="trip-end-date"]', '2025-12-05');
  });
  // Force dispatch input/change on all Section 1 fields so React state updates
  await page.evaluate(() => {
    const sels = ['[data-testid="trip-client"]','[data-testid="trip-name"]','[data-testid="trip-subtitle"]','[data-testid="trip-description"]','[data-testid="trip-start-date"]','[data-testid="trip-end-date"]'];
    sels.forEach(s => {
      const el = document.querySelector(s);
      if (el) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
  // settings
  await typeInto('[data-testid="trip-groups-input"]', 'All,VIP').catch(()=>{});
  try { const addAcc = await page.$('[data-testid="trip-add-accompany-true"]'); if (addAcc) await addAcc.click(); } catch(e) {}
  try { const business = await page.$('[data-testid="trip-business-flights-true"]'); if (business) await business.click(); } catch(e) {}
  await typeInto('[data-testid="trip-image-url"]', 'https://cdn.example.com/e2e.jpg').catch(()=>{});
  await typeInto('[data-testid="trip-logo-url"]', 'https://cdn.example.com/e2e-logo.png').catch(()=>{});
  try { await page.screenshot({ path: './scripts/e2e-screenshots/step-03-filled.png', fullPage: false }); } catch(e) {}

  // verify values and button state
  const snapshot = await page.evaluate(() => {
    const read = (sel) => { const el = document.querySelector(sel); return el ? el.value || el.textContent || null : null; };
    const saveBtn = document.querySelector('[data-testid="save-section-1"]');
    return {
      client: read('[data-testid="trip-client"]'),
      name: read('[data-testid="trip-name"]'),
      subtitle: read('[data-testid="trip-subtitle"]'),
      startDate: read('[data-testid="trip-start-date"]'),
      endDate: read('[data-testid="trip-end-date"]'),
      saveDisabled: saveBtn ? saveBtn.disabled : null
    };
  });
  // debug: count matching selectors and dump save button HTML/state
  const debugInfo = await page.evaluate(() => {
    const sels = ['trip-client','trip-name','trip-subtitle','trip-start-date','trip-end-date','save-section-1'];
    const counts = {};
    sels.forEach(s => { counts[s] = document.querySelectorAll(`[data-testid="${s}"]`).length; });
    const btn = document.querySelector('[data-testid="save-section-1"]');
    const container = document.querySelector('[data-testid="save-section-1"]')?.closest('[data-valid]');
    const containerData = container ? {
      valid: container.getAttribute('data-valid'),
      client: container.getAttribute('data-client'),
      name: container.getAttribute('data-name'),
      subtitle: container.getAttribute('data-subtitle'),
      start: container.getAttribute('data-start'),
      end: container.getAttribute('data-end')
    } : null;
    return { counts, saveOuter: btn ? btn.outerHTML : null, saveDisabled: btn ? btn.disabled : null, containerData };
  });
  try { fs.appendFileSync(logFile, `DEBUG ${JSON.stringify(debugInfo)}\n`); } catch(e) {}
  try { fs.appendFileSync(logFile, `SNAPSHOT ${JSON.stringify(snapshot)}\n`); } catch (e) {}
  console.log('SNAPSHOT', snapshot);
  console.log('DEBUG', debugInfo);

  // Click Save Section 1 button (force dispatch in case React blocks synthetic events)
  // Wait for save button to be enabled (poll up to 10s)
  const waitForSaveEnabled = async () => {
    const start = Date.now();
    while (Date.now() - start < 10000) {
      const state = await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="save-section-1"]');
        return btn ? { exists: true, disabled: !!btn.disabled } : { exists: false };
      });
      try { fs.appendFileSync(logFile, `SAVE_STATE ${JSON.stringify(state)}\n`); } catch(e) {}
      if (state.exists && !state.disabled) return true;
      await new Promise(r => setTimeout(r, 300));
    }
    return false;
  };

  const isSaveReady = await waitForSaveEnabled();
  if (!isSaveReady) {
    throw new Error('Save button did not become enabled within timeout');
  }

  // click normally and wait for the POST response
  await page.evaluate(() => { const btn = document.querySelector('[data-testid="save-section-1"]'); if (btn) btn.click(); });

  // wait for the API response by listening to network responses that match /api/trips
  const tripResponse = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for /api/trips response')), 10000);
    page.on('response', async (res) => {
      try {
        const url = res.url();
        if (url.includes('/api/trips') && res.request().method() === 'POST') {
          clearTimeout(timeout);
          const json = await res.json().catch(()=>null);
          resolve({ status: res.status(), json });
        }
      } catch (e) { /* ignore parse errors */ }
    });
  });
  try { fs.appendFileSync(logFile, `TRIP_RESPONSE ${JSON.stringify(tripResponse)}\n`); } catch(e) {}
  if (!tripResponse || !tripResponse.json || !tripResponse.json.tripId) throw new Error('POST to /api/trips did not return tripId');
  try { await page.screenshot({ path: './scripts/e2e-screenshots/step-04-after-save.png', fullPage: false }); } catch(e) {}

  await browser.close();
})();
