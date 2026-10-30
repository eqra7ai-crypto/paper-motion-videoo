// Visual identity for the Nusuk promo: gold, beige, white and a deep "luxury" black.
export const C = {
  ink: '#120F0B',
  ink2: '#1E1A14',
  gold: '#C8A35A',
  goldLight: '#E9D3A1',
  goldDeep: '#9A7533',
  goldGlow: '#FFE7B0',
  beige: '#F4ECDD',
  beige2: '#EADBC2',
  cream: '#FBF7F0',
  white: '#FFFFFF',
  muted: '#8C8172',
  lavender: '#C9BDE6', // soft accent taken from the app's own gradient
  dusk: '#2B2540',
  green: '#3E8E6A',
};

export const GOLD_GRADIENT =
  'linear-gradient(135deg, #8E6A2C 0%, #E9D3A1 38%, #C8A35A 55%, #FFF1CF 72%, #A57E3A 100%)';

export const FONT_HEAD = '"El Messiri", "IBM Plex Sans Arabic", sans-serif';
export const FONT_BODY = '"IBM Plex Sans Arabic", sans-serif';

export const FPS = 30;
export const W = 1080;
export const H = 1920;

// Scene timeline in frames (30 fps). Scenes overlap by TRANSITION frames so
// each one can fade over the previous one.
export const TRANSITION = 14;
export const SCENES = {
  intro: {from: 0, duration: 160},
  app: {from: 150, duration: 220},
  services: {from: 360, duration: 310},
  prizes: {from: 660, duration: 340},
  cta: {from: 990, duration: 270},
};
export const TOTAL = 1260; // 42 s
