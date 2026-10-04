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
await page.goto(`${BASE}?lang=${process.env.DEMO_LANG ?? 'en'}`, { waitUntil: 'networkidle' });
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
let cursor = { x: 1180, y: 640 };
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
  await wait(80);
  log({ type: 'down' });
  await page.mouse.down();
  await moveTo(c.x - 24, c.y + 6, 120);
  log({ type: 'drag', label });
  await moveTo(to.x, to.y, ms);
  // Settle on the target so the drop indicator renders.
  await moveTo(to.x, to.y + 2, 200);
  await wait(250);
  await page.mouse.up();
  log({ type: 'up' });
  log({ type: 'dragend' });
}

/** Smoothly zooms the final video on a viewport point (z = 1 shows everything). */
const camera = (z, x = VIEWPORT.width / 2, y = VIEWPORT.height / 2) => log({ type: 'camera', z, x, y });
const caption = (text) => log({ type: 'caption', text });
void caption;

// ---------------------------------------------------------------------------
// Storyboard: place an image, edit a heading, export the HTML.
// ---------------------------------------------------------------------------

await page.mouse.move(cursor.x, cursor.y);
log({ type: 'move', ...cursor });
await wait(700);

// 1. Place an image above "Our favourites"
camera(1.3, 1000, 470);
await wait(500);
const heading = await center(page.locator('.tiptap h2', { hasText: 'Our favourites' }));
await drag(page.locator('.bree-tile', { hasText: 'Image' }), { x: heading.x, y: heading.box.y - 6 }, 'Image');
await wait(1200);

// 2. Edit the hero heading
const hero = page.locator('.tiptap h1').first();
const heroBox = await center(hero);
camera(1.7, heroBox.x, heroBox.y + 30);
await wait(700);
await click(hero, { count: 3 });
await wait(300);
await page.keyboard.type('The spring sale is on', { delay: 55 });
await wait(1200);

// 3. Export
camera(1, 720, 450);
await wait(600);
await click(page.locator('.bree-topbar .bree-btn.bree-primary'));
await wait(1000);
camera(1.35, 900, 300);
await wait(1100);
await click(page.locator('.bree-modal .bree-btn.bree-primary'));
await wait(900);
camera(1, 720, 450);
await click(page.locator('.bree-modal .bree-icon-button'));
// Fully zoomed out for the last beat (plus HOLD in compose.mjs).
await wait(1500);

// ---------------------------------------------------------------------------

// Marks the end of the video (waits log nothing on their own).
log({ type: 'end' });
await cdp.send('Page.stopScreencast');
await wait(200);
writeFileSync(`${OUT}/timeline.json`, JSON.stringify({ viewport: VIEWPORT, frames, timeline }, null, 1));
console.log(`frames: ${frames.length}, events: ${timeline.length}, duration: ${(timeline.at(-1).t - timeline[0].t).toFixed(1)}s`);
await browser.close();
