import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
const times = process.argv.slice(2).map(Number);
const exe = process.env.CHROME_BIN || undefined;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox','--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errs=[]; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type()==='error' && errs.push(m.text()));
await page.goto(pathToFileURL(path.resolve('index.html')).href);
await page.evaluate(() => window.__ready);
for (const t of times) {
  await page.evaluate(t => window.__seek(t), t);
  await page.screenshot({ path: `out/shots/t${String(t).replace('.','_')}.png` });
}
console.log('errors:', errs);
await browser.close();
