// Render the full film: node render.js <scale> <out.mp4> [workers] [crf | bitrate like 14M]
// Frames are rendered in parallel Chromium pages, encoded per segment, then joined with the audio track.
const { chromium } = require('playwright'); const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const [scale = '0.5', out = 'preview.mp4', workers = '4', crf = '20'] = process.argv.slice(2);
const FPS = 24, DUR = 49, N = FPS * DUR, W = Number(workers);
const tmp = path.join(path.dirname(path.resolve(out)), '.seg_' + path.basename(out)); fs.mkdirSync(tmp, { recursive: true });
async function worker(i, browser) {
  const a = Math.floor(N * i / W), b = Math.floor(N * (i + 1) / W), seg = path.join(tmp, `s${i}.mp4`);
  const open = async () => {
    const p = await browser.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await p.addInitScript(() => { window.__RENDERER__ = true; });
    await p.goto('file://' + path.join(__dirname, 'index.html')); await p.evaluate(s => setup(s), Number(scale)); return p;
  };
  let page = await open();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', ...(crf.endsWith('M') ? ['-b:v', crf, '-maxrate', Math.round(parseFloat(crf) * 1.3) + 'M', '-bufsize', Math.round(parseFloat(crf) * 2.6) + 'M'] : ['-crf', crf]), '-pix_fmt', 'yuv420p', '-profile:v', 'high', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  for (let f = a; f < b; f++) {
    let d;
    for (let tries = 0; !d; tries++) { // the scene is deterministic, so a crashed page can simply be reopened
      try { d = await page.evaluate(t => { renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', 0.96); }, f / FPS); }
      catch (e) { if (tries > 3) throw e; console.log(`worker ${i}: page crashed at frame ${f}, reopening`); await page.close().catch(() => {}); page = await open(); }
    }
    if (!ff.stdin.write(Buffer.from(d.slice(d.indexOf(',') + 1), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 48 === 0) console.log(`worker ${i}: frame ${f}/${b - 1}`);
  }
  ff.stdin.end(); await done; return seg;
}
(async () => {
  const t0 = Date.now(), browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
  const segs = await Promise.all([...Array(W).keys()].map(i => worker(i, browser)));
  await browser.close();
  fs.writeFileSync(path.join(tmp, 'list.txt'), segs.map(s => `file '${s}'`).join('\n'));
  const audio = path.join(__dirname, 'audio.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  fs.rmSync(tmp, { recursive: true });
  console.log(`done ${out} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})();
