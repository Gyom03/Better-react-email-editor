// Clicking structural areas selects what the hover frame shows.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = process.env.OUT ?? 'screenshots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(process.env.BASE_URL ?? 'http://localhost:5179', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const panel = () => page.locator('.properties-header h2').textContent().catch(() => 'palette');
const hoverTag = () => page.locator('.ov-hover .ov-tag').textContent().catch(() => 'none');

// Gap between the two product columns (cellspacing 16px)
const cols = page.locator('.tiptap [data-type="two-columns"]').nth(1).locator(':scope > .node-column');
const a = await cols.nth(0).boundingBox();
const b = await cols.nth(1).boundingBox();
const gap = { x: (a.x + a.width + b.x) / 2, y: a.y + 200 };
await page.mouse.move(gap.x, gap.y, { steps: 5 });
await page.waitForTimeout(150);
const hovered = await hoverTag();
await page.mouse.click(gap.x, gap.y);
await page.waitForTimeout(200);
console.log('gap   -> hover:', hovered, '| selected:', await panel());
await page.screenshot({ path: `${OUT}/80-gap-click.png` });

// Hero top padding
const hero = await page.locator('.tiptap .node-section').first().boundingBox();
const pad = { x: hero.x + hero.width / 2, y: hero.y + 12 };
await page.mouse.move(pad.x, pad.y, { steps: 5 });
await page.waitForTimeout(150);
const hovered2 = await hoverTag();
await page.mouse.click(pad.x, pad.y);
await page.waitForTimeout(200);
console.log('pad   -> hover:', hovered2, '| selected:', await panel());

// Text still gets a caret
const title = page.locator('.tiptap h3').first();
await title.click();
await page.waitForTimeout(200);
await page.keyboard.type('!');
console.log('text  -> selected:', await panel(), '| typed:', await title.textContent());
await browser.close();
