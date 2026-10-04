import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = process.env.OUT ?? 'screenshots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('response', (r) => r.status() >= 400 && console.log('[http]', r.status(), r.url()));
await page.goto(process.env.BASE_URL ?? 'http://localhost:5179/?lang=fr', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const center = async (l) => { const b = await l.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, b }; };
async function drag(from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x - 30, from.y, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 18 });
  await page.waitForTimeout(120);
  await page.mouse.move(to.x + 1, to.y);
  await page.waitForTimeout(120);
}

// Drag the "Avantages" prebuilt block between the hero and the headline
await page.locator('.bree-tabs button', { hasText: 'Blocs' }).click();
const card = await center(page.locator('.bree-block-card', { hasText: 'Avantages' }));
const headline = await center(page.locator('.tiptap h2', { hasText: 'Nos coups' }));
await drag(card, { x: headline.x, y: headline.b.y + 2 });
await shot('20-drag-prebuilt');
await page.mouse.up();
await page.waitForTimeout(400);
console.log('threeColumns rows:', await page.locator('.tiptap [data-type="three-columns"]').count());

// Select that row via its column -> parent, apply 25/50/25
await page.locator('.tiptap [data-type="three-columns"] p').first().click();
await page.waitForTimeout(200);
await page.locator('.bree-ov-tool[title^="Sélectionner"]').click(); // -> column
await page.waitForTimeout(200);
await page.locator('.bree-ov-tool[title^="Sélectionner"]').click(); // -> row
await page.waitForTimeout(250);
await shot('21-row-selected');
await page.locator('.bree-ratio', { hasText: '25 / 50 / 25' }).click();
await page.waitForTimeout(300);
await shot('22-row-ratio');
console.log('col styles:', await page.locator('.tiptap [data-type="three-columns"] > .node-column').evaluateAll((els) => els.map((e) => e.getAttribute('style'))));

// Social block in the footer: select & edit
await page.locator('.bree-sidebar .bree-icon-button[title^="Fermer"]').click();
const social = page.locator('.tiptap .node-socialLinks');
await social.scrollIntoViewIfNeeded();
await social.click();
await page.waitForTimeout(300);
await page.locator('button', { hasText: '+ Ajouter un réseau' }).click();
await page.waitForTimeout(300);
await shot('23-social');
console.log('social icons:', await social.locator('img').count());

// Spacer: select first spacer and set height via range
const spacer = page.locator('.tiptap .node-spacer').first();
await spacer.scrollIntoViewIfNeeded();
await spacer.click();
await page.waitForTimeout(200);
await page.locator('.bree-range input').first().fill('64');
await page.waitForTimeout(200);
console.log('spacer height:', await spacer.getAttribute('data-height'));

// HTML tile: click-to-append, edit its code
await page.locator('.bree-sidebar .bree-icon-button[title^="Fermer"]').click();
await page.locator('.bree-tabs button', { hasText: 'Contenu' }).click();
await page.locator('.bree-tile', { hasText: 'HTML' }).click();
await page.waitForTimeout(300);
const ta = page.locator('.bree-sidebar textarea');
await ta.fill('<div style="padding:12px;background:#fef3c7;border-radius:8px;text-align:center;font-family:sans-serif">🎁 Code promo <b>BIENVENUE10</b></div>');
await ta.blur();
await page.waitForTimeout(300);
await shot('24-html');

// Export and check custom nodes made it
await page.locator('.bree-btn', { hasText: 'Exporter HTML' }).click();
await page.waitForSelector('.bree-modal pre.bree-code', { timeout: 15000 });
const html = await page.locator('.bree-modal pre.bree-code').textContent();
console.log('export has promo:', html.includes('BIENVENUE10'), '| widths:', (html.match(/width:\s*(25|50)%/g) || []).length, '| spacer 64:', html.includes('height:64px'));
await browser.close();
