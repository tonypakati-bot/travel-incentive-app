#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.argv[2] || 'http://127.0.0.1:3000';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async ()=>{
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1200, height: 900 } });
  const page = await browser.newPage();
  page.on('console', msg => { try { console.log('[page:'+msg.type()+']', msg.text()); } catch(e){} });
  page.on('request', req => console.log('[page:request]', req.method(), req.url()));
  page.on('requestfailed', r => console.log('[page:requestfailed]', r.url(), r.failure() && r.failure().errorText));

  console.log('Opening', BASE);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // navigate to open CreateTrip if necessary
  await sleep(500);
  // Try clicking Create New Trip or Manage Trip to ensure CreateTrip is present
  await page.evaluate(()=>{ const btn = Array.from(document.querySelectorAll('button')).find(b=>b.textContent && (b.textContent.includes('Create New Trip')||b.textContent.includes('Crea Nuovo'))); if(btn) btn.click(); });
  await sleep(500);
  // Expand Section 3
  await page.evaluate(()=>{
    const candidates = Array.from(document.querySelectorAll('div[role="button"]'));
    for(const c of candidates){ const h2 = c.querySelector('h2'); if(h2 && h2.textContent && h2.textContent.includes('Sezione 3')) { c.click(); return true; }}
    return false;
  });
  await sleep(300);
  // open create modal button
  const createBtn = await page.$('[data-testid="doc-selector-usefulInformations-create"]');
  if (createBtn) {
    await page.evaluate(()=>{ const b = document.querySelector('[data-testid="doc-selector-usefulInformations-create"]'); if(b){ b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); }});
  } else {
    console.log('Create button not found; trying dev hook open');
    await page.evaluate(()=>{ if(window.__E2E_openDocCreator && window.__E2E_openDocCreator['doc-selector-usefulInformations']) window.__E2E_openDocCreator['doc-selector-usefulInformations'](); });
  }
  await page.waitForSelector('[data-testid="doc-creator-root"]', { timeout: 5000 }).catch(()=>{ console.log('Modal not found'); });
  // wrap fetch to log calls
  await page.evaluate(()=>{
    const _f = window.fetch;
    window.__E2E_fetch_calls = [];
    window.fetch = function(input, init){
      try{
        const url = (typeof input === 'string') ? input : (input && input.url) || '';
        const method = (init && init.method) || (typeof input === 'object' && input && input.method) || 'GET';
        console.log('[page:fetch-wrap] method='+method+' url='+url+' body='+(init && init.body ? init.body.toString().slice(0,200) : '')); 
        window.__E2E_fetch_calls.push({ method, url, body: init && init.body });
      }catch(e){}
      return _f.apply(this, arguments);
    };
  });
  // wait a bit
  await sleep(200);
  // check hooks
  const hasHooks = await page.evaluate(()=>({ set: !!window.__E2E_setDocCreatorFields, invoke: !!window.__E2E_invokeCreate, force: !!window.__E2E_forceCreateDocument }));
  console.log('Hooks present', hasHooks);
  // set fields and invoke create via hooks when available
  if (hasHooks.set && hasHooks.invoke) {
    const payload = { title: 'DEBUG HOOK CREATED '+Date.now(), destinationName: 'D', country: 'C', content: 'content' };
    const setRes = await page.evaluate((p)=>{ try{ return window.__E2E_setDocCreatorFields(p); }catch(e){ return { ok:false, reason: e && e.message }; } }, payload);
    console.log('setRes', setRes);
    // read input value in DOM to check whether hook applied to inputs
    const inputVal = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="doc-creator-title"]');
      return el ? (el.value || '') : null;
    });
    console.log('Modal title input value after setHook:', inputVal);
    await sleep(300);
    const inv = await page.evaluate(async ()=>{ try { return await window.__E2E_invokeCreate(); } catch(e){ return { ok:false, reason: e && e.message }; } });
    console.log('invokeRes', inv);
    const lastAttempt = await page.evaluate(() => window.__E2E_lastCreateAttempt || null);
    console.log('__E2E_lastCreateAttempt after invoke:', lastAttempt);
  } else if (hasHooks.force) {
    const payload = { title: 'DEBUG FORCE '+Date.now(), content: 'force content' };
    const fr = await page.evaluate(async (p)=>{ try { return await window.__E2E_forceCreateDocument(p); } catch(e){ return { ok:false, reason: e && e.message }; } }, payload);
    console.log('force res', fr);
  } else {
    console.log('No dev hooks available; attempting to fill fields and click Create');
    await page.type('[data-testid="doc-creator-title"]', 'DEBUG MANUAL '+Date.now());
    await page.click('[data-testid="doc-creator-create"]');
  }

  await sleep(800);
  const calls = await page.evaluate(()=>window.__E2E_fetch_calls);
  console.log('Wrapped fetch calls:', calls);
  await browser.close();
  process.exit(0);
})();