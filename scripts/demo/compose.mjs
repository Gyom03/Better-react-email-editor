// Turns a recording (record.mjs) into a Screen Studio-style video: gradient
// backdrop, rounded window with shadow, smooth spring zooms, a smoothed
// cursor with click ripples and drag labels, and captions. Frames are drawn
// on a <canvas> in a headless browser and piped to ffmpeg (H.264, 60 fps).
//
// Usage: node scripts/demo/compose.mjs  →  demo-output/demo.mp4
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = process.env.OUT ?? 'demo-output';
const FPS = Number(process.env.FPS ?? 60);
/** Playback speed: 1.5 plays the recording 1.5× faster (camera springs keep real time). */
const SPEED = Number(process.env.SPEED ?? 1.5);
/** Seconds the last frame is held at the end. */
const HOLD = Number(process.env.HOLD ?? 1);
/** Backdrop: "light" (default) or "dark", both neutral. */
const THEMES = {
  light: { backdrop: ['#f3f4f6', '#e2e5ea', 0.6], shadow: 'rgba(15, 23, 42, 0.16)' },
  dark: { backdrop: ['#2a2e35', '#1b1e23', 0.06], shadow: 'rgba(0, 0, 0, 0.45)' },
};
const { backdrop: BACKDROP, shadow: SHADOW } = THEMES[process.env.BACKDROP ?? 'light'];
const W = 1920;
const H = 1080;
const { viewport, frames, timeline } = JSON.parse(readFileSync(`${OUT}/timeline.json`, 'utf-8'));

// ---------------------------------------------------------------------------
// Scene geometry (output pixels): a window whose content maps 1:1 to the viewport.
// ---------------------------------------------------------------------------

const content = { w: viewport.width, h: viewport.height };
const win = { x: (W - content.w) / 2, y: (H - content.h) / 2, w: content.w, h: content.h };
const contentX = win.x;
const contentY = win.y;
const toScene = (x, y) => ({ x: contentX + x, y: contentY + y });

// ---------------------------------------------------------------------------
// Timeline → per-frame state
// ---------------------------------------------------------------------------

const t0 = Math.min(timeline[0].t, frames[0].t);
const tEnd = timeline.at(-1).t;
const total = Math.ceil(((tEnd - t0) / SPEED + HOLD) * FPS);
// Click ripples last 0.4s of video.
const RIPPLE = 0.4 * SPEED;
const moves = timeline.filter((e) => e.type === 'move');
const downs = timeline.filter((e) => e.type === 'down');

function cursorAt(t) {
  let prev = moves[0];
  for (const m of moves) {
    if (m.t > t) {
      const k = (t - prev.t) / Math.max(1e-6, m.t - prev.t);
      return { x: prev.x + (m.x - prev.x) * k, y: prev.y + (m.y - prev.y) * k };
    }
    prev = m;
  }
  return { x: prev.x, y: prev.y };
}

function lastEvent(t, types) {
  let found = null;
  for (const e of timeline) {
    if (e.t > t) break;
    if (types.includes(e.type)) found = e;
  }
  return found;
}

function frameAt(t) {
  let found = frames[0];
  for (const f of frames) {
    if (f.t > t) break;
    found = f;
  }
  return found.file;
}

// Critically damped spring towards the latest camera target.
const cam = { z: 1, x: W / 2, y: H / 2, vz: 0, vx: 0, vy: 0 };
const omega = 2 * Math.PI * 1.1;
function clampCenter(z, x, y) {
  const hw = W / 2 / z;
  const hh = H / 2 / z;
  return { x: Math.min(Math.max(x, hw), W - hw), y: Math.min(Math.max(y, hh), H - hh) };
}
function stepCamera(t, dt) {
  const target = lastEvent(t, ['camera']) ?? { z: 1, x: viewport.width / 2, y: viewport.height / 2 };
  const scene = toScene(target.x, target.y);
  const goal = { z: target.z, ...clampCenter(target.z, scene.x, scene.y) };
  // Sub-steps keep the integration stable at any output frame rate.
  const steps = Math.ceil(dt * 240);
  for (let i = 0; i < steps; i++) {
    for (const k of ['z', 'x', 'y']) {
      const v = `v${k}`;
      cam[v] += (omega * omega * (goal[k] - cam[k]) - 2 * omega * cam[v]) * (dt / steps);
      cam[k] += cam[v] * (dt / steps);
    }
  }
  const c = clampCenter(cam.z, cam.x, cam.y);
  return { z: cam.z, x: c.x, y: c.y };
}

function captionAt(t) {
  const e = lastEvent(t, ['caption']);
  if (!e || !e.text) {
    // Fade out the previous caption for 0.3s.
    const prev = e ? [...timeline].reverse().find((x) => x.type === 'caption' && x.t < e.t && x.text) : null;
    if (prev && e && t - e.t < 0.3) return { text: prev.text, alpha: 1 - (t - e.t) / 0.3 };
    return null;
  }
  return { text: e.text, alpha: Math.min(1, (t - e.t) / 0.3) };
}

function stateAt(n, dt) {
  const t = Math.min(t0 + (n / FPS) * SPEED, tEnd);
  const pointer = cursorAt(t);
  const lastDown = lastEvent(t, ['down', 'up']);
  const drag = lastEvent(t, ['drag', 'dragend']);
  const ripples = downs
    .filter((d) => t >= d.t && t - d.t < RIPPLE)
    .map((d) => ({ ...toScene(...Object.values(cursorAt(d.t))), age: (t - d.t) / RIPPLE }));
  return {
    frame: frameAt(t),
    camera: stepCamera(t, dt),
    cursor: toScene(pointer.x, pointer.y),
    pressed: lastDown?.type === 'down',
    drag: drag?.type === 'drag' ? drag.label : null,
    ripples,
    caption: captionAt(t),
  };
}

