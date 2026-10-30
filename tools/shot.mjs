import { chromium } from 'playwright';
const [out, ...ts] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = [];
pg.on('pageerror', e => errs.push(String(e)));
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto('file:///home/user/paper-motion-videoo/index.html');
await pg.evaluate('window.__ready');
for (const t of ts) {
  await pg.evaluate(`window.__seek(${t})`);
  await pg.screenshot({ path: `${out}/f_${String(Number(t).toFixed(1)).padStart(5, '0')}.png` });
}
console.log('errors:', JSON.stringify(errs));
await b.close();
