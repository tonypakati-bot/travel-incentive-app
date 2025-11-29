const puppeteer = require('puppeteer');
const url = process.argv[2] || 'http://localhost:3000';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    // click sidebar Privacy - find link by text
    const link = await page.$x("//a[contains(., 'Privacy Policy') or contains(., 'Privacy')]");
    if (link && link[0]) {
      await link[0].click();
      await page.waitForTimeout(800);
    }
    // extract titles and subs
    const titles = await page.$$eval('h2.text-lg', els => els.map(e => e.textContent.trim()));
    const subs = await page.$$eval('p.text-sm', els => els.map(e => e.textContent.trim()));
    console.log('TITLES:', JSON.stringify(titles, null, 2));
    console.log('SUBS:', JSON.stringify(subs, null, 2));
  } catch (e) {
    console.error('E2E error', e);
  } finally {
    await browser.close();
  }
})();
