// Render selected frames to PNG for visual QA: node scripts/stills.mjs outDir 30 200 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [outDir, ...frames] = process.argv.slice(2);
const browserExecutable =
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {music: false, musicVolume: 0, voiceover: false};
const composition = await selectComposition({serveUrl, id: 'NusukAd', inputProps, browserExecutable});
for (const fr of frames) {
  await renderStill({
    composition,
    serveUrl,
    frame: Number(fr),
    output: path.join(outDir, `f${String(fr).padStart(4, '0')}.png`),
    inputProps,
    browserExecutable,
    chromiumOptions: {gl: 'swangle'},
    scale: 0.5,
  });
  console.log('frame', fr);
}