// ---------------------------------------------------------------------------
// Compositor page
// ---------------------------------------------------------------------------

const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000">
<canvas id="c" width="${W}" height="${H}"></canvas>
<script>
const W = ${W}, H = ${H};
const BACKDROP = ${JSON.stringify(BACKDROP)};
const SHADOW = ${JSON.stringify(SHADOW)};
const win = ${JSON.stringify(win)};
const ctx = document.getElementById('c').getContext('2d');
ctx.imageSmoothingQuality = 'high';
const FONT = '"Segoe UI", Inter, system-ui, sans-serif';

// Static layers: backdrop and window chrome.
const backdrop = new OffscreenCanvas(W, H);
{
  const b = backdrop.getContext('2d');
  // Quiet backdrop: a soft vertical gradient with a faint light from the top.
  const g = b.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, BACKDROP[0]);
  g.addColorStop(1, BACKDROP[1]);
  b.fillStyle = g;
  b.fillRect(0, 0, W, H);
  const r = b.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.6);
  r.addColorStop(0, 'rgba(255,255,255,' + BACKDROP[2] + ')');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  b.fillStyle = r;
  b.fillRect(0, 0, W, H);
  // Window: soft shadow and a hairline border, no browser chrome.
  b.save();
  b.shadowColor = SHADOW;
  b.shadowBlur = 60;
  b.shadowOffsetY = 18;
  b.fillStyle = '#ffffff';
  b.beginPath(); b.roundRect(win.x, win.y, win.w, win.h, 14); b.fill();
  b.restore();
  b.strokeStyle = 'rgba(15, 23, 42, 0.10)';
  b.lineWidth = 1;
  b.beginPath(); b.roundRect(win.x - 0.5, win.y - 0.5, win.w + 1, win.h + 1, 14.5); b.stroke();
}

let currentFile = null, currentImage = null;
async function load(file) {
  if (file === currentFile) return currentImage;
  const blob = await (await fetch('http://demo.local/raw/' + file)).blob();
  currentImage = await createImageBitmap(blob);
  currentFile = file;
  return currentImage;
}

function drawCursor(x, y, pressed, z) {
  const s = (pressed ? 0.86 : 1) * 1.35;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 6 * z;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 17.5); ctx.lineTo(4.4, 13.6); ctx.lineTo(7.3, 20.3);
  ctx.lineTo(10.2, 19.1); ctx.lineTo(7.4, 12.6); ctx.lineTo(13, 12.6); ctx.closePath();
  ctx.fillStyle = '#111111'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.4; ctx.strokeStyle = '#ffffff'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

function pill(text, x, y, { bg, color, size, pad, anchor = 'left' }) {
  ctx.font = '600 ' + size + 'px ' + FONT;
  const w = ctx.measureText(text).width + pad * 2;
  const h = size + pad * 1.3;
  const left = anchor === 'center' ? x - w / 2 : x;
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(left, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, left + w / 2, y + h / 2 + 1);
}

window.draw = async (s) => {
  const image = await load(s.frame);
  const { z, x, y } = s.camera;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(z, 0, 0, z, W / 2 - x * z, H / 2 - y * z);
  ctx.drawImage(backdrop, 0, 0);
  ctx.save();
  ctx.beginPath(); ctx.roundRect(win.x, win.y, win.w, win.h, 14); ctx.clip();
  ctx.drawImage(image, win.x, win.y, win.w, win.h);
  ctx.restore();
  for (const r of s.ripples) {
    ctx.beginPath();
    ctx.arc(r.x, r.y, 8 + 26 * r.age, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(37, 99, 235,' + (0.35 * (1 - r.age)) + ')';
    ctx.fill();
  }
  if (s.drag) pill(s.drag, s.cursor.x + 20, s.cursor.y + 22, { bg: 'rgba(37,99,235,0.95)', color: '#fff', size: 14, pad: 12 });
  drawCursor(s.cursor.x, s.cursor.y, s.pressed, z);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (s.caption) {
    ctx.globalAlpha = s.caption.alpha;
    pill(s.caption.text, W / 2, H - 92, { bg: 'rgba(17, 24, 39, 0.88)', color: '#fff', size: 26, pad: 26, anchor: 'center' });
    ctx.globalAlpha = 1;
  }
  return document.getElementById('c').toDataURL('image/jpeg', 0.93);
};
</script></body></html>`;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => console.log('[compositor]', e.message));
await page.route('http://demo.local/raw/**', (route) =>
  route.fulfill({ path: resolve(OUT, 'raw', route.request().url().split('/').pop()), contentType: 'image/jpeg' }),
);
await page.route('http://demo.local/', (route) => route.fulfill({ body: html, contentType: 'text/html; charset=utf-8' }));
await page.goto('http://demo.local/');

const output = resolve(OUT, 'demo.mp4');
const ffmpeg = spawn(
  'ffmpeg',
  ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);
const done = new Promise((ok, fail) => ffmpeg.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited with ${code}`)))));

const started = Date.now();
for (let n = 0; n < total; n++) {
  const state = stateAt(n, 1 / FPS);
  const dataUrl = await page.evaluate((s) => window.draw(s), state);
  const buffer = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  if (!ffmpeg.stdin.write(buffer)) await new Promise((ok) => ffmpeg.stdin.once('drain', ok));
  if (n % 300 === 0) console.log(`frame ${n}/${total} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
}
ffmpeg.stdin.end();
await done;
await browser.close();
console.log(`wrote ${output} — ${(total / FPS).toFixed(1)}s at ${FPS} fps (x${SPEED})`);
