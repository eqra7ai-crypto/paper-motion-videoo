import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const FPS = 30, DUR = 45, N = FPS * DUR;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errs = [];
pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('file:///home/user/paper-motion-videoo/index.html');
await pg.evaluate('window.__ready');
const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', 'out/silent.mp4'], { stdio: ['pipe', 'ignore', 'inherit'] });
for (let i = 0; i < N; i++) {
  await pg.evaluate(`window.__seek(${(i / FPS).toFixed(4)})`);
  if (i === 1350 - 1) await pg.screenshot({ path: 'out/poster.png' });
  const buf = await pg.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 150 === 0) console.log('frame', i);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
console.log('done errors:', JSON.stringify(errs));
await b.close();
