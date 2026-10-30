import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
for (const dsf of [1, 2]) {
  const b = await chromium.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: dsf });
  await p.goto(pathToFileURL(path.resolve('index.html')).href);
  await p.evaluate(() => window.__ready);
  for (const t0 of [3, 25]) {
    const s = Date.now();
    for (let i = 0; i < 4; i++) {
      await p.evaluate(t => window.__seek(t), t0 + i / 30);
      await p.screenshot({ type: 'jpeg', quality: 95 });
    }
    console.log('dsf', dsf, 't', t0, ((Date.now() - s) / 4 / 1000).toFixed(2), 's/frame');
  }
  await b.close();
}
