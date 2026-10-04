// Layers panel: tree, selection, reorder, nest, palette drop.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = process.env.OUT ?? 'screenshots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(process.env.BASE_URL ?? 'http://localhost:5179', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const center = async (l) => { const b = await l.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
const rows = () => page.locator('.layer').evaluateAll((els) => els.map((e) => `${'  '.repeat(Number(e.getAttribute('aria-level')) - 1)}${e.querySelector('.layer-label').textContent}${e.querySelector('.layer-preview') ? ' · ' + e.querySelector('.layer-preview').textContent : ''}`));
const layer = (label, preview) => page.locator('.layer', { has: page.locator('.layer-label', { hasText: label }), ...(preview ? { hasText: preview } : {}) }).first();
async function drag(from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 5, from.y + 8, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 15 });
  await page.waitForTimeout(100);
  await page.mouse.move(to.x + 1, to.y);
  await page.waitForTimeout(100);
}

console.log((await rows()).join('\n'));
await shot('70-layers');

// Click a layer -> selects the block in the canvas + properties
await layer('Titre', 'Nos coups').click();
await page.waitForTimeout(250);
console.log('panel after layer click:', await page.locator('.properties-header h2').textContent(), '| canvas frame:', await page.locator('.ov-selected .ov-tag').textContent());

// Reorder: drag "Titre · Nos coups" before the hero section (top 20% of the row)
const src = await center(layer('Titre', 'Nos coups'));
const sec = await center(layer('Section'));
await drag(src, { x: sec.x, y: sec.b.y + 4 });
await shot('71-layers-dragging');
await page.mouse.up();
await page.waitForTimeout(300);
const r1 = await rows();
console.log('after reorder (top 12):', r1.slice(0, 12));

// Nest: drag the moved heading INSIDE the section (middle of row)
const src2 = await center(layer('Titre', 'Nos coups'));
const sec2 = await center(layer('Section'));
await drag(src2, { x: sec2.x, y: sec2.y });
await page.mouse.up();
await page.waitForTimeout(300);
console.log('after nesting (top 12):', (await rows()).slice(0, 12));

// Palette tile -> into "Colonne 2" of the products row
await page.locator('.sidebar .icon-button[title^="Fermer"]').click().catch(() => {});
await page.waitForTimeout(150);
const tile = await center(page.locator('.tile', { hasText: 'Bouton' }));
const col2 = await center(page.locator('.layer', { has: page.locator('.layer-label', { hasText: 'Colonne 2' }) }).nth(1));
await drag(tile, { x: col2.x, y: col2.y });
await shot('72-layers-palette-drop');
await page.mouse.up();
await page.waitForTimeout(300);
console.log('stray empty texts:', (await rows()).filter((r) => r.endsWith('· vide')).length);
console.log('buttons in products col 2:', await page.locator('.tiptap [data-type="two-columns"]').nth(1).locator('.node-column').nth(1).locator('a.node-button').count());

// Columns cannot be dragged
console.log('column draggable:', await page.locator('.layer.fixed').first().getAttribute('draggable'));
await shot('73-layers-final');
await browser.close();
