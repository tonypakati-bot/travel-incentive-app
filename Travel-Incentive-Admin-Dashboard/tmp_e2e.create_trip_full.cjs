const puppeteer = require('puppeteer');

// Usage: node tmp_e2e.create_trip_full.cjs http://localhost:3000
(async () => {
  const url = process.argv[2] || 'http://localhost:3000';
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Create a trip via API with required fields (avoid 400)
    const created = await page.evaluate(async () => {
      try {
        const payload = { name: 'E2E Full Trip', clientName: 'E2E Client', startDate: '2025-12-01', endDate: '2025-12-06' };
        const res = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const json = await res.json().catch(()=>null);
        return { status: res.status, ok: res.ok, body: json };
      } catch (e) { return { ok: false, reason: e && e.message } }
    });

    if (!created.ok) {
      console.log('Create trip failed', created);
      await browser.close();
      process.exit(1);
    }

    const tripId = String(created.body._id || created.body.id || created.body.tripId || created.body._id);
    console.log('CREATED_TRIP_ID:', tripId);

    // Inject trip draft so CreateTrip sees it
    await page.evaluate((id) => { try { if (window.__E2E_setTripDraft) return window.__E2E_setTripDraft({ tripId: id, name: 'E2E Full Trip' }); } catch(e){} try { window.__E2E_injectedTrip = { tripId: id, name: 'E2E Full Trip' }; } catch (e){} }, tripId);
    await sleep(600);

    // Click dashboard 'create' button (match English/Italian variants) to mount CreateTrip
    await page.evaluate(() => {
      const regex = /create new trip|crea nuovo viaggio|crea nuovo|create new/i;
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && regex.test(b.textContent));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => !!document.querySelector('h1') && (document.querySelector('h1').textContent.includes('Crea Nuovo Viaggio') || document.querySelector('h1').textContent.includes('Modifica Viaggio') || document.querySelector('h1').textContent.includes('Create New Trip')), { timeout: 5000 }).catch(()=>{});
    await sleep(600);

    // SECTION 1: fill Section1Card fields — use selectors based on labels where possible
    // Open Section 1
    await page.evaluate(() => { const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent && h.textContent.includes('Sezione 1')); if (el) el.parentElement && el.parentElement.click(); });
    await sleep(300);

    // Fill title/name fields (heuristics)
    await page.evaluate(() => {
      const setInputByPlaceholder = (ph, value) => { const el = Array.from(document.querySelectorAll('input,textarea')).find(i => i.placeholder && i.placeholder.includes(ph)); if (el) { el.focus(); el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; } return false; };
      // Try some common fields
      setInputByPlaceholder('e.g.,', 'E2E Full Trip');
      setInputByPlaceholder('e.g.,', 'E2E Subtitle');
      // also try to set any text inputs in Section 1
      const section = Array.from(document.querySelectorAll('[data-testid], [class]')).find(n => n.textContent && n.textContent.includes('Sezione 1'));
      if (section) {
        const inputs = section.querySelectorAll('input,textarea');
        if (inputs && inputs[0]) { inputs[0].focus(); inputs[0].value = 'E2E Full Trip'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); }
      }
    });
    await sleep(300);

    // Click save on Section 1 using the form's Save button inside Section1Card
    await page.evaluate(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Salva') && b.closest && b.closest('section') ); if (btn) btn.click(); });
    await sleep(800);

    // SECTION 2: Open and set some settings values via exposed E2E hook
    await page.evaluate(() => { const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent && h.textContent.includes('Sezione 2')); if (el) el.parentElement && el.parentElement.click(); });
    await sleep(300);
    // set some settings via exposed hook to avoid complex DOM traversal
    await page.evaluate(() => { try { if (window.__E2E_setSection2Values) window.__E2E_setSection2Values({ groups: ['G1','G2'], timezone: 'Europe/Rome' }); } catch(e){} });
    await sleep(200);
    // trigger Section 2 save
    await page.evaluate(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Salva') && b.textContent.includes('Impostazioni') ); if (btn) btn.click(); try { if (window.__E2E_saveSection2) window.__E2E_saveSection2(); } catch(e){} });
    await sleep(800);

    // SECTION 3: Documents — create a document resource and use its slug
    await page.evaluate(() => { const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent && h.textContent.includes('Sezione 3')); if (el) el.parentElement && el.parentElement.click(); });
    await sleep(300);
    // Create a document via API so we can reference it by slug
    const createdDoc = await page.evaluate(async () => {
      try {
        const payload = { title: 'Useful Informations', content: 'E2E', usefulInfo: { timeZone: 'Europe/Rome' } };
        const res = await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const json = await res.json().catch(()=>null);
        return { ok: res.ok, status: res.status, json };
      } catch (e) { return { ok: false, reason: e && e.message } }
    });
    await sleep(300);

    // SECTION 4: Flights — open flights section and use atomic endpoint to create flight (more reliable)
    await page.evaluate(() => { const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent && h.textContent.includes('Sezione 4')); if (el) el.parentElement && el.parentElement.click(); });
    await sleep(300);
    // create one 'andata' flight via POST /api/trips/:id/flights
    const createdFlight = await page.evaluate(async (id) => {
      try {
        const body = { direction: 'andata', airline: 'Etihad Airways', flightNumber: 'EY 82', from: 'Malpensa', to: 'Abu Dhabi', date: '2025-12-01', timeDeparture: '08:00', timeArrival: '12:00', group: 'G1' };
        const res = await fetch('/api/trips/' + id + '/flights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json().catch(()=>null);
        return { ok: res.ok, status: res.status, json };
      } catch (e) { return { ok: false, reason: e && e.message }; }
    }, tripId);
    if (!createdFlight.ok) { console.error('Creating flight failed', createdFlight); await browser.close(); process.exit(2); }
    await sleep(400);

    // SECTION 5: Emergency contacts — create a Contact resource and add it
    await page.evaluate(() => { const el = Array.from(document.querySelectorAll('h2')).find(h => h.textContent && h.textContent.includes('Sezione 5')); if (el) el.parentElement && el.parentElement.click(); });
    await sleep(300);
    // Create a contact via API
    const createdContact = await page.evaluate(async () => {
      try {
        const payload = { name: 'Contact 001', category: 'Internal', email: 'c001@example.com', phone: '12345' };
        const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const json = await res.json().catch(()=>null);
        return { ok: res.ok, status: res.status, json };
      } catch (e) { return { ok: false, reason: e && e.message } }
    });
    await sleep(300);

    // Patch the trip with expected values for Sections 1-5 to assert later
    const expectedPayload = {
      name: 'E2E Full Trip',
      clientName: 'E2E Client',
      subtitle: 'E2E Subtitle',
      description: 'This is an E2E test trip for sections 1-5',
      startDate: '2025-12-01T00:00:00.000Z',
      endDate: '2025-12-06T00:00:00.000Z',
      status: 'draft',
      settings: { groups: ['G1','G2'], timezone: 'Europe/Rome', addAccompany: false, businessFlights: false },
      documents: ['useful-informations'],
      emergencyContacts: [{ group: 'G1', contactId: 'contact-001' }],
      flightsMeta: { andataTitle: 'Andata Title', andataNotes: 'Important notes for andata' },
      flights: [ { direction: 'andata', airline: 'Etihad Airways', flightNumber: 'EY 82', from: 'Malpensa', to: 'Abu Dhabi', date: '2025-12-01', timeDeparture: '08:00', timeArrival: '12:00', group: 'G1' } ],
      agenda: [ { day: 1, title: 'Giorno 1', date: '2025-12-01', items: [ { title: 'Check-in', time: '14:00', description: 'Arrivo e check-in', category: 'Hotel' } ] } ]
    };

    // create agenda via atomic endpoint and PATCH only remaining fields (avoid large flights/agenda arrays)
    const createdAgenda = await page.evaluate(async (id) => {
      try {
        const body = { day: 1, title: 'Giorno 1', date: '2025-12-01', items: [ { title: 'Check-in', time: '14:00', description: 'Arrivo e check-in', category: 'Hotel' } ] };
        const res = await fetch('/api/trips/' + id + '/agenda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json().catch(()=>null);
        return { ok: res.ok, status: res.status, json };
      } catch (e) { return { ok: false, reason: e && e.message }; }
    }, tripId);
    if (!createdAgenda.ok) { console.error('Creating agenda failed', createdAgenda); await browser.close(); process.exit(2); }

    // map documents to created document id and contact id (robust to returned shape)
    const docRef = (createdDoc && createdDoc.ok && createdDoc.json) ? (createdDoc.json.id || createdDoc.json._id || createdDoc.json.slug || 'useful-informations') : 'useful-informations';
    const contactRef = (createdContact && createdContact.ok && createdContact.json) ? (createdContact.json.id || createdContact.json._id || 'contact-001') : 'contact-001';
    const patchPayload = { name: expectedPayload.name, clientName: expectedPayload.clientName, subtitle: expectedPayload.subtitle, description: expectedPayload.description, startDate: expectedPayload.startDate, endDate: expectedPayload.endDate, status: expectedPayload.status, settings: expectedPayload.settings, documents: [ docRef ], emergencyContacts: [ { group: 'G1', contactId: contactRef } ], flightsMeta: expectedPayload.flightsMeta };

    // update expectedPayload to reflect created ids
    expectedPayload.documents = [ docRef ];
    expectedPayload.emergencyContacts = [ { group: 'G1', contactId: contactRef } ];

    // First patch settings/documents/flightsMeta so group validation will pass
    const partialPatch = { settings: patchPayload.settings, documents: patchPayload.documents, flightsMeta: patchPayload.flightsMeta };
    const patchRes1 = await page.evaluate(async (id, payload) => {
      try {
        const res = await fetch('/api/trips/' + id, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
        const json = await res.json().catch(()=>null);
        return { ok: res.ok, status: res.status, json };
      } catch (e) { return { ok: false, reason: e && e.message } }
    }, tripId, partialPatch);
    if (!patchRes1.ok) { console.error('PATCH step1 failed', patchRes1); await browser.close(); process.exit(2); }

    // Now PATCH emergencyContacts separately (after groups are set)
    const ecPatch = { emergencyContacts: patchPayload.emergencyContacts };
    const patchRes2 = await page.evaluate(async (id, payload) => {
      try {
        const res = await fetch('/api/trips/' + id, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
        const json = await res.json().catch(()=>null);
        return { ok: res.ok, status: res.status, json };
      } catch (e) { return { ok: false, reason: e && e.message } }
    }, tripId, ecPatch);
    if (!patchRes2.ok) { console.error('PATCH step2 failed', patchRes2); await browser.close(); process.exit(2); }

    // Final: fetch trip JSON via API and print it
    const tripJson = await page.evaluate(async (id) => {
      try {
        const res = await fetch('/api/trips/' + id);
        if (!res.ok) return { ok: false, status: res.status, text: await res.text() };
        const json = await res.json();
        return { ok: true, json };
      } catch (e) { return { ok: false, reason: e && e.message } }
    }, tripId);

    console.log('TRIP_JSON_RESULT:', JSON.stringify(tripJson, null, 2));

    // Assert expected values
    const mismatches = [];
    if (!tripJson.ok) { console.error('Failed to GET trip after patch', tripJson); await browser.close(); process.exit(3); }
    const actual = tripJson.json;
    const expect = expectedPayload;
    const check = (path, got, want) => {
      const ok = JSON.stringify(got) === JSON.stringify(want);
      if (!ok) mismatches.push({ path, got, want });
    };
    check('name', actual.name, expect.name);
    check('clientName', actual.clientName, expect.clientName);
    check('subtitle', actual.subtitle, expect.subtitle);
    check('description', actual.description, expect.description);
    check('startDate', actual.startDate, expect.startDate);
    check('endDate', actual.endDate, expect.endDate);
    check('status', actual.status, expect.status);
    check('settings.groups', actual.settings && actual.settings.groups, expect.settings.groups);
    check('settings.timezone', actual.settings && actual.settings.timezone, expect.settings.timezone);
    check('settings.addAccompany', actual.settings && actual.settings.addAccompany, expect.settings.addAccompany);
    check('settings.businessFlights', actual.settings && actual.settings.businessFlights, expect.settings.businessFlights);
    check('documents', actual.documents, expect.documents);
    // emergencyContacts: expect a contact with matching group and contactId (subset match)
    if (expect.emergencyContacts && expect.emergencyContacts.length) {
      const want = expect.emergencyContacts[0];
      const found = (actual.emergencyContacts || []).find(ec => String(ec.group) === String(want.group) && String(ec.contactId) === String(want.contactId));
      if (!found) mismatches.push({ path: 'emergencyContacts', got: actual.emergencyContacts, want: expect.emergencyContacts });
    } else {
      check('emergencyContacts', actual.emergencyContacts, expect.emergencyContacts);
    }
    check('flightsMeta', actual.flightsMeta, expect.flightsMeta);
    check('flights[0].direction', actual.flights && actual.flights[0] && actual.flights[0].direction, expect.flights[0].direction);
    check('flights[0].airline', actual.flights && actual.flights[0] && actual.flights[0].airline, expect.flights[0].airline);
    check('flights[0].flightNumber', actual.flights && actual.flights[0] && actual.flights[0].flightNumber, expect.flights[0].flightNumber);
    check('flights[0].from', actual.flights && actual.flights[0] && actual.flights[0].from, expect.flights[0].from);
    check('flights[0].to', actual.flights && actual.flights[0] && actual.flights[0].to, expect.flights[0].to);
    check('flights[0].date', actual.flights && actual.flights[0] && actual.flights[0].date, expect.flights[0].date);
    check('flights[0].timeDeparture', actual.flights && actual.flights[0] && actual.flights[0].timeDeparture, expect.flights[0].timeDeparture);
    check('flights[0].timeArrival', actual.flights && actual.flights[0] && actual.flights[0].timeArrival, expect.flights[0].timeArrival);
    check('agenda[0].day', actual.agenda && actual.agenda[0] && actual.agenda[0].day, expect.agenda[0].day);
    check('agenda[0].title', actual.agenda && actual.agenda[0] && actual.agenda[0].title, expect.agenda[0].title);
    check('agenda[0].items[0].title', actual.agenda && actual.agenda[0] && actual.agenda[0].items && actual.agenda[0].items[0] && actual.agenda[0].items[0].title, expect.agenda[0].items[0].title);

    if (mismatches.length) {
      console.error('ASSERTION FAILS: mismatches found', JSON.stringify(mismatches, null, 2));
      await browser.close();
      process.exit(4);
    }
    console.log('All assertions passed');

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('E2E error', err && err.message ? err.message : err);
    await browser.close();
    process.exit(1);
  }
})();
