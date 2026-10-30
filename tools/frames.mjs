import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
const [shard, shards] = [Number(process.argv[2]), Number(process.argv[3])];
const FPS = 30;
fs.mkdirSync('out/frames', { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox', '--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.error('PAGEERR', e.message));
await p.goto(pathToFileURL(path.resolve('index.html')).href);
await p.evaluate(() => window.__ready);
const n = Math.round((await p.evaluate(() => window.__dur)) * FPS);
for (let i = shard; i < n; i += shards) {
  await p.evaluate(t => window.__seek(t), i / FPS);
  await p.screenshot({ path: `out/frames/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 });
  if (i % 90 === shard) console.log('shard', shard, 'frame', i, '/', n);
}
console.log('SHARD DONE', shard);
await b.close();
