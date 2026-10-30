import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { pathToFileURL } from 'url';
import path from 'path';
const FPS=30;
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox','--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('PAGEERR', e.message));
await page.goto(pathToFileURL(path.resolve('index.html')).href);
await page.evaluate(() => window.__ready);
const dur = await page.evaluate(() => window.__dur);
const n = Math.round(dur*FPS);
const ff = spawn('ffmpeg',['-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-r',String(FPS),'-movflags','+faststart','out/silent_4k.mp4'],{stdio:['pipe','inherit','inherit']});
for (let i=0;i<n;i++){
  await page.evaluate(t=>window.__seek(t), i/FPS);
  const buf = await page.screenshot({ type:'jpeg', quality:95 });
  if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r));
  if(i%60===0) console.log('frame',i,'/',n);
}
await page.evaluate(()=>window.__seek(44));
await page.screenshot({path:'out/poster.png'});
ff.stdin.end(); await new Promise(r=>ff.on('close',r));
console.log('DONE'); await browser.close();
