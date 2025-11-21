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
  const argUrl = process.argv[2];
  const frontendUrl = argUrl || process.env.FRONTEND_URL || 'http://localhost:3000/';
  await page.goto(frontendUrl, { timeout: 120000, waitUntil: 'domcontentloaded' });
  try { await page.screenshot({ path: './scripts/e2e-screenshots/step-01-home.png', fullPage: false }); } catch(e) {}

  // Wait for initial render
  await page.waitForSelector('body');

  // Small helper sleep to avoid using page.waitForTimeout (not available in some puppeteer builds)
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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
  
    // --- Section 2 interactions (do this after trip is created) ---
    const tripId = tripResponse.json.tripId;
      try {
      // wait for SectionSettings to become enabled and visible by data-disabled attribute
      await page.waitForFunction(() => {
        const root = document.querySelector('[data-testid="trip-groups-input"]');
        const card = root ? root.closest('[data-disabled]') : null;
        return !!root && card && card.getAttribute('data-disabled') === 'false';
      }, { timeout: 10000 });
    } catch (e) {
      try { fs.appendFileSync(logFile, `WARN Section 2 did not become enabled: ${e}\n`); } catch(e) {}
    }

      // Save Section 2 via the new save button and verify server persistence
      try {
        // wait for save-section-2 button to appear
        await page.waitForSelector('[data-testid="save-section-2"]', { timeout: 8000 });
        try { fs.appendFileSync(logFile, `DIAG found save-section-2\n`); } catch(e) {}
        // click save
        await page.evaluate(() => { const b = document.querySelector('[data-testid="save-section-2"]'); if (b) b.click(); });
        // wait briefly for network activity
        await sleep(800);

        // fetch trip from backend directly (node-side) to avoid dev-server proxy/html responses
        const backendBase = process.env.BACKEND_URL || 'http://localhost:5001';
        let tripGet;
        // Retry the GET a few times to tolerate eventual consistency or short races
        const maxGetAttempts = 4;
        for (let attempt = 1; attempt <= maxGetAttempts; attempt++) {
          try {
            const res = await fetch(`${backendBase}/api/trips/${tripId}`);
            const json = await res.json().catch(()=>null);
            tripGet = { status: res.status, json };
            if (tripGet && tripGet.json) break; // success
          } catch (e) {
            tripGet = { error: String(e) };
          }
          // small backoff
          await new Promise(r => setTimeout(r, 350 * attempt));
        }
        try { fs.appendFileSync(logFile, `TRIP_GET ${JSON.stringify(tripGet)}\n`); } catch(e) {}

        // basic assertions
        if (!tripGet || !tripGet.json) {
          try { fs.appendFileSync(logFile, `ASSERT FAIL: trip GET returned no json\n`); } catch(e) {}
        } else {
          const groups = (tripGet.json.settings && tripGet.json.settings.groups) || [];
          const addAccompany = !!(tripGet.json.settings && tripGet.json.settings.addAccompany);
          const businessFlights = !!(tripGet.json.settings && tripGet.json.settings.businessFlights);
          try { fs.appendFileSync(logFile, `ASSERT groups=${JSON.stringify(groups)} addAccompany=${addAccompany} businessFlights=${businessFlights}\n`); } catch(e) {}
          const hasAll = groups.some(g => String(g).toLowerCase() === 'all');
          const hasVip = groups.some(g => String(g).toLowerCase() === 'vip');
          try { fs.appendFileSync(logFile, `ASSERT hasAll=${hasAll} hasVip=${hasVip}\n`); } catch(e) {}
        }
      } catch (e) {
        try { fs.appendFileSync(logFile, `WARN saving section 2 or validating trip failed: ${e}\n`); } catch(e) {}
      }
  
    // Try to add groups via TagInput: use Puppeteer's `type` + `click` for reliability
    try {
      const rootSel = '[data-testid="trip-groups-input"]';
        const inputSel = `${rootSel} [data-testid="trip-groups-input-input"], ${rootSel} [data-testid="trip-groups-input-input"] , [data-testid="trip-groups-input-input"]`;
      const addBtnSel = '[data-testid="trip-groups-input-add"], [data-testid="trip-groups-add"]';
      try {
        await page.waitForSelector(rootSel, { timeout: 15000 });
        try { const outer = await page.evaluate((s)=>{ const el=document.querySelector(s); return el ? el.outerHTML : null; }, rootSel); fs.appendFileSync(logFile, `DIAG rootOuter ${outer}\n`); } catch(e) {}

        // We'll obtain the input handle fresh for each attempt since the page can re-render
        try { fs.appendFileSync(logFile, `DIAG will use Puppeteer.type + click (fresh handles each attempt)\n`); } catch(e) {}

        // Helper to add a tag with retries using a direct DOM set+click approach (avoids typing concat issues)
        const addTagAndWait = async (text) => {
          const maxAttempts = 3;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              await page.waitForSelector(rootSel, { timeout: 10000 });
              // snapshot before
              try { const before = await page.evaluate((s)=>{ const el=document.querySelector(s); return el ? el.outerHTML : null; }, rootSel); fs.appendFileSync(logFile, `DIAG beforeSet attempt=${attempt} ${text} ${before}\n`); } catch(e) {}

              // set input value via native setter and dispatch events, then click add button
              await page.evaluate((rootSelector, addSelectors, t) => {
                const root = document.querySelector(rootSelector);
                if (!root) throw new Error('root not found');
                const input = root.querySelector('input');
                const addBtn = root.querySelector(addSelectors.split(',')[0].trim()) || root.querySelector('button');
                if (!input) throw new Error('input not found');
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                if (nativeSetter) nativeSetter.call(input, t); else input.value = t;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                // small delay is not possible inside evaluate reliably; the caller will wait for DOM
                if (addBtn) addBtn.click();
              }, rootSel, addBtnSel, text);

              // snapshot after set+click
              try { const after = await page.evaluate((s)=>{ const el=document.querySelector(s); return el ? el.outerHTML : null; }, rootSel); fs.appendFileSync(logFile, `DIAG afterSetClick attempt=${attempt} ${text} ${after}\n`); } catch(e) {}

              // wait for chip
              await page.waitForFunction((t) => {
                return Array.from(document.querySelectorAll('[data-testid^="trip-group-"]')).some(n => (n.textContent || '').toLowerCase().includes(t.toLowerCase()));
              }, { timeout: 12000 }, text);

              // success
              return;
            } catch (err) {
              try { fs.appendFileSync(logFile, `DIAG addTag attempt=${attempt} failed for ${text}: ${err}\n`); } catch(e) {}
              if (attempt < maxAttempts) {
                await sleep(400);
                continue;
              }
              throw err;
            }
          }
        };

        // Add first and second tags
        await addTagAndWait('All');
        await addTagAndWait('VIP');
      } catch (inner) {
        try { fs.appendFileSync(logFile, `WARN TagInput attempt failed: ${inner}\n`); } catch(e) {}
        // last-resort fallback: keyboard typing at root
        try {
          const inputHandle2 = await page.$(inputSel);
          if (inputHandle2) {
            await inputHandle2.focus();
            await page.keyboard.type('All', { delay: 20 });
            await page.keyboard.press('Enter');
            await page.keyboard.type('VIP', { delay: 20 });
            await page.keyboard.press('Enter');
          } else {
            try { fs.appendFileSync(logFile, `WARN no input for keyboard fallback\n`); } catch(e) {}
          }
        } catch(e2) { try { fs.appendFileSync(logFile, `WARN final TagInput fallback failed: ${e2}\n`); } catch(e) {} }
      }
    } catch(e) { try { fs.appendFileSync(logFile, `WARN Could not interact with TagInput after save: ${e}\n`); } catch(e) {} }

    // Diagnostic snapshot of TagInput state after attempts
    try {
      const diag = await page.evaluate(() => {
        const root = document.querySelector('[data-testid="trip-groups-input"]');
        const input = root ? root.querySelector('input') : null;
        return {
          inputValue: input ? (input.value || '') : null,
          rootInner: root ? root.innerHTML : null,
          chips: Array.from(document.querySelectorAll('[data-testid^="trip-group-"]')).map(n=>n.getAttribute('data-testid'))
        };
      });
      try { fs.appendFileSync(logFile, `DIAG afterTags ${JSON.stringify(diag)}\n`); } catch(e) {}
    } catch(e) { try { fs.appendFileSync(logFile, `DIAG afterTags failed: ${e}\n`); } catch(e) {} }

    // Image/logo uploads removed from UI; only URL inputs remain. Log presence of previews if any.
    try {
      const imagePreviewSel = '[data-testid="trip-image-preview"]';
      const logoPreviewSel = '[data-testid="trip-logo-preview"]';
      // check if previews appear (they will only if the test sets URLs)
      const hasImagePreview = await page.$(imagePreviewSel) !== null;
      const hasLogoPreview = await page.$(logoPreviewSel) !== null;
      if (!hasImagePreview) try { fs.appendFileSync(logFile, `WARN image preview not present (no URL set)\n`); } catch(e) {}
      if (!hasLogoPreview) try { fs.appendFileSync(logFile, `WARN logo preview not present (no URL set)\n`); } catch(e) {}
    } catch(e) { try { fs.appendFileSync(logFile, `WARN preview check failed: ${e}\n`); } catch(e) {} }

  await browser.close();
})();
