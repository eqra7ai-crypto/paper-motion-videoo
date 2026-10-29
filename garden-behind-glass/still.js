// Render stills: node still.js scale t1 t2 ... -> stills/t_<t>.jpg
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const dir = __dirname;
(async () => {
const [scale, ...ts] = process.argv.slice(2).map(Number);
const out = process.env.OUT || path.join(dir, 'stills'); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage();
p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.__RENDERER__ = true; });
await p.goto('file://' + path.join(dir, 'index.html'));
await p.evaluate(s => setup(s), scale);
for (const t of ts) {
  const t0 = Date.now();
  const d = await p.evaluate(t => { renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', 0.9); }, t);
  fs.writeFileSync(path.join(out, `t_${t}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
  console.log(t, Date.now() - t0, 'ms');
}
await b.close();
})();
