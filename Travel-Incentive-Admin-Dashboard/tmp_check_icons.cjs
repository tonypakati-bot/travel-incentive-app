const puppeteer = require('puppeteer');
const url = process.argv[2] || 'http://localhost:3000';
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    // open Privacy from sidebar
    const link = await page.$x("//a[contains(., 'Privacy Policy') or contains(., 'Privacy')]");
    if (link && link[0]) {
      await link[0].click();
      await page.waitForTimeout(800);
    }
    // Count delete buttons by aria-label/title
    const deleteCount = await page.$$eval('button[aria-label="Elimina documento"], button[title="Elimina documento"]', els => els.length);
    const pencilCount = await page.$$eval('button[aria-label="Edit document"], button[title="Edit document"]', els => els.length);
    console.log('deleteCount', deleteCount, 'pencilCount', pencilCount);
  } catch (e) {
    console.error('error', e);
  } finally {
    await browser.close();
  }
})();
