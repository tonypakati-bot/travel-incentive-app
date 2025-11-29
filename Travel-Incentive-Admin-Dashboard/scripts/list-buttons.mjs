import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  // Block images/fonts to speed up load
  await page.setRequestInterception(true);
  page.on('request', req => {
    const r = req.resourceType();
    if (r === 'image' || r === 'font' || r === 'stylesheet') req.abort(); else req.continue();
  });
  await page.goto('http://localhost:3001/', { timeout: 60000, waitUntil: 'domcontentloaded' });
  await page.waitForSelector('body');
  const texts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).slice(0,40).map(b => (b.textContent || '').trim());
  });
  console.log('Buttons found:', texts.length);
  console.log(texts.join('\n'));
  await browser.close();
})();
