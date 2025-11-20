import puppeteer from 'puppeteer';
import fs from 'fs';

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

    // helper to find a trip row and click its Manage Participants button
    const tripName = 'Sales Kick-off Dubai';
    // Try to click Add Participant button directly; otherwise navigate to /manage-participants
    let hasAdd = await page.$('[data-testid="add-new-participant"]');
    if (!hasAdd) {
      console.log('Add button not present on landing page — clicking Sidebar Manage Participants');
      // Click sidebar nav item with label 'Manage Participants'
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Manage Participants');
        if (btn) btn.click();
      });
      await sleep(600);
      // Try clicking the first 'Manage Participants' button inside the Trip list
      try {
        const clickedTrip = await page.$$eval('table tbody tr td button', (buttons) => {
          const b = buttons.find(el => el.textContent && el.textContent.trim() === 'Manage Participants');
          if (b) { b.click(); return true; }
          return false;
        });
        if (clickedTrip) {
          await sleep(600);
        } else {
          console.log('No trip action found — will try direct navigation');
          await page.goto('http://localhost:3000/?view=manage-participants', { waitUntil: 'networkidle2', timeout: 15000 });
        }
      } catch (e) {
        console.log('Error clicking trip action', e);
      }
      hasAdd = await page.$('[data-testid="add-new-participant"]');
    }

    // Wait for add new participant button to appear
    try {
      await page.waitForSelector('[data-testid="add-new-participant"]', { timeout: 10000 });
    } catch (err) {
      const html = await page.evaluate(() => document.documentElement.outerHTML);
      fs.writeFileSync('ui-participants-fail.html', html, 'utf8');
      console.error('Selector not found. Dumped page HTML to ui-participants-fail.html');
      throw err;
    }
    const addBtn = await page.$('[data-testid="add-new-participant"]');
    if (!addBtn) throw new Error('Add new participant button not found');
    await addBtn.click();

    // Wait for modal fields
    await page.waitForSelector('[data-testid="participant-name"]', { timeout: 10000 });

    const unique = Date.now();
    const testName = `Test User ${unique}`;
    const testEmail = `test+${unique}@example.com`;

    await page.type('[data-testid="participant-name"]', testName);
    await page.type('[data-testid="participant-email"]', testEmail);
    // trip field may be hidden if defaultTrip provided; only set if present
    const tripField = await page.$('[data-testid="participant-trip"]');
    if (tripField) await page.type('[data-testid="participant-trip"]', 'Sales Kick-off Dubai');

    // Save
    await page.click('[data-testid="participant-save"]');

    // wait for toast via dev hook or aria-live
    await sleep(1000);
    const firstToast = await page.evaluate(() => {
      // @ts-ignore
      if (typeof window !== 'undefined' && (window).__LAST_TOAST) return (window).__LAST_TOAST.message;
      const a = document.querySelector('[aria-live]'); return a ? a.innerText : null;
    });
    console.log('FIRST_TOAST:', firstToast);

    // Try to add duplicate: open modal again
    await page.click('[data-testid="add-new-participant"]');
    await page.waitForSelector('[data-testid="participant-email"]', { timeout: 5000 });
    await page.type('[data-testid="participant-name"]', `Dup ${unique}`);
    await page.type('[data-testid="participant-email"]', testEmail);
    await page.click('[data-testid="participant-save"]');

    await sleep(800);
    const dupToast = await page.evaluate(() => {
      // @ts-ignore
      if (typeof window !== 'undefined' && (window).__LAST_TOAST) return (window).__LAST_TOAST.message;
      const a = document.querySelector('[aria-live]'); return a ? a.innerText : null;
    });
    console.log('DUP_TOAST:', dupToast);

    // Dump body and screenshot for debugging
    const bodyText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('ui-participants-body.txt', bodyText, 'utf8');
    await page.screenshot({ path: 'ui-participants.png', fullPage: true });
    console.log('Artifacts saved: ui-participants-body.txt, ui-participants.png');

  } catch (e) {
    console.error('E2E script error', e);
  } finally {
    await browser.close();
  }
})();
