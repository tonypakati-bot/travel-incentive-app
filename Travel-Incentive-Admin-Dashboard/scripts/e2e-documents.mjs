#!/usr/bin/env node
/*
E2E script for documents flow:
- Navigates to admin CreateTrip page
- Selects an existing document if available
- Opens DocumentCreator modal, fills all usefulInfo fields and creates a document
- Polls the backend `/api/documents` until the new document appears (with retry/backoff)

Usage: node scripts/e2e-documents.mjs [--url http://localhost:3000] [--headless]

Note: This script uses puppeteer. Install with:
  npm install puppeteer

*/
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const argv = process.argv.slice(2);
const urlArgIndex = argv.findIndex(a => a.startsWith('--url'));
const baseUrl = urlArgIndex >= 0 ? argv[urlArgIndex].split('=')[1] : 'http://localhost:3000';
const headless = argv.includes('--headless');

const ADMIN_CREATE_TRIP_PATH = '/'; // adjust if admin route differs
const FULL_URL = baseUrl + ADMIN_CREATE_TRIP_PATH;

const apiBase = process.env.API_BASE || 'http://localhost:5001'; // backend

async function pollDocumentsUntil(label, timeoutMs = 20000, interval = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${apiBase}/api/documents`);
      if (!res.ok) {
        await new Promise(r => setTimeout(r, interval));
        continue;
      }
      const list = await res.json();
      if (Array.isArray(list) && list.find(it => (it.label || it.title) === label)) return list;
    } catch (err) {
      // ignore
    }
    await new Promise(r => setTimeout(r, interval));
  }
  return null;
}

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: !!headless, defaultViewport: { width: 1200, height: 900 } });
  const page = await browser.newPage();

  try {
    console.log('Opening admin page:', FULL_URL);
    await page.goto(FULL_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // TODO: navigate to the Create Trip flow if the app requires specific steps.
    // For simplicity assume CreateTrip component is on root and visible.

    // Wait for the documents section selector to appear
    const selectTestId = '[data-testid="doc-selector-usefulInformations"]';
    await page.waitForSelector(selectTestId, { timeout: 15000 });
    console.log('Page loaded — trying to open CreateTrip');
    // Click the Dashboard 'Create New Trip' button to open CreateTrip
    const [createTripBtn] = await page.$x("//button[contains(., 'Create New Trip')]");
    if (createTripBtn) {
      await createTripBtn.click();
      // wait for CreateTrip header to appear
      await page.waitForXPath("//h1[contains(., 'Crea Nuovo Viaggio') or contains(., 'Modifica Viaggio') ]", { timeout: 10000 }).catch(()=>{});
    } else {
      // fallback: try clicking sidebar Manage Trip button
      const [manageTripBtn] = await page.$x("//button[contains(., 'Manage Trip')]");
      if (manageTripBtn) {
        await manageTripBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Expand Section 3 (Documenti) in CreateTrip so the DocumentDropdown renders
    console.log('Expanding Sezione 3: Documenti');
    const [sec3Btn] = await page.$x("//div[@role='button' and .//h2[contains(., 'Sezione 3')]]");
    if (sec3Btn) {
      await sec3Btn.click();
      await page.waitForTimeout(300);
    }

    // Now wait for documents selector inside CreateTrip (either data-testid or select id)
    console.log('Waiting for documents selector inside CreateTrip');
    const selectors = [selectTestId, 'select#doc-usefulInformations'];
    let found = false;
    const maxWait = 20000;
    const start = Date.now();
    while (!found && Date.now() - start < maxWait) {
      for (const s of selectors) {
        const el = await page.$(s);
        if (el) { found = true; break; }
      }
      if (!found) await page.waitForTimeout(500);
    }
    if (!found) {
      // dump a snapshot for debugging
      const html = await page.content();
      await import('fs').then(fs => fs.promises.writeFile('scripts/e2e-failure-snapshot.html', html));
      throw new Error('Document selector not found; snapshot written to scripts/e2e-failure-snapshot.html');
    }

    // Click 'Crea nuovo' next to the useful informations selector
    const createBtn = await page.$('[data-testid="doc-selector-usefulInformations-create"]');
    if (!createBtn) throw new Error('Create button not found');
    await createBtn.click();
    console.log('Opened create modal');
    // Wait for modal title input (we added data-testid to title input)
    await page.waitForSelector('[data-testid="doc-creator-title"]', { timeout: 15000 });

    // Fill fields by label text mapping — rely on placeholders/labels used in modal
    // We'll use simple selectors based on label text proximity
    const setByLabel = async (label, value) => {
      const xpath = `//label[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${label.toLowerCase()}")]/following::input[1] | //label[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${label.toLowerCase()}")]/following::textarea[1]`;
      const els = await page.$x(xpath);
      if (els && els.length) {
        await els[0].focus();
        await els[0].click({ clickCount: 3 });
        await els[0].type(String(value));
        return true;
      }
      return false;
    };

    const rand = Math.floor(Math.random()*9000)+1000;
    const title = `E2E Doc ${Date.now()}-${rand}`;

    await page.type('[data-testid="doc-creator-title"]', title);
    await page.type('[data-testid="doc-creator-destinationName"]', 'Test Destination');
    await page.type('[data-testid="doc-creator-country"]', 'Testland');
    await page.type('[data-testid="doc-creator-content"]', 'This is sample content created by E2E script.');
    await page.type('[data-testid="doc-creator-documents"]', 'Passport, Visa');
    await page.type('[data-testid="doc-creator-timeZone"]', 'GMT+1');
    await page.type('[data-testid="doc-creator-currency"]', 'TST');
    await page.type('[data-testid="doc-creator-language"]', 'Testish');
    await page.type('[data-testid="doc-creator-climate"]', 'Warm');
    await page.type('[data-testid="doc-creator-vaccinations"]', 'None required');

    // Click the create button — look for a button with text 'Create' or 'Crea documento' or 'Crea'
    // Click the create button (we added data-testid)
    const createBtnFinal = await page.$('[data-testid="doc-creator-create"]');
    if (!createBtnFinal) throw new Error('Create final button not found');
    await createBtnFinal.click();
    console.log('Clicked create in modal, waiting for backend to list document:', title);

    // Poll backend until the new doc appears
    const list = await pollDocumentsUntil(title, 20000, 1000);
    if (!list) throw new Error('New document did not appear in API within timeout');

    console.log('Success: document found via API. Test finished.');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('E2E error:', err);
    try { await browser.close(); } catch(e){}
    process.exit(2);
  }
})();
