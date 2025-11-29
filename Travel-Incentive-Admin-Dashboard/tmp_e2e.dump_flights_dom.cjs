const puppeteer = require('puppeteer');
(async ()=>{
  const url = process.argv[2] || 'http://localhost:3000';
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const sleep = ms => new Promise(r=>setTimeout(r,ms));
    await sleep(600);
    // create a trip via API and inject it so CreateTrip mounts with tripId
    const created = await page.evaluate(async () => {
      try {
        const payload = { name: 'E2E Dump Trip', clientName: 'E2E', startDate: '2025-12-01', endDate: '2025-12-06' };
        const res = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const json = await res.json().catch(()=>null);
        if (res.ok && json) {
          try { if (window.__E2E_setTripDraft) return window.__E2E_setTripDraft({ tripId: String(json._id || json.id || json.tripId), name: payload.name }); } catch(e) {}
          try { window.__E2E_injectedTrip = { tripId: String(json._id || json.id || json.tripId), name: payload.name }; } catch(e) {}
          return { ok: true, id: String(json._id || json.id || json.tripId) };
        }
        return { ok: false, status: res.status, body: json };
      } catch (e) { return { ok: false, reason: e && e.message }; }
    });
    // click Create New Trip
    await page.evaluate(()=>{ const btn = Array.from(document.querySelectorAll('button')).find(b=>b.textContent && b.textContent.includes('Create New Trip')); if(btn) btn.click(); });
    await sleep(600);
    // open Sezione 4 by clicking its header (header has aria-expanded)
    await page.evaluate(()=>{
      const title = Array.from(document.querySelectorAll('h2')).find(h=>h.textContent && h.textContent.includes('Sezione 4'));
      if (!title) return false;
      const header = title.closest('[aria-expanded]');
      if (header) header.click();
      return !!header;
    });
    await sleep(600);
    // get labels and inputs inside Sezione 4 content (the content is the sibling after header)
    const data = await page.evaluate(()=>{
      const title = Array.from(document.querySelectorAll('h2')).find(h=>h.textContent && h.textContent.includes('Sezione 4'));
      if (!title) return { error: 'no-section-header' };
      const header = title.closest('[aria-expanded]');
      const content = header && header.nextElementSibling ? header.nextElementSibling.querySelector('.p-6') || header.nextElementSibling : null;
      if (!content) return { error: 'no-section-content' };
      const labels = Array.from(content.querySelectorAll('label')).map(l=>({ text: l.textContent && l.textContent.trim(), for: l.getAttribute('for') }));
      const inputs = Array.from(content.querySelectorAll('input,select,textarea')).map(i=>({ tag: i.tagName, placeholder: i.getAttribute('placeholder'), value: i.value, name: i.getAttribute('name'), id: i.id, class: i.className }));
      return { labels, inputs };
    });
    console.log(JSON.stringify(data, null, 2));
    await browser.close();
  } catch (e) { console.error(e && e.message ? e.message : e); await browser.close(); process.exit(1); }
})();
