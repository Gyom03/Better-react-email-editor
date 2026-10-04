// Copy / cut / paste with the real keyboard shortcuts.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const OUT = process.env.OUT ?? 'screenshots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('[console]', m.text().slice(0, 200)));
await page.goto(process.env.BASE_URL ?? 'http://localhost:5179', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const layer = (label, preview) => page.locator('.layer', { has: page.locator('.layer-label', { hasText: label }), ...(preview ? { hasText: preview } : {}) }).first();
const pick = async (label, preview) => { await layer(label, preview).click(); await page.waitForTimeout(150); };
const top = () => page.evaluate(() => [...document.querySelector('.tiptap .node-container').children].map((k) => (k.getAttribute('data-type') || k.tagName.toLowerCase()) + ':' + (k.textContent || '').trim().slice(0, 14)));
const count = (sel) => page.locator(sel).count();
const key = (k) => page.keyboard.press(k).then(() => page.waitForTimeout(200));

// A. text inside a paragraph
const para = page.locator('.tiptap p', { hasText: 'Découvrez' });
await para.click({ clickCount: 3 });
await key('Control+c');
const h3 = page.locator('.tiptap h3').first();
await h3.click();
await page.keyboard.press('End');
await key('Control+v');
console.log('A text  ->', JSON.stringify(await h3.textContent()), '| paragraphs w/ Découvrez:', await count('.tiptap p:has-text("Découvrez")'));
await key('Control+z');

// B. a whole section (NodeSelection) pasted while another block is selected
const sectionsBefore = await count('.tiptap .node-section');
const before = await top();
await pick('Section');
await key('Control+c');
await pick('Séparateur');
await key('Control+v');
console.log('B section -> sections', sectionsBefore, '→', await count('.tiptap .node-section'), '| hr still there:', await count('.tiptap hr'));
console.log('  top before:', before.join(' | '));
console.log('  top after :', (await top()).join(' | '));

// C. button keeps href / alignment / style
await pick('Bouton', 'Découvrir');
await key('Control+c');
await pick('Espacement');
await key('Control+v');
const btns = await page.locator('.tiptap a.node-button', { hasText: 'Découvrir' }).evaluateAll((els) => els.map((e) => `${e.getAttribute('data-href')} | ${e.parentElement.className} | ${e.getAttribute('style')}`));
console.log('C button ->', btns);

// D. custom nodes: social links + spacer + columns row
for (const [label, sel] of [['Réseaux sociaux', '.tiptap .node-socialLinks'], ['Espacement', '.tiptap .node-spacer'], ['Ligne · 2 colonnes', '.tiptap .node-columns']]) {
  const n0 = await count(sel);
  await pick(label);
  await key('Control+c');
  await key('Control+v');
  console.log('D', label, '->', n0, '→', await count(sel));
}

// E. cut + paste elsewhere
const hrs0 = await count('.tiptap hr');
await pick('Séparateur');
await key('Control+x');
const hrsCut = await count('.tiptap hr');
await pick('Titre', 'Nos coups');
await key('Control+v');
console.log('E cut ->', hrs0, '→', hrsCut, '→', await count('.tiptap hr'), '| heading kept:', await count('.tiptap h2:has-text("Nos coups")'));
console.log('stray empty paragraphs:', (await page.locator('.layer-preview').allTextContents()).filter((t) => t === 'vide').length);

await page.screenshot({ path: `${OUT}/90-paste.png` });
await browser.close();
