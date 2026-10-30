import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';
const b = await chromium.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox','--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const errs=[]; p.on('pageerror', e => errs.push(e.message));
await p.goto(pathToFileURL(path.resolve('index.html')).href);
await p.evaluate(() => window.__ready);
for (const [name, tmode] of [['neutral',0],['happy',1]]) {
  await p.evaluate(([tm]) => {
    document.body.innerHTML = '';
    document.body.style.cssText = 'background:#efe6d2;width:1200px;height:900px;margin:0;position:relative;overflow:hidden';
    const mk = (id, k, left, flip) => {
      const d = document.createElement('div'); d.id = id;
      d.style.cssText = `position:absolute;top:30px;left:${left}px;width:520px;height:780px;transform:${flip ? 'scaleX(-1)' : 'none'}`;
      d.innerHTML = personSVG(k); document.body.appendChild(d);
    };
    mk('sa', 'B', 40, false); mk('sb', 'A', 640, true);
    const t = tm ? window.HAPPY + 2.5 : 6;
    face('#sa', 'B', t + (tm ? 0 : 3.2)); face('#sb', 'A', t);
    const lab = (txt, left) => { const l = document.createElement('div'); l.textContent = txt; l.style.cssText = `position:absolute;top:14px;left:${left}px;width:520px;text-align:center;font:700 34px Alexandria,sans-serif;color:#3a2a1e;direction:rtl`; document.body.appendChild(l); };
    lab('الصديق', 40); lab('الشخص الأول', 640);
  }, [tmode]);
  await p.screenshot({ path: `docs/sheet_${name}.png` });
}
console.log('errors', errs); await b.close();
