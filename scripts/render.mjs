#!/usr/bin/env node
/*
 * Frame-accurate renderer: drives index.html?render in headless Chromium,
 * captures every frame at 1920x1080 and pipes the PNGs into ffmpeg.
 *
 *   node scripts/render.mjs                    full film -> out/pips-little-paper-world.mp4
 *   node scripts/render.mjs --stills 0,8.6,19.6  PNG stills -> out/stills/
 *   node scripts/render.mjs --from 12 --to 16 --out out/clip.mp4
 *   options: --workers 3  --no-audio  --crf 16
 */
import { execSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const TL = require(resolve(ROOT, 'src/timeline.js'));

function loadPlaywright() {
  try { return require('playwright'); } catch {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return require(resolve(globalRoot, 'playwright'));
}

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i < 0 ? def : args[i + 1]; };
const flag = (name) => args.includes('--' + name);

const FPS = TL.FPS;
const stills = opt('stills');
const from = Number(opt('from', 0));
const to = Number(opt('to', TL.DURATION));
const workers = Number(opt('workers', 3));
const out = resolve(ROOT, opt('out', 'out/pips-little-paper-world.mp4'));
const crf = opt('crf', '16');
const audio = resolve(ROOT, 'out/soundtrack.wav');

const { chromium } = loadPlaywright();
const browser = await chromium.launch(); // honours PLAYWRIGHT_BROWSERS_PATH
const url = pathToFileURL(resolve(ROOT, 'index.html')).href + '?render';

async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { console.error('page error:', e.stack || e.message); process.exit(1); });
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true);
  return page;
}

async function shoot(page, t) {
  await page.evaluate((tt) => window.renderFrame(tt), t);
  return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });
}

if (stills) {
  const dir = resolve(ROOT, 'out/stills');
  mkdirSync(dir, { recursive: true });
  const page = await newPage();
  for (const s of stills.split(',').map(Number)) {
    const file = resolve(dir, 't' + s.toFixed(2).padStart(5, '0') + '.png');
    writeFileSync(file, await shoot(page, s));
    console.log('still', file);
  }
  await browser.close();
  process.exit(0);
}

const first = Math.round(from * FPS), last = Math.round(to * FPS); // [first, last)
const total = last - first;
mkdirSync(dirname(out), { recursive: true });
const withAudio = !flag('no-audio') && existsSync(audio);
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
  ...(withAudio ? ['-ss', String(from), '-t', String(total / FPS), '-i', audio] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-tune', 'animation',
  '-r', String(FPS), '-movflags', '+faststart',
  ...(withAudio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
  out,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))));

// Workers render frames in parallel; frames are written to ffmpeg strictly in order.
const pages = await Promise.all(Array.from({ length: workers }, newPage));
const ready = new Map();
let next = first, written = first;
const started = Date.now();
async function flush() {
  while (ready.has(written)) {
    const buf = ready.get(written);
    ready.delete(written);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    written++;
    if ((written - first) % 30 === 0 || written === last) {
      const el = (Date.now() - started) / 1000, done = written - first;
      process.stdout.write(`\rframe ${done}/${total}  ${(done / el).toFixed(1)} fps  eta ${Math.round((total - done) / (done / el))}s   `);
    }
  }
}
let flushing = Promise.resolve();
await Promise.all(pages.map(async (page) => {
  while (next < last) {
    while (ready.size > workers * 4) await new Promise((r) => setTimeout(r, 5));
    const i = next++;
    ready.set(i, await shoot(page, i / FPS));
    flushing = flushing.then(flush);
  }
}));
await flushing;
ff.stdin.end();
await ffDone;
await browser.close();
console.log(`\nwrote ${out} (${total} frames, ${(total / FPS).toFixed(2)} s${withAudio ? ', with audio' : ''})`);
