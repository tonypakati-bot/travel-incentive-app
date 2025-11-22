import puppeteer from 'puppeteer';

(async () => {
  const url = process.argv[2] || 'http://localhost:3001/';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // try to click create trip button
    const clicked = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button'));
      for (const b of candidates) {
        const txt = (b.textContent || '').trim();
        if (/^Create New Trip$/i.test(txt) || txt.includes('Crea Nuovo Viaggio') || txt.toLowerCase().includes('create') || txt.toLowerCase().includes('crea')) {
          b.click();
          return true;
        }
      }
      const headBtn = document.querySelector('header button');
      if (headBtn) { headBtn.click(); return true; }
      return false;
    });

    if (!clicked) {
      await page.goto(new URL('/create-trip', url).toString(), { waitUntil: 'domcontentloaded' });
    }

    await page.waitForSelector('[data-testid="trip-name"]', { timeout: 20000 });

    // minimal fill and save
    const nativeSet = async (selector, value) => {
      await page.waitForSelector(selector, { timeout: 5000 });
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
    };

    await nativeSet('[data-testid="trip-client"]', 'Inspect Srl');
    await nativeSet('[data-testid="trip-name"]', 'Inspect Trip ' + Date.now());
    await nativeSet('[data-testid="trip-subtitle"]', 'Subtitle Inspect');
    await nativeSet('[data-testid="trip-description"]', 'Inspect description');
    await nativeSet('[data-testid="trip-start-date"]', '2025-12-01');
    await nativeSet('[data-testid="trip-end-date"]', '2025-12-05');

    // wait for save button enabled
    await page.waitForFunction(() => {
      const btn = document.querySelector('[data-testid="save-section-1"]');
      return !!btn && !btn.disabled;
    }, { timeout: 20000 });

    await page.evaluate(() => { const b = document.querySelector('[data-testid="save-section-1"]'); if (b) b.click(); });

    // wait for /api/trips response to appear in app state (simple wait)
    await new Promise(r => setTimeout(r, 1500));

    // Inspect the TagInput root
    const info = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="trip-groups-input"]');
      if (!root) return { found: false };
      const input = root.querySelector('input');
      const addButton = root.querySelector('button');
      return {
        found: true,
        outerHTML: root.outerHTML.substring(0, 2000),
        hasInput: !!input,
        inputOuter: input ? input.outerHTML : null,
        hasAddButton: !!addButton,
        addButtonOuter: addButton ? addButton.outerHTML : null,
        classes: Array.from((root.classList || [])),
        visible: !!(root.offsetParent || root.getClientRects().length),
      };
    });

    console.log('INSPECT RESULT:', JSON.stringify(info, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
