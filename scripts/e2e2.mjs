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

// Text range selection -> Inspector.Text panel
const para = page.locator('.tiptap p', { hasText: 'Découvrez' });
await para.click({ clickCount: 3 });
await page.waitForTimeout(300);
await shot('10-text-selection');
// Bold via panel
await page.locator('.bree-mark[title="Gras"]').click();
await page.waitForTimeout(200);
console.log('bold applied:', await page.locator('.tiptap p strong', { hasText: 'Découvrez' }).count());

// Change paragraph color via swatch (block style)
await page.locator('.bree-group', { hasText: 'Typographie' }).locator('.bree-color-trigger').first().click();
await page.locator('.bree-color-popover .bree-swatch[title="#2563eb"]').click();
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
console.log('para style:', await para.getAttribute('style'));

// Select the hero section via breadcrumb and change background
await page.locator('.bree-crumb button', { hasText: 'Section' }).click();
await page.waitForTimeout(300);
await shot('11-section-selected');
await page.locator('.bree-group', { hasText: 'Fond et bordure' }).locator('.bree-color-trigger').first().click();
await page.locator('.bree-color-popover .bree-swatch[title="#111827"]').click();
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
console.log('section style:', await page.locator('.tiptap .node-section').first().getAttribute('style'));

// Undo (keyboard)
await page.locator('.tiptap').press('Control+z');
await page.waitForTimeout(200);
console.log('section style after undo:', await page.locator('.tiptap .node-section').first().getAttribute('style'));

// Deselect and open Body tab
await page.locator('.bree-sidebar .bree-icon-button[title^="Fermer"]').click();
await page.waitForTimeout(200);
await page.locator('.bree-tabs button', { hasText: 'Corps' }).click();
await page.waitForTimeout(200);
await shot('12-body-tab');
await page.locator('.bree-tabs button', { hasText: 'Blocs' }).click();
await page.waitForTimeout(200);
await shot('13-blocks-tab');

// Mobile canvas
await page.locator('.bree-device-toggle button[title="Mobile"]').click();
await page.waitForTimeout(400);
await shot('14-mobile');
await page.locator('.bree-device-toggle button[title="Bureau"]').click();

// Preview + export
await page.locator('.bree-btn', { hasText: 'Exporter HTML' }).click();
await page.locator('.bree-modal .bree-tabs button', { hasText: 'Bureau' }).click();
await page.waitForSelector('.bree-preview-frame iframe', { timeout: 15000 });
await page.waitForTimeout(1500);
await shot('15-preview-desktop');
await page.locator('.bree-modal .bree-tabs button', { hasText: 'Mobile' }).click();
await page.waitForTimeout(1200);
await shot('16-preview-mobile');
await page.locator('.bree-modal .bree-tabs button', { hasText: 'HTML' }).click();
await page.waitForTimeout(300);
const html = await page.locator('.bree-modal pre.bree-code').textContent();
console.log('html length:', html.length, '| has table role=presentation:', html.includes('role="presentation"'), '| has social img:', html.includes('simpleicons'));
await shot('17-html');
await browser.close();
