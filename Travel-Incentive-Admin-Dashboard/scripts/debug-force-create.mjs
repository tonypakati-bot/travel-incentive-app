#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.argv[2] || 'http://127.0.0.1:3000';
(async ()=>{
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1200, height: 900 } });
  const page = await browser.newPage();
  page.on('console', msg => { try { console.log('[page:'+msg.type()+']', msg.text()); } catch(e){} });
  page.on('request', req => console.log('[page:request]', req.method(), req.url()));
  page.on('requestfailed', r => console.log('[page:requestfailed]', r.url(), r.failure() && r.failure().errorText));

  console.log('Opening', BASE);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // wait for hook presence
  const ok = await page.waitForFunction(() => !!(window.__E2E_forceCreateDocument), { timeout: 10000 }).catch(()=>null);
  if (!ok) { console.warn('Hook not present'); await browser.close(); process.exit(2); }
  console.log('Hook present — invoking __E2E_forceCreateDocument');
  const payload = { title: 'DEBUG HOOK DOC '+Date.now(), content: 'debug content', usefulInfo: { destinationName: 'D', country: 'C' } };
  const res = await page.evaluate(async (p)=>{ try { return await window.__E2E_forceCreateDocument(p); } catch (e) { return { ok:false, reason: e && e.message }; } }, payload);
  console.log('Hook call result:', res);
  console.log('Waiting 1500ms for requests...');
  await new Promise(r=>setTimeout(r,1500));
  await browser.close();
  process.exit(0);
})();