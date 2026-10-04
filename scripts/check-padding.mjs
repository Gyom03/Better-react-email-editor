import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(process.env.BASE_URL ?? 'http://localhost:5179', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.locator('.tiptap p', { hasText: 'Découvrez' }).click();
await page.locator('.crumb button', { hasText: 'Section' }).click();
await page.waitForTimeout(300);
const values = await page.locator('.padding-grid input').evaluateAll((els) => els.map((e) => e.value));
console.log('section padding (top,right,bottom,left):', values);
// Edit "Haut" to 8 and confirm the attr has no shorthand left
const top = page.locator('.padding-grid input').first();
await top.fill('8');
await top.press('Enter');
await page.waitForTimeout(200);
console.log('section style attr:', await page.evaluate(() => document.querySelector('.tiptap .node-section').getAttribute('style')));
await browser.close();
