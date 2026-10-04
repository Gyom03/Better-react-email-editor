import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = process.env.OUT ?? 'screenshots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(process.env.BASE_URL ?? 'http://localhost:5179', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const center = async (l) => { const b = await l.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
const count = (sel) => page.locator(sel).count();

// Drop "Citation" in the empty canvas area below the email
await page.locator('.canvas').evaluate((el) => (el.scrollTop = el.scrollHeight));
await page.waitForTimeout(200);
const tile = await center(page.locator('.tile', { hasText: 'Citation' }));
const container = await center(page.locator('.tiptap .node-container'));
const below = { x: container.x, y: Math.min(container.b.y + container.b.height + 60, 880) };
await page.mouse.move(tile.x, tile.y);
await page.mouse.down();
await page.mouse.move(below.x, below.y, { steps: 20 });
await page.waitForTimeout(120);
await page.mouse.move(below.x + 1, below.y);
await page.waitForTimeout(120);
await shot('30-drop-below');
await page.mouse.up();
await page.waitForTimeout(300);
const lastType = await page.evaluate(() => {
  const kids = [...document.querySelector('.tiptap .node-container').children];
  return kids.slice(-3).map((k) => k.tagName.toLowerCase() + '.' + k.className.split(' ')[0]);
});
console.log('last children:', lastType);

// HTML block via click, then shown in canvas
await page.locator('.sidebar .icon-button[title^="Fermer"]').click();
await page.locator('.tile', { hasText: 'HTML' }).click();
await page.waitForTimeout(400);
await shot('31-html-in-canvas');

// Delete key removes the selected (NodeSelection) html block
const before = await count('.tiptap .node-htmlBlock');
await page.keyboard.press('Delete');
await page.waitForTimeout(200);
console.log('html blocks before/after Delete:', before, await count('.tiptap .node-htmlBlock'));

// Persistence after reload
await page.waitForTimeout(700);
const quotesBefore = await count('.tiptap blockquote');
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
console.log('blockquotes before/after reload:', quotesBefore, await count('.tiptap blockquote'));
await browser.close();
