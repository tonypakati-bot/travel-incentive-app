E2E guide — using dev-hooks

This document shows how to run the headful E2E script and how to use the dev-only hooks exposed in the app for deterministic tests.

Prereqs
- Start the admin app (dev) on port 3000:

```bash
npm run dev -- --port 3000
```

- Ensure backend API is reachable at `http://localhost:5001` (or set `API_BASE` env var).

Run the orchestrator

```bash
node scripts/e2e-documents.mjs --url http://localhost:3000
```

Dev-hooks (available in dev only)
- `window.__E2E_setSection1Fields(payload)` — set Section 1 fields (clientName, name, subtitle, description, startDate, endDate)
- `window.__E2E_saveSection1()` — save Section 1; returns `{ ok: true, trip }`
- `window.__E2E_setSection2Values(values)` — set Section 2 values (groups, addAccompany, businessFlights)
- `window.__E2E_saveSection2(overrideSettings?)` — save Section 2; returns `{ ok: true, trip }`
- `window.__E2E_setDocCreatorFields(payload)` — populate DocumentCreator modal fields
- `window.__E2E_invokeCreate(opts?)` — invoke create (uses last set payload if `opts` not provided). Returns `{ ok: true, doc }`.
- `window.__E2E_forceCreateDocument(payload)` — directly create a document bypassing modal; returns `{ ok: true, doc }`.
- `window.__E2E_selectDocumentAndSave(docId)` — attach `docId` to current trip and persist; returns `{ ok: true, trip }`
- `window.__E2E_saveSection3()` — save Document section (persists selected documents + settings)

Example usage from Puppeteer `page.evaluate`:

```js
// set Section 1 fields
await page.evaluate(() => window.__E2E_setSection1Fields({ clientName: 'E2E Client', name: 'E2E Trip', subtitle: 'E2E Subtitle', description: 'E2E description', startDate: '2025-01-01', endDate: '2025-01-04' }));
// save Section 1
await page.evaluate(async () => await window.__E2E_saveSection1());

// open modal (via DocumentDropdown) then set modal fields and create
await page.evaluate(() => window.__E2E_setDocCreatorFields({ title: 'E2E Doc', destinationName: 'X', country: 'Y' }));
const res = await page.evaluate(async () => await window.__E2E_invokeCreate());
console.log('created doc', res);

// attach and save
await page.evaluate(async (id) => await window.__E2E_selectDocumentAndSave(id), res.doc.value);
```

Notes
- All hooks are only registered when `import.meta.env.DEV` is truthy (development builds). They are removed on unmount or when the component cleans up.
- The orchestrator script prefers UI flows and will fallback to backend creation when necessary.
