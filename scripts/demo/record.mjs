// Records the demo: drives the playground with a scripted mouse and captures
// every repaint through the CDP screencast (2x resolution). Writes the raw
// frames and a timeline (mouse, clicks, drags, camera, captions) that
// compose.mjs turns into a polished video.
//
// Usage: npx vite --port 5179 & node scripts/demo/record.mjs
import { chromium } from 'playwright-core';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5179/';
const OUT = process.env.OUT ?? 'demo-output';
const RAW = `${OUT}/raw`;
const VIEWPORT = { width: 1440, height: 900 };

rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
const page = await context.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`${BASE}?lang=en`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
// No spellcheck squiggles in the video.
await page.evaluate(() => document.querySelector('.tiptap')?.setAttribute('spellcheck', 'false'));

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

const frames = [];
const timeline = [];
const now = () => Date.now() / 1000;
const log = (event) => timeline.push({ t: now(), ...event });

const cdp = await context.newCDPSession(page);
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const file = `f${String(frames.length).padStart(5, '0')}.jpg`;
  writeFileSync(`${RAW}/${file}`, Buffer.from(data, 'base64'));
  frames.push({ file, t: metadata.timestamp ?? now() });
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 2880, maxHeight: 1800, everyNthFrame: 1 });

// ---------------------------------------------------------------------------
// Directing helpers
// ---------------------------------------------------------------------------

const wait = (ms) => page.waitForTimeout(ms);
let cursor = { x: 1160, y: 760 };
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

async function moveTo(x, y, ms = 650) {
  const from = { ...cursor };
  const steps = Math.max(10, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const k = ease(i / steps);
    const p = { x: from.x + (x - from.x) * k, y: from.y + (y - from.y) * k };
    await page.mouse.move(p.x, p.y);
    log({ type: 'move', x: p.x, y: p.y });
    await wait(ms / steps);
  }
  cursor = { x, y };
}

async function center(locator) {
  await locator.waitFor({ state: 'visible' });
  const b = await locator.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, box: b };
}

async function click(locator, { ms = 650, count = 1 } = {}) {
  const c = await center(locator);
  await moveTo(c.x, c.y, ms);
  await wait(120);
  for (let i = 0; i < count; i++) {
    log({ type: 'down' });
    await page.mouse.down({ clickCount: i + 1 });
    await wait(70);
    await page.mouse.up({ clickCount: i + 1 });
    log({ type: 'up' });
    if (i < count - 1) await wait(60);
  }
  return c;
}

/** Native HTML5 drag from a locator to a point, with a label chip drawn next to the cursor. */
async function drag(locator, to, label, ms = 1100) {
  const c = await center(locator);
  await moveTo(c.x, c.y);
  await wait(150);
  log({ type: 'down' });
  await page.mouse.down();
  await moveTo(c.x - 24, c.y + 6, 160);
  log({ type: 'drag', label });
  await moveTo(to.x, to.y, ms);
  // Settle on the target so the drop indicator renders.
  await moveTo(to.x, to.y + 2, 260);
  await wait(450);
  await page.mouse.up();
  log({ type: 'up' });
  log({ type: 'dragend' });
  await wait(500);
}

/** Smoothly zooms the final video on a viewport point (z = 1 shows everything). */
const camera = (z, x = VIEWPORT.width / 2, y = VIEWPORT.height / 2) => log({ type: 'camera', z, x, y });
const caption = (text) => log({ type: 'caption', text });

// ---------------------------------------------------------------------------
// Storyboard
// ---------------------------------------------------------------------------

await page.mouse.move(cursor.x, cursor.y);
log({ type: 'move', ...cursor });
caption('better-react-email-editor');
await wait(2200);

// 1. Drag a block from the palette
caption('Drag blocks from the palette');
camera(1.35, 1010, 470);
await wait(700);
const heading = await center(page.locator('.tiptap h2', { hasText: 'Our favourites' }));
await drag(page.locator('.bree-tile', { hasText: 'Button' }), { x: heading.x, y: heading.box.y + heading.box.height + 3 }, 'Button');
await wait(900);

