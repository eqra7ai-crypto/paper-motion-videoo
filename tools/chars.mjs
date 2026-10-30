import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
const b = await chromium.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox','--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
await p.goto(pathToFileURL(path.resolve('index.html')).href);
await p.evaluate(() => window.__ready);
for (const [n,t] of [['listen',9.8],['happy',36.6]]) {
  await p.evaluate(t => { window.__seek(t); document.querySelectorAll('.bubble,#aphone,.hand').forEach(e=>e.style.visibility='hidden'); }, t);
  await p.screenshot({ path: `docs/char_${n}.png`, clip: { x: 0, y: 690, width: 1080, height: 800 } });
}
await b.close();
