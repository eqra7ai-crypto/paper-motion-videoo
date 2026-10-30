import {continueRender, delayRender} from 'remotion';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import '@fontsource/el-messiri/500.css';
import '@fontsource/el-messiri/700.css';

// Hold the first frame until every Arabic font face is loaded, so no frame
// is rendered with a fallback font.
const handle = delayRender('Loading Arabic fonts');
const faces = [
  '400 32px "IBM Plex Sans Arabic"',
  '600 32px "IBM Plex Sans Arabic"',
  '700 32px "IBM Plex Sans Arabic"',
  '700 32px "El Messiri"',
  '500 32px "El Messiri"',
];
Promise.all(faces.map((f) => document.fonts.load(f, 'نسك Nusuk 0123')))
  .then(() => document.fonts.ready)
  .finally(() => continueRender(handle));
