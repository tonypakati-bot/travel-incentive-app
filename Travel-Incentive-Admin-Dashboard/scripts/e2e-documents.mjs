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

const apiBase = 'http://localhost:5001'; // backend

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
    await page.goto(FULL_URL, { waitUntil: 'networkidle2' });

    // TODO: navigate to the Create Trip flow if the app requires specific steps.
    // For simplicity assume CreateTrip component is on root and visible.

    // Wait for the documents section selector to appear
    const selectTestId = '[data-testid="doc-selector-usefulInformations"]';
    await page.waitForSelector(selectTestId, { timeout: 5000 });
    console.log('Found documents selector');

    // Optionally select an existing option if present (not necessary)
    // Now click 'Crea nuovo' next to the useful informations selector
    const createBtnXpath = "//label[contains(., 'Useful Informations')]/following::button[contains(., 'Crea nuovo')][1]";
    const [createBtn] = await page.$x(createBtnXpath);
    if (!createBtn) throw new Error('Create button not found');
    await createBtn.click();
    console.log('Opened create modal');

    // Wait for modal title or the title input
    await page.waitForSelector('input[aria-label="Title"] , input[placeholder="Title"], input#title', { timeout: 5000 }).catch(()=>{});

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

    await setByLabel('title', title);
    await setByLabel('destination name', 'Test Destination');
    await setByLabel('country', 'Testland');
    await setByLabel('content', 'This is sample content created by E2E script.');
    await setByLabel('documents', 'Passport, Visa');
    await setByLabel('time zone', 'GMT+1');
    await setByLabel('currency', 'TST');
    await setByLabel('language', 'Testish');
    await setByLabel('climate', 'Warm');
    await setByLabel('vaccinations', 'None required');

    // Click the create button — look for a button with text 'Create' or 'Crea documento' or 'Crea'
    const createButtonXPath = "//button[contains(., 'Create') or contains(., 'Crea') or contains(., 'Crea documento')]";
    const [createBtnFinal] = await page.$x(createButtonXPath);
    if (!createBtnFinal) {
      // fallback: try buttons in modal footer
      const footBtns = await page.$$('div[role="dialog"] button, div[role="dialog"] input[type="button"]');
      if (footBtns && footBtns.length) {
        await footBtns[footBtns.length-1].click();
      } else {
        throw new Error('Create final button not found');
      }
    } else {
      await createBtnFinal.click();
    }
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
