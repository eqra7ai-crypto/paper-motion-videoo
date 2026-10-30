import {Config} from '@remotion/cli/config';

// Uses the pre-installed headless Chromium; change this path on another machine
// (or delete the line to let Remotion download its own browser).
Config.setBrowserExecutable(
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
);
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
