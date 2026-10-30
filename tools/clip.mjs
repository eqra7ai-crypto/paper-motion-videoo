import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { pathToFileURL } from 'url';
import path from 'path';
const [t0, t1, dsf, out] = [Number(process.argv[2]), Number(process.argv[3]), Number(process.argv[4]), process.argv[5]];
const FPS = 30;
const b = await chromium.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox','--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: dsf });
p.on('pageerror', e => console.error('PAGEERR', e.message));
await p.goto(pathToFileURL(path.resolve('index.html')).href);
await p.evaluate(() => window.__ready);
const ff = spawn('ffmpeg', ['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-ss',String(t0),'-t',String(t1-t0),'-i','out/voiceover.wav','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',out], { stdio: ['pipe','inherit','inherit'] });
for (let t = t0; t < t1; t += 1 / FPS) {
  await p.evaluate(t => window.__seek(t), t);
  const buf = await p.screenshot({ type: 'jpeg', quality: 90 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('clip done');
