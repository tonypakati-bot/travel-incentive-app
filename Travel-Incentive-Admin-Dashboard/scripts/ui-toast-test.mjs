import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

    // helper to click an element by visible text or test id
    async function clickByText(text) {
      // prefer data-testid
      const testId = text.replace(/\s+/g, '-').toLowerCase();
      const byTestId = await page.evaluate((tid) => {
        const el = document.querySelector(`[data-testid="${tid}"]`);
        if (el) { try { (el).click(); return true; } catch(e) { return false; } }
        return false;
      }, testId).catch(()=>false);
      if (byTestId) return true;

      return await page.evaluate((t) => {
        const candidates = Array.from(document.querySelectorAll('button, a, [role=button], div'));
        const el = candidates.find(n => {
          try { return n.innerText && n.innerText.trim().toLowerCase().includes(t.toLowerCase()); } catch(e) { return false; }
        });
        if (el) { el.click(); return true; }
        return false;
      }, text);
    }

    // Test 1: Invites empty save
    console.log('--- Test 1: Invites empty save ---');
    await page.waitForSelector('button:has-text("Invites")', { timeout: 5000 }).catch(()=>{});
    // Navigate using nav via Dashboard: open menu or use direct URL if available
    // Try to click sidebar link that has text "Invites" (if present)
    // Navigate to a dev-only test route to reliably open the Create Template editor
    await page.goto('http://localhost:3000/__test/invites/create').catch(()=>{});
    await new Promise(r => setTimeout(r, 700));
    await new Promise(r => setTimeout(r, 500));

    // If the save button already exists on the page (Dev HMR may have landed us directly on create), click it
    try {
      // Wait for create-invite button (in list view) or save-invite (if already on create) to appear
      // Wait for either create button or existing save button.
      const createBtn = await page.waitForSelector('[data-testid="create-invite"]', { timeout: 8000 }).catch(() => null);
      // helper to fill the invite form fields
      async function fillInviteForm() {
        try {
          await page.waitForSelector('select', { timeout: 2000 });
          await page.evaluate(() => {
            const s = document.querySelector('select');
            if (s) {
              for (const o of Array.from(s.options)) {
                if (o.value && o.value.trim() !== '') { s.value = o.value; break; }
              }
              s.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        } catch(e) {}

        try {
          const senderHandle = await page.$('input[placeholder="e.g. Team Eventi"]') || await page.$('input');
          if (senderHandle) { await senderHandle.focus(); await senderHandle.click({ clickCount: 3 }); await senderHandle.type('Team Eventi'); }
        } catch(e) {}

        try {
          const subjectHandle = await page.$('input[placeholder="e.g. Invito Esclusivo: Sales Kick-off 2026"]') || (await page.$$('input'))[1];
          if (subjectHandle) { await subjectHandle.focus(); await subjectHandle.click({ clickCount: 3 }); await subjectHandle.type('Invito di test'); }
        } catch(e) {}

        try {
          const ta = await page.$('textarea[placeholder="Scrivi qui il contenuto dell\'invito..."]') || await page.$('textarea');
          if (ta) { await ta.focus(); await ta.click({ clickCount: 3 }); await ta.type('Corpo di test per il template.'); }
        } catch(e) {}
      }

      if (createBtn) {
        console.log('create-invite found; clicking it');
        await createBtn.click();

        // Wait for the Create Template header to be present to ensure routing completed
        const headerXpath = "//h1[normalize-space(.)='Create Template' or normalize-space(.)='Edit Template']";
        await page.waitForXPath(headerXpath, { timeout: 8000 }).catch(() => null);

        // Wait for the exact Save button (Salva Template) to appear using XPath
        const saveXpath = "//button[normalize-space(.)='Salva Template']";
        const saveNodes = await page.waitForXPath(saveXpath, { timeout: 8000 }).catch(() => null);
        if (saveNodes) {
          console.log('Found Salva Template button via XPath');

          // fill inputs by interacting with elements so React controlled inputs pick up events
          try {
            await page.waitForSelector('select', { timeout: 2000 });
            // choose the first non-empty option (mockTrips names are used as values)
            await page.evaluate(() => {
              const s = document.querySelector('select');
              if (s) {
                for (const o of Array.from(s.options)) {
                  if (o.value && o.value.trim() !== '') { s.value = o.value; break; }
                }
                s.dispatchEvent(new Event('change', { bubbles: true }));
              }
            });
          } catch(e) {}

          try {
            const senderHandle = await page.$('input[placeholder="e.g. Team Eventi"]') || await page.$('input');
            if (senderHandle) { await senderHandle.focus(); await senderHandle.click({ clickCount: 3 }); await senderHandle.type('Team Eventi'); }
          } catch(e) {}

          try {
            const subjectHandle = await page.$('input[placeholder="e.g. Invito Esclusivo: Sales Kick-off 2026"]') || (await page.$$('input'))[1];
            if (subjectHandle) { await subjectHandle.focus(); await subjectHandle.click({ clickCount: 3 }); await subjectHandle.type('Invito di test'); }
          } catch(e) {}

          try {
            const ta = await page.$('textarea[placeholder="Scrivi qui il contenuto dell\'invito..."]') || await page.$('textarea');
            if (ta) { await ta.focus(); await ta.click({ clickCount: 3 }); await ta.type('Corpo di test per il template.'); }
          } catch(e) {}

          // click the Save button found by XPath
          try {
            const [saveBtn] = await page.$x(saveXpath);
            if (saveBtn) { await saveBtn.click(); }
          } catch(e) {}
        } else {
          console.log('Save button not found via XPath after clicking create');
        }
      } else {
        // try direct save if already on create page - but first fill the form
        const saveBtnPresent = await page.$('[data-testid="save-invite"]');
        if (saveBtnPresent) {
          console.log('Found save-invite testid on page; filling form then clicking it');
          await fillInviteForm();
          await new Promise(r => setTimeout(r, 250));
          await saveBtnPresent.click();
        }
      }

      // Prefer reading debug hook window.__LAST_TOAST if present, else check aria-live
      try {
        const lastToast = await page.evaluate(() => {
          // @ts-ignore
          return (typeof window !== 'undefined' && (window).__LAST_TOAST) ? (window).__LAST_TOAST : null;
        });
        if (lastToast && lastToast.message) {
          console.log('LAST_TOAST (dev):', lastToast.message);
        } else {
          // wait a moment and then read aria-live
          try { await page.waitForTimeout(800); } catch(e){}
          const toastNow = await page.evaluate(() => { const a = document.querySelector('[aria-live]'); return a ? a.innerText : null; });
          console.log('TOAST AREA (direct click):', toastNow);
        }
      } catch(e) {
        console.log('Error reading toast state', e);
      }
    } catch(e) {
      console.log('Error checking save-invite testid', e);
    }

    // First try direct test-id click for create (reliable)
    const clickedCreateByTestId = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="create-invite"]');
      if (el) { try { (el).click(); return true; } catch(e) { return false; } }
      return false;
    });

    // Try direct row edit testids (these were added to the component)
    const clickedRowAction = await page.evaluate(() => {
      const ids = ['edit-invite-1', 'edit-invite-2', 'edit-invite-undefined'];
      for (const tid of ids) {
        const el = document.querySelector(`[data-testid="${tid}"]`);
        if (el) { try { (el).click(); return true; } catch(e) {} }
      }
      // fallback: find row for Sales Kick-off Dubai and click first action
      const tripName = 'Sales Kick-off Dubai';
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      for (const r of rows) {
        const firstCell = r.querySelector('td, th');
        const txt = firstCell ? (firstCell.textContent || '').trim() : '';
        if (txt === tripName || txt.includes(tripName)) {
          const actionCell = r.querySelector('td:last-child, th:last-child');
          if (actionCell) {
            const btn = actionCell.querySelector('button, a');
            if (btn) { try { btn.click(); return true; } catch(e) {} }
          }
        }
      }
      return false;
    });
    // Click create new invite button (English or Italian) if no row action clicked
    const clickedCreate = clickedCreateByTestId || clickedRowAction || await clickByText('Create New Invite') || await clickByText('Create New Trip') || await clickByText('Create New') || await clickByText('Crea') || await clickByText('Crea Nuovo') || await clickByText('Crea nuovo invito');
    if (clickedCreate) {
      // wait for the Save button / footer to appear (longer timeout)
      try {
        await page.waitForFunction(() => {
          const candidates = Array.from(document.querySelectorAll('button, a, [role=button]'));
          return candidates.some(n => {
            try { return n.innerText && n.innerText.trim().toLowerCase().includes('salva template'); } catch(e){ return false; }
          });
        }, { timeout: 3000 });

        const clickedSave = await clickByText('save-invite') || await clickByText('Salva Template') || await clickByText('Save Template') || await clickByText('Save') || await clickByText('Salva');
        if (clickedSave) {
            // wait for toast area to change or have content
          // Give the app a bit more time to render and handle the save
          await new Promise(r => setTimeout(r, 1200));
          // Prefer dev hook if available
          try {
            const devToast = await page.evaluate(() => {
              // @ts-ignore
              return (typeof window !== 'undefined' && (window).__LAST_TOAST) ? (window).__LAST_TOAST : null;
            });
            if (devToast && devToast.message) {
              console.log('DEV LAST_TOAST:', devToast.message);
            } else {
              // Attempt to read aria-live area, wait up to 5s for content
              try {
                await page.waitForFunction(() => {
                  const area = document.querySelector('[aria-live]');
                  return area && area.innerText && area.innerText.trim().length > 0;
                }, { timeout: 5000 });
              } catch(e) {}
              const toastAfter = await page.evaluate(() => {
                const area = document.querySelector('[aria-live]');
                return area ? area.innerText : null;
              });
              console.log('TOAST AREA:', toastAfter);
            }
          } catch(e) { console.log('Error reading dev hook', e); }
        } else {
          console.log('Save button not found on invites create form');
        }
      } catch (e) {
        console.log('Timed out waiting for Save button or form to render');
      }
    } else {
      console.log('Create New Invite button not found');
    }

    // Test 2: Manage Participants / Send Reminders (try Italian labels)
    console.log('--- Test 2: Manage Participants reminder with localized labels ---');
    // Navigate to Manage Participants view (try both English and Italian)
    const clickedManage = await clickByText('Manage Participants') || await clickByText('Manage Partecipanti') || await clickByText('Gestione Partecipanti') || await clickByText('Gestione') || await page.evaluate(() => !!document.querySelector('[data-testid="add-new-participant"]'));
    if (!clickedManage) await page.goto('http://localhost:3000').catch(()=>{});
    await new Promise(r => setTimeout(r, 500));

    // Attempt to find a trip row and click to open participants view (try Italian/English trip labels)
    const clickedTrip = await clickByText('Trip to Ibiza') || await clickByText('Sales Kick-off Dubai') || await clickByText('Ski Trip to Aspen') || await clickByText('Viaggi Pronti per l\'Invio') || await clickByText('Team Retreat Mykonos') || await page.evaluate(() => {
      const el = document.querySelector('tr td');
      return !!el;
    });
    if (clickedTrip) await new Promise(r => setTimeout(r, 500));

    // Select all checkboxes (header) if present
    await page.evaluate(() => {
      const headerCheckbox = document.querySelector('table thead input[type=checkbox]');
      if (headerCheckbox && !headerCheckbox.checked) headerCheckbox.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // Click primary action button (if present)
    const clickedPrimary = await clickByText('Send Reminder') || await clickByText('Send Invite') || await clickByText('Invia Reminder') || await clickByText('Invia inviti') || await clickByText('Invia inviti') || await clickByText('Invia aggiornamenti') || await clickByText('Invia') || await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="send-reminder"]') || document.querySelector('[data-testid="send-invite"]');
      if (btn) { try { (btn).click(); return true; } catch(e) { return false; } }
      return false;
    });
    if (clickedPrimary) {
      await new Promise(r => setTimeout(r, 700));
      const toastText2 = await page.evaluate(() => {
        const node = document.querySelector('[aria-live]');
        return node ? node.innerText : null;
      });
      console.log('TOAST AREA 2:', toastText2);
    } else {
      console.log('Primary action button not found');
    }

    // Dump full body innerText for debugging selectors
    const bodyText = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('ui-body-text.txt', bodyText, 'utf8');
    console.log('Wrote body text to ui-body-text.txt (first 200 chars):', bodyText.slice(0,200).replace(/\n/g,' '));

    // Save screenshot
    await page.screenshot({ path: 'ui-toast-test.png', fullPage: true });
    console.log('Screenshot saved to ui-toast-test.png');

  } catch (e) {
    console.error('Test script error', e);
  } finally {
    await browser.close();
  }
})();