// 2. Style it from the properties panel
caption('Style anything from the properties panel');
await click(page.locator('.tiptap p', { hasText: 'Discover our selection' }));
await wait(300);
await page.keyboard.press('Escape');
log({ type: 'key', key: 'Esc' });
await wait(700);
camera(1.55, 1180, 300);
await wait(900);
await click(page.locator('.bree-sidebar .bree-color-trigger').first());
await wait(700);
await click(page.locator('.bree-color-popover .bree-swatch[title="#fef3c7"]'));
await wait(800);
await click(page.locator('.bree-color-popover .bree-swatch[title="#ecfdf5"]'), { ms: 400 });
await wait(900);
await page.keyboard.press('Escape');
await wait(600);

// 3. Edit text inline
caption('Edit text right in the canvas');
const hero = page.locator('.tiptap h1', { hasText: 'What’s new' });
const heroBox = await center(hero);
camera(1.7, heroBox.x, heroBox.y + 40);
await wait(800);
await click(hero, { count: 3 });
await wait(300);
await page.keyboard.type('Spring collection is here', { delay: 55 });
await wait(900);

// 4. Rearrange with the layers panel
caption('Rearrange blocks with the layers panel');
camera(1.45, 330, 330);
await wait(800);
const layerSpacer = page.locator('.bree-layer', { hasText: 'Spacer' }).first();
const rowLayer = page.locator('.bree-layer').filter({ hasText: 'Row · 2 columns' }).nth(1);
await click(rowLayer);
await wait(700);
const spacerBox = await center(layerSpacer);
await drag(rowLayer, { x: spacerBox.x, y: spacerBox.box.y + spacerBox.box.height - 3 }, 'Row · 2 columns', 900);
await wait(900);

// 5. Prebuilt rows
caption('Prebuilt rows, ready to drop');
camera(1, 720, 450);
await click(page.locator('.bree-properties .bree-icon-button').first(), { ms: 500 }).catch(() => {});
await wait(400);
await click(page.locator('.bree-tabs button', { hasText: 'Blocks' }));
await wait(700);
await page.locator('.bree-canvas').hover();
await moveTo(700, 600, 500);
await page.mouse.wheel(0, 420);
await wait(800);
const divider = await center(page.locator('.tiptap hr').last());
camera(1.25, 960, 520);
await drag(page.locator('.bree-block-card', { hasText: 'Testimonial' }), { x: divider.x, y: divider.box.y - 6 }, 'Testimonial');
await wait(1200);

// 6. Desktop & mobile
caption('Check the mobile layout');
camera(1, 720, 450);
await click(page.locator('.bree-device-toggle button[title="Mobile"]'));
await wait(1800);
await click(page.locator('.bree-device-toggle button[title="Desktop"]'));
await wait(900);

// 7. Preview & export
caption('Export production-ready HTML');
await click(page.locator('.bree-btn', { hasText: 'Preview' }));
await wait(1600);
await click(page.locator('.bree-modal .bree-tabs button', { hasText: 'Mobile' }));
await wait(1500);
await click(page.locator('.bree-modal .bree-tabs button', { hasText: 'HTML' }));
camera(1.3, 720, 380);
await wait(1800);
camera(1, 720, 450);
await click(page.locator('.bree-modal .bree-icon-button'));
await wait(600);
// Click the empty canvas around the email: back to the palette.
await moveTo(330, 860, 600);
log({ type: 'down' });
await page.mouse.down();
await page.mouse.up();
log({ type: 'up' });
await wait(600);

// 8. Languages
caption('English & French built in');
const select = page.locator('.locale-select');
await click(select);
await page.selectOption('.locale-select', 'fr');
await wait(700);
// Focusing the top bar restores the editor selection: click the canvas background to show the palette.
await moveTo(330, 860, 700);
log({ type: 'down' });
await page.mouse.down();
await page.mouse.up();
log({ type: 'up' });
await wait(500);
await moveTo(1020, 260, 700);
await wait(2600);
caption('');
await wait(600);

// ---------------------------------------------------------------------------

await cdp.send('Page.stopScreencast');
await wait(200);
writeFileSync(`${OUT}/timeline.json`, JSON.stringify({ viewport: VIEWPORT, frames, timeline }, null, 1));
console.log(`frames: ${frames.length}, events: ${timeline.length}, duration: ${(timeline.at(-1).t - timeline[0].t).toFixed(1)}s`);
await browser.close();
