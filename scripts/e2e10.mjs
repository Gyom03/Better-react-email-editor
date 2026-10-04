// Color picker (react-colorful popover) keeps the block selected and applies colors.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = process.env.OUT ?? 'screenshots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(process.env.BASE_URL ?? 'http://localhost:5179/?lang=fr', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const panel = () => page.locator('.bree-properties-header h2').textContent().catch(() => 'palette');
const sectionBg = () => page.evaluate(() => getComputedStyle(document.querySelector('.tiptap .node-section')).backgroundColor);

await page.locator('.bree-layer', { has: page.locator('.bree-layer-label', { hasText: 'Section' }) }).first().click();
await page.waitForTimeout(200);
const trigger = page.locator('.bree-group', { hasText: 'Fond et bordure' }).locator('.bree-color-trigger').first();
await trigger.click();
await page.waitForTimeout(250);
console.log('popover open:', await page.locator('.bree-color-popover').isVisible(), '| panel:', await panel());
await page.screenshot({ path: `${OUT}/a0-color-popover.png` });

// Drag inside the saturation area
const sat = await page.locator('.bree-color-popover .react-colorful__saturation').boundingBox();
await page.mouse.move(sat.x + sat.width * 0.8, sat.y + sat.height * 0.2);
await page.mouse.down();
await page.mouse.move(sat.x + sat.width * 0.9, sat.y + sat.height * 0.3, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(200);
console.log('after drag  -> bg:', await sectionBg(), '| panel:', await panel());

// Click a palette swatch
await page.locator('.bree-color-popover .bree-swatch[title="#10b981"]').click();
await page.waitForTimeout(200);
console.log('after swatch-> bg:', await sectionBg(), '| hex field:', await page.locator('.bree-hex-field input').inputValue());

// Type a hex
const hexInput = page.locator('.bree-hex-field input');
await hexInput.fill('ff6600');
await hexInput.press('Enter');
await page.waitForTimeout(200);
console.log('after hex   -> bg:', await sectionBg());

// Close with Escape, selection still there
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
console.log('closed:', !(await page.locator('.bree-color-popover').isVisible().catch(() => false)), '| panel:', await panel());

// Undo groups the picker changes
await page.locator('button[title^="Annuler"]').click();
await page.waitForTimeout(200);
console.log('after undo  -> bg:', await sectionBg());
await page.screenshot({ path: `${OUT}/a1-color-after.png` });
await browser.close();
