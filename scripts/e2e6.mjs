// Realistic handle usage: the mouse travels (no teleport) and the block is selected first.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = process.env.OUT ?? 'screenshots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(process.env.BASE_URL ?? 'http://localhost:5179/?lang=fr', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const center = async (l) => { const b = await l.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
const order = () => page.evaluate(() => [...document.querySelector('.tiptap .node-container').children].map((k) => (k.textContent || k.getAttribute('data-type') || k.tagName).trim().slice(0, 18)));

// 1. Hover alone must not show any handle anymore
const heading = page.locator('.tiptap h2', { hasText: 'Nos coups' });
const h = await center(heading);
await page.mouse.move(h.x, h.y, { steps: 5 });
await page.waitForTimeout(150);
console.log('handles while only hovering:', await page.locator('.bree-ov-handle').count());

// 2. Select the heading by clicking its text, then travel to the handle
await page.mouse.click(h.x, h.y);
await page.waitForTimeout(200);
const handle = page.locator('.bree-ov-selected .bree-ov-handle');
console.log('handle after select:', await handle.isVisible());
const hd = await center(handle);
await page.mouse.move(hd.x, hd.y, { steps: 15 });
await page.waitForTimeout(150);
console.log('handle still there after travelling:', await handle.isVisible());

// 3. Click without dragging keeps the selection
await page.mouse.down();
await page.waitForTimeout(80);
console.log('selection kept on mousedown:', await page.locator('.bree-ov-selected').count(), '| panel:', await page.locator('.bree-properties-header h2').textContent());

// 4. Drag it above the hero
console.log('before:', (await order()).slice(0, 5));
const hero = await center(page.locator('.tiptap .node-section').first());
await page.mouse.move(hd.x + 10, hd.y - 20, { steps: 5 });
await page.mouse.move(hero.x, hero.b.y + 4, { steps: 25 });
await page.waitForTimeout(150);
await page.mouse.move(hero.x + 1, hero.b.y + 4);
await page.waitForTimeout(150);
await page.screenshot({ path: `${OUT}/60-handle-drag.png` });
await page.mouse.up();
await page.waitForTimeout(300);
console.log('after: ', (await order()).slice(0, 5));
await page.screenshot({ path: `${OUT}/61-after-move.png` });

// 5. Toolbar still works: duplicate the moved heading
const before = await page.locator('.tiptap h2', { hasText: 'Nos coups' }).count();
await page.locator('.bree-ov-tool[title="Dupliquer"]').click();
await page.waitForTimeout(200);
console.log('headings before/after duplicate:', before, await page.locator('.tiptap h2', { hasText: 'Nos coups' }).count());
await browser.close();
