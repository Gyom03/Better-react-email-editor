import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = process.env.OUT ?? 'screenshots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('[console]', m.text()));
await page.goto(process.env.BASE_URL ?? 'http://localhost:5179', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const center = async (locator) => { const b = await locator.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };

// 1. Hover the section heading
const heading = page.locator('.tiptap h2', { hasText: 'Nos coups' });
const hc = await center(heading);
await page.mouse.move(hc.x, hc.y);
await page.waitForTimeout(200);
await shot('01-hover');

// 2. Drag the "Bouton" tile right under the heading
const tile = page.locator('.tile', { hasText: 'Bouton' });
const tc = await center(tile);
await page.mouse.move(tc.x, tc.y);
await page.mouse.down();
const target = { x: hc.x, y: hc.b.y + hc.b.height + 4 };
await page.mouse.move(tc.x - 40, tc.y, { steps: 5 });
await page.mouse.move(target.x, target.y, { steps: 20 });
await page.waitForTimeout(150);
await page.mouse.move(target.x, target.y + 1);
await page.waitForTimeout(150);
await shot('02-dragging');
await page.mouse.up();
await page.waitForTimeout(300);
await shot('03-dropped');
console.log('buttons after drop:', await page.locator('.tiptap a.node-button').count());

// 3. Drop an image into an empty column: first add a 2-col layout at the end by click
await page.locator('.sidebar .icon-button[title^="Fermer"]').click();
await page.waitForTimeout(200);
await page.locator('.tile', { hasText: '2 colonnes' }).click();
await page.waitForTimeout(300);
await page.locator('.sidebar .icon-button[title^="Fermer"]').click();
await page.waitForTimeout(200);
const emptyCol = page.locator('.tiptap .node-column').last();
await emptyCol.scrollIntoViewIfNeeded();
const ec = await center(emptyCol);
const imgTile = await center(page.locator('.tile', { hasText: 'Image' }));
await page.mouse.move(imgTile.x, imgTile.y);
await page.mouse.down();
await page.mouse.move(ec.x, ec.y, { steps: 20 });
await page.waitForTimeout(150);
await page.mouse.move(ec.x + 1, ec.y);
await page.waitForTimeout(150);
await shot('04-drag-into-column');
await page.mouse.up();
await page.waitForTimeout(400);
await shot('05-dropped-in-column');

// 4. Move the hero section to the top using the hover handle
await page.locator('.canvas').evaluate((el) => (el.scrollTop = 0));
await page.waitForTimeout(200);
// Select the hero section (click its text, Escape -> parent) to get its handle
await page.locator('.tiptap p', { hasText: 'Découvrez' }).click();
await page.waitForTimeout(200);
await page.keyboard.press('Escape');
await page.waitForTimeout(250);
const handle = page.locator('.ov-selected .ov-handle');
console.log('handle visible:', await handle.isVisible(), '| panel:', await page.locator('.properties-header h2').textContent().catch(() => '-'), '| frame:', await page.locator('.ov-selected').getAttribute('class').catch(() => 'none'), '| active:', await page.evaluate(() => document.activeElement?.className));
const hd = await center(handle);
console.log('handle box', hd.b);
const logo = await center(page.locator('.tiptap img').first());
console.log('logo box', logo.b);
await page.mouse.move(hd.x, hd.y);
console.log('moved to handle');
await page.mouse.down();
console.log('mouse down');
await page.mouse.move(hd.x + 30, hd.y - 30, { steps: 5 });
await page.mouse.move(logo.x + 100, logo.b.y + 2, { steps: 20 });
await page.waitForTimeout(150);
await page.mouse.move(logo.x + 101, logo.b.y + 2);
await page.waitForTimeout(150);
console.log('before shot 06');
await shot('06-moving');
await page.mouse.up();
await page.waitForTimeout(400);
await shot('07-moved');
console.log('first block type:', await page.evaluate(() => document.querySelector('.tiptap .node-container').firstElementChild?.className));

// 5. Click into a paragraph -> properties
await page.locator('.tiptap p', { hasText: 'Découvrez' }).click();
await page.waitForTimeout(300);
await shot('08-selected-paragraph');
await browser.close();
