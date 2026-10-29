'use strict';
// The Garden Behind the Glass — deterministic 2.5D scene. renderFrame(t) draws time t (seconds).
// World units are meters: x right, y up, z depth (away from camera). Design space is 1080x1920.
const DW = 1080, DH = 1920, DUR = 49, FPS = 24;
const T = { // master timeline (mirrored in audio.py)
  camBack: 4, camIn: 15.5, glow: 19.5, dis0: 20.6, dis1: 23.6, pend0: 22.6, pend1: 24.2,
  hb0: 24.2, hbP: 0.9375, hbEnd: 41.5, wave: 25.4, look0: 24.4, look1: 26.2,
  reach0: 31.0, grab: 32.6, lift1: 34.9, kiss0: 35.0, kiss1: 36.5, glowRed: 35.9,
  pocket0: 37.8, pocketIn: 39.0, pocket1: 39.4, stand0: 40.6, stand1: 41.7, turn1: 42.2,
  walk0: 42.2, walk1: 45.4,
};
const PEND = [0.06, 0.772, 11.0]; // pendant rest position on the table
const WAVE_V = 2.1;               // m/s, speed of the blooming wave

let S = 1, cv, ctx, mainCtx, C = { x: 0, y: 1.3, z: 0, F: 1400, cy: DH / 2 };
let L1, L1c, L2, L2c, BG, BGc, SM, SMc, GRAIN, SPR = {};
let TT = 0;

// ---------- utilities ----------
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = (a, b, x) => { const t = seg(x, a, b); return t * t * (3 - 2 * t); };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const sine = t => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
const backOut = t => { t = clamp(t); const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const H = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Interior grading: desaturated, dim and cool until the bloom wave revives each surface.
function revive(p) { return p ? ss(0, 1.4, TT - T.wave - dist3(p, PEND) / WAVE_V) : 0; }
function ic(c, f = 0, a = 1) {
  const sat = lerp(0.22, 1.0, f), bri = lerp(0.56, 1.0, f);
  const l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  let r = lerp(l, c[0], sat) * bri, g = lerp(l, c[1], sat) * bri, b = lerp(l, c[2], sat) * bri;
  b = b * lerp(1.06, 1, f); r = r * lerp(0.97, 1.02, f);
  return rgba([r, g, b], a);
}

// ---------- camera & projection ----------
function camera(t) {
  if (t < T.camBack) { // low among the flowers, gently pull back and rise
    const u = sine(t / T.camBack);
    C.z = lerp(1.25, -0.6, u); C.y = lerp(0.42, 1.32, u); C.F = 1500; C.x = lerp(0.18, 0.05, u);
  } else if (t < T.camIn) { // glide toward the cafe, through the open doorway, settle inside
    const u = ease(seg(t, T.camBack, T.camIn));
    C.z = lerp(-0.6, 7.75, u); C.y = lerp(1.32, 1.24, sine(seg(t, 6, T.camIn)));
    C.x = 0.05 * (1 - u) * Math.cos(u * 3);
    C.F = lerp(1500, 1150, sine(seg(t, 10.5, T.camIn)));
  } else { C.z = 7.75; C.y = 1.24; C.x = 0; C.F = 1150; } // locked off
  C.cy = DH / 2;
}
const NEAR = 0.06;
function P(x, y, z) { const d = z - C.z, k = C.F / d; return { x: DW / 2 + (x - C.x) * k, y: C.cy - (y - C.y) * k, k, d }; }
function poly3(pts) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], da = a[2] - C.z, db = b[2] - C.z;
    if (da >= NEAR) out.push(a);
    if ((da >= NEAR) !== (db >= NEAR)) { const t = (NEAR - da) / (db - da); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]); }
  }
  if (out.length < 3) return false;
  ctx.beginPath();
  for (let i = 0; i < out.length; i++) { const q = P(out[i][0], out[i][1], out[i][2]); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }
  ctx.closePath(); return true;
}
function fillPoly(pts, style) { if (poly3(pts)) { ctx.fillStyle = style; ctx.fill(); } }
function quad(x0, y0, z0, x1, y1, z1, axis) { // axis-aligned rectangle
  if (axis === 'z') return [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]];
  if (axis === 'y') return [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]];
  return [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]];
}
function box(x0, x1, y0, y1, z0, z1, top, front, side) { // draws camera-facing faces of a convex box
  if (z0 - C.z < NEAR && z1 - C.z < NEAR) return;
  if (C.x < x0) fillPoly([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], side);
  else if (C.x > x1) fillPoly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], side);
  if (C.y > y1) fillPoly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], top);
  else if (C.y < y0) fillPoly([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], top);
  fillPoly([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], front);
}
function sprite(name, x, y, r, alpha = 1) { if (r < 0.05) return; ctx.globalAlpha = alpha; ctx.drawImage(SPR[name], x - r, y - r, 2 * r, 2 * r); ctx.globalAlpha = 1; }

// ---------- path helpers ----------
function smooth(pts, closed = true) {
  const n = pts.length; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const q0 = closed || i > 0 ? p0 : p1, q3 = closed || i < n - 2 ? p3 : p2;
    ctx.bezierCurveTo(p1[0] + (p2[0] - q0[0]) / 6, p1[1] + (p2[1] - q0[1]) / 6, p2[0] - (q3[0] - p1[0]) / 6, p2[1] - (q3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}
function cap(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1e-6, a = Math.atan2(dy, dx), off = Math.acos(clamp((r1 - r2) / d, -1, 1));
  ctx.beginPath(); ctx.arc(x1, y1, r1, a + off, a + 2 * Math.PI - off); ctx.arc(x2, y2, r2, a - off, a + off); ctx.closePath();
}
function heartPath(cx, cy, s) { // heart pointing down in screen space, s = half width
  ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.95);
  ctx.bezierCurveTo(cx - s * 1.15, cy + s * 0.15, cx - s * 1.05, cy - s * 0.95, cx, cy - s * 0.42);
  ctx.bezierCurveTo(cx + s * 1.05, cy - s * 0.95, cx + s * 1.15, cy + s * 0.15, cx, cy + s * 0.95); ctx.closePath();
}

// ---------- prebuilt content ----------
let FRONT = [], BACKG = [], INT = [], BFLY = [], PETALS = [], MOTES = [], SPARKS = [], FURN = [];
const PAL = {
  rose: H('#e8506f'), pink: H('#f39bb5'), white: H('#f7f2e8'), yellow: H('#f5c542'), orange: H('#f08a3c'),
  red: H('#d62f3a'), lav: H('#9b7fd6'), blue: H('#6f9be8'), magenta: H('#c94fa8'), peach: H('#f6b48f'), cream: H('#f4e3c3'),
};
const FLOWER_KINDS = [['daisy', 'white'], ['poppy', 'red'], ['cosmos', 'pink'], ['rose', 'rose'], ['lav', 'lav'], ['tulip', 'orange'], ['cosmos', 'magenta'], ['daisy', 'yellow'], ['rose', 'peach'], ['bell', 'blue'], ['rose', 'cream']];

function buildWorld() {
  const r = rng(7);
  const pick = a => a[Math.floor(r() * a.length)];
  // front garden: flower beds left/right of the stone path
  for (let i = 0; i < 520; i++) {
    const side = r() < .5 ? -1 : 1, x = side * (0.7 + Math.pow(r(), 1.3) * 3.2), z = -1.5 + r() * 7.1;
    const [kind, col] = pick(FLOWER_KINDS);
    FRONT.push({ t: 'flower', x, z, h: 0.25 + r() * 0.55 + (Math.abs(x) > 1.6 ? 0.2 : 0), s: 0.035 + r() * 0.03, kind, col: PAL[col], ph: r() * 6.28, tint: 0.85 + r() * 0.3 });
  }
  for (let i = 0; i < 26; i++) { const side = i % 2 ? -1 : 1; FRONT.push({ t: 'bush', x: side * (1.9 + r() * 2.2), z: -1 + r() * 6.5, s: 0.45 + r() * 0.5, ph: r() * 6 }); }
  // the three flowers right in front of the lens at the start (soft foreground)
  FRONT.push({ t: 'flower', x: 0.42, z: 1.62, h: 0.36, s: 0.05, kind: 'rose', col: PAL.rose, ph: 1, tint: 1 });
  FRONT.push({ t: 'flower', x: -0.3, z: 1.8, h: 0.32, s: 0.045, kind: 'daisy', col: PAL.white, ph: 2, tint: 1 });
  FRONT.push({ t: 'flower', x: 0.62, z: 2.1, h: 0.52, s: 0.05, kind: 'cosmos', col: PAL.pink, ph: 3, tint: 1 });
  // back garden beyond the glass wall
  for (let i = 0; i < 560; i++) {
    const z = 14.25 + Math.pow(r(), 1.6) * 9, x = (r() * 2 - 1) * (4 + (z - 14) * 0.7);
    const [kind, col] = pick(FLOWER_KINDS);
    BACKG.push({ t: 'flower', x, z, h: 0.3 + r() * 0.75 + (z < 15.2 ? r() * 0.5 : 0), s: 0.04 + r() * 0.035, kind, col: PAL[col], ph: r() * 6.28, tint: 0.85 + r() * 0.3 });
  }
  for (let i = 0; i < 34; i++) { const z = 15 + r() * 8; BACKG.push({ t: 'bush', x: (r() * 2 - 1) * (3 + (z - 14) * 0.8), z, s: 0.5 + r() * 0.7, ph: r() * 6 }); }
  // butterflies (outside: always; inside: released by the wave)
  const bcol = [['#3d8bff', '#0d2a6b'], ['#ff9a2e', '#5a2a08'], ['#ffe066', '#7a5a10'], ['#ffffff', '#9a9a9a'], ['#ff6fa8', '#6a1840'], ['#b48cff', '#3a2470']];
  for (let i = 0; i < 16; i++) {
    const outsideFront = i < 7;
    BFLY.push({ home: outsideFront ? [(r() * 2 - 1) * 1.6, 0.6 + r() * 1.1, 1.2 + r() * 4] : [(r() * 2 - 1) * 3, 0.5 + r() * 1.6, 14.6 + r() * 5], amp: [0.4 + r() * 0.5, 0.15 + r() * 0.2, 0.3 + r() * 0.4], w: [0.25 + r() * 0.3, 0.4 + r() * 0.4, 0.2 + r() * 0.25], ph: [r() * 6, r() * 6, r() * 6], col: bcol[i % bcol.length].map(H), s: 0.045 + r() * 0.02, flap: 7 + r() * 4, t0: -1 });
  }
  for (let i = 0; i < 20; i++) {
    BFLY.push({ home: [(r() * 2 - 1) * 1.7, 0.7 + r() * 1.5, 9.6 + r() * 4.1], amp: [0.3 + r() * 0.4, 0.12 + r() * 0.18, 0.25 + r() * 0.35], w: [0.2 + r() * 0.25, 0.35 + r() * 0.35, 0.15 + r() * 0.2], ph: [r() * 6, r() * 6, r() * 6], col: bcol[i % bcol.length].map(H), s: 0.04 + r() * 0.02, flap: 6 + r() * 4, t0: T.wave + 0.1 + i * 0.11 + r() * 0.4, inside: true });
  }
  // furniture: square table for the couple, round tables, chairs
  FURN.push({ t: 'sqtable', x: 0, z: 11.0, id: 'main' });
  FURN.push({ t: 'chair', x: -0.84, z: 11.06, dir: 1, id: 'chairR' });
  FURN.push({ t: 'chair', x: 0.82, z: 11.06, dir: -1, id: 'chairS' });
  FURN.push({ t: 'rtable', x: -1.62, z: 12.9 }); FURN.push({ t: 'chair', x: -2.1, z: 12.95, dir: 1 }); FURN.push({ t: 'chair', x: -1.55, z: 13.45, dir: 2 });
  FURN.push({ t: 'rtable', x: 1.7, z: 12.7 }); FURN.push({ t: 'chair', x: 1.22, z: 12.6, dir: 1, tilt: 1 }); FURN.push({ t: 'chair', x: 2.2, z: 12.85, dir: -1 });
  FURN.push({ t: 'rtable', x: 1.45, z: 9.9 });
  FURN.push({ t: 'rtable', x: -2.05, z: 11.7 }); FURN.push({ t: 'chair', x: -1.75, z: 11.2, dir: 2 });
  // growth items inside the cafe (appear after the wave reaches them)
  const g = rng(11);
  const addFlower = (x, y, z, s, extra = {}) => { const [kind, col] = FLOWER_KINDS[Math.floor(g() * FLOWER_KINDS.length)]; INT.push(Object.assign({ t: 'gflower', x, y, z, h: 0.12 + g() * 0.32, s, kind, col: PAL[col], ph: g() * 6, tint: 0.9 + g() * 0.2, jit: g() }, extra)); };
  for (let i = 0; i < 230; i++) { // floor: flowers and grass, sparser on the walking path
    const x = (g() * 2 - 1) * 2.5, z = 8.2 + g() * 5.7;
    if (Math.abs(x - PEND[0]) < 0.42 && Math.abs(z - 11) < 0.4) continue;
    if (x < -0.55 && x > -2.6 && z > 10.0 && z < 11.3 && g() < 0.7) continue;
    if (g() < 0.45) INT.push({ t: 'grass', x, y: 0, z, h: 0.06 + g() * 0.12, ph: g() * 6, jit: g() });
    else addFlower(x, 0, z, 0.03 + g() * 0.025);
  }
  for (let i = 0; i < 90; i++) { const x = (g() * 2 - 1) * 2.5, z = 8.4 + g() * 5.5; INT.push({ t: 'moss', x, y: 0.001, z, s: 0.12 + g() * 0.25, jit: g() }); }
  // vines climbing glass mullions and along the low wall, flowers along the sill
  for (const mx of [-2.6, -1.3, 0, 1.3, 2.6]) INT.push({ t: 'vine', pts: [[mx + 0.02, 0, 13.94], [mx - 0.03, 0.8, 13.94], [mx + 0.04, 1.6, 13.94], [mx - 0.02, 2.5, 13.94], [mx + 0.03, 3.05, 13.94]], z: 13.94, w: 0.012, jit: g() });
  for (let i = 0; i < 40; i++) { const x = (g() * 2 - 1) * 2.55; addFlower(x, 0.4, 13.9, 0.03 + g() * 0.02, { h: 0.05 + g() * 0.18 }); }
  for (let i = 0; i < 26; i++) { const x = (g() * 2 - 1) * 2.55; INT.push({ t: 'hang', x, y: 3.02, z: 13.92, len: 0.25 + g() * 0.55, col: g() < .5 ? PAL.lav : PAL.pink, jit: g() }); }
  for (let i = 0; i < 34; i++) { const bz = 8.5 + Math.floor(g() * 6) + 0.5; const x = (g() * 2 - 1) * 2.4; if (Math.abs(x) < 0.9 && bz > 9.9 && bz < 12.1 && g() < 0.6) continue; INT.push({ t: 'hang', x, y: 3.18, z: bz, len: 0.35 + g() * 0.6, col: g() < .6 ? PAL.lav : PAL.white, jit: g() }); }
  for (const sx of [-2.6, 2.6]) for (let i = 0; i < 26; i++) { const z = 9 + g() * 5, y = g() * 2.9; addFlower(sx * 0.995, y, z, 0.03 + g() * 0.02, { h: 0.02, wall: sx }); }
  for (const sx of [-2.6, 2.6]) for (let k = 0; k < 4; k++) { const z0 = 10 + k * 1.1 + g() * 0.5; INT.push({ t: 'vine', pts: [[sx, 0, z0], [sx, 0.9, z0 + 0.3], [sx, 1.8, z0 - 0.2], [sx, 2.8, z0 + 0.25]], z: z0, w: 0.012, jit: g() }); }
  // petals and sparks for the transformation and the wave
  const p = rng(23);
  for (let i = 0; i < 420; i++) SPARKS.push({ u: p(), v: p(), w: p(), tb: 0, dur: 1.2 + p() * 1.1, size: 1.2 + p() * 2.8, petal: p() < 0.22, sw: (p() * 2 - 1), ph: p() * 6 });
  for (let i = 0; i < 150; i++) { const a = p() * 6.283, el = p() * 1.1; PETALS.push({ dir: [Math.cos(a), Math.sin(el) * 0.6 + 0.15, Math.sin(a) * 0.8], spd: 1.2 + p() * 2.2, col: [PAL.pink, PAL.rose, PAL.white, PAL.peach, PAL.lav][i % 5], ph: p() * 6, t0: T.wave + p() * 0.5, s: 0.012 + p() * 0.01 });
  }
  for (let i = 0; i < 90; i++) MOTES.push({ x: (p() * 2 - 1) * 2.2, y: 0.3 + p() * 2.6, z: 8.6 + p() * 5, ph: p() * 6, sp: 0.02 + p() * 0.04 });
}

function buildSprites() {
  const glow = (inner, outer, n = 128) => { const c = mk(n, n), g = c.getContext('2d'); const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); gr.addColorStop(0, inner); gr.addColorStop(0.25, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n); return c; };
  SPR.gold = glow('rgba(255,250,225,1)', 'rgba(255,205,120,0.45)');
  SPR.warm = glow('rgba(255,236,200,0.9)', 'rgba(255,214,160,0.25)');
  SPR.red = glow('rgba(255,170,170,1)', 'rgba(255,40,60,0.5)');
  SPR.soft = glow('rgba(255,255,255,0.6)', 'rgba(255,255,255,0.12)');
  SPR.shadow = glow('rgba(0,0,0,0.55)', 'rgba(0,0,0,0.3)');
  // film grain tile
  const n = 256; GRAIN = mk(n, n); const g = GRAIN.getContext('2d'); const id = g.createImageData(n, n); const r = rng(99);
  for (let i = 0; i < n * n; i++) { const v = 128 + (r() + r() + r() - 1.5) * 90; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  g.putImageData(id, 0, 0);
}

// Distant sky + tree line, prerendered once (depth z=45) and blurred.
const BGP = { z: 45, x0: -20, x1: 20, y0: -1, y1: 26, ppm: 40 };
const MIDP = { z: 25, x0: -22, x1: 22, y0: -0.5, y1: 11, ppm: 46 };
let MID;
function buildBackdrop() {
  const r = rng(5);
  const make = (P0, draw, blur) => {
    const w = Math.round((P0.x1 - P0.x0) * P0.ppm * S), h = Math.round((P0.y1 - P0.y0) * P0.ppm * S);
    const c = mk(w, h), g = c.getContext('2d'); const X = x => (x - P0.x0) * P0.ppm * S, Y = y => (P0.y1 - y) * P0.ppm * S, U = P0.ppm * S;
    draw(g, X, Y, U);
    if (blur) { const c2 = mk(w, h), g2 = c2.getContext('2d'); g2.filter = `blur(${blur * S}px)`; g2.drawImage(c, 0, 0); return c2; }
    return c;
  };
  BG = make(BGP, (g, X, Y, U) => {
    const sky = g.createLinearGradient(0, Y(26), 0, Y(0));
    sky.addColorStop(0, '#7fb2e5'); sky.addColorStop(0.55, '#bcd9ee'); sky.addColorStop(0.85, '#fbe9cf'); sky.addColorStop(1, '#ffe2b0');
    g.fillStyle = sky; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    const sun = g.createRadialGradient(X(4), Y(8), 0, X(4), Y(8), 14 * U);
    sun.addColorStop(0, 'rgba(255,246,220,0.95)'); sun.addColorStop(0.2, 'rgba(255,230,180,0.5)'); sun.addColorStop(1, 'rgba(255,220,170,0)');
    g.fillStyle = sun; g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.12})`; g.beginPath(); g.ellipse(X(-18 + r() * 36), Y(14 + r() * 10), (2 + r() * 4) * U, (0.5 + r() * 0.8) * U, 0, 0, 7); g.fill(); }
    const layers = [['#9cb8a8', 5.5, 2.2], ['#7fa58c', 3.8, 1.6], ['#5f8f6c', 2.4, 1.2]];
    for (const [col, top, rad] of layers) { g.fillStyle = col; for (let x = -21; x < 21; x += rad * 0.6) { const yy = top + (r() - 0.5) * 1.6; g.beginPath(); g.arc(X(x), Y(yy), rad * (0.7 + r() * 0.6) * U, 0, 7); g.fill(); } g.fillRect(0, Y(top - 0.3), g.canvas.width, g.canvas.height); }
    g.fillStyle = '#8bb269'; g.fillRect(0, Y(0.6), g.canvas.width, g.canvas.height);
  }, 3);
  MID = make(MIDP, (g, X, Y, U) => {
    for (let i = 0; i < 16; i++) { // trees
      const tx = -21 + i * 2.8 + r() * 1.5, th = 4.5 + r() * 4.5, tr = 1.6 + r() * 1.4;
      g.fillStyle = '#4a3a2c'; g.fillRect(X(tx - 0.12), Y(th - tr * 0.6), 0.24 * U, (th - tr * 0.6) * U);
      for (let k = 0; k < 26; k++) { const a = r() * 6.28, rr = r() * tr; const cx = tx + Math.cos(a) * rr, cy = th + Math.sin(a) * rr * 0.75; const lit = clamp(0.5 + (cx - tx) * 0.1 + (cy - th) * 0.25 + (r() - .5) * 0.3); g.fillStyle = rgba(mixc(H('#2f6b3a'), H('#a7cf6a'), lit)); g.beginPath(); g.arc(X(cx), Y(cy), (0.5 + r() * 0.7) * U, 0, 7); g.fill(); }
      if (r() < 0.45) for (let k = 0; k < 30; k++) { const a = r() * 6.28, rr = r() * tr; g.fillStyle = r() < .5 ? '#f7c6d6' : '#ffffff'; g.beginPath(); g.arc(X(tx + Math.cos(a) * rr), Y(th + Math.sin(a) * rr * 0.7), 0.09 * U, 0, 7); g.fill(); }
    }
    for (let x = -22; x < 22; x += 0.35) { const hh = 1.2 + r() * 0.6; g.fillStyle = rgba(mixc(H('#2e5e34'), H('#6fa04c'), r())); g.beginPath(); g.arc(X(x), Y(hh), (0.45 + r() * 0.3) * U, 0, 7); g.fill(); }
    g.fillStyle = '#3f6e3a'; g.fillRect(0, Y(1.1), g.canvas.width, g.canvas.height);
    for (let i = 0; i < 400; i++) { g.fillStyle = rgba(PAL[FLOWER_KINDS[i % FLOWER_KINDS.length][1]], 0.9); g.beginPath(); g.arc(X(-22 + r() * 44), Y(0.2 + r() * 1.5), 0.07 * U, 0, 7); g.fill(); }
  }, 1.2);
}
function drawPlaneImg(img, P0) {
  const a = P(P0.x0, P0.y1, P0.z), b = P(P0.x1, P0.y0, P0.z);
  ctx.drawImage(img, a.x, a.y, b.x - a.x, b.y - a.y);
}

// ---------- garden elements ----------
function flowerHead(kind, col, x, y, r, open, tint, rot) {
  if (r < 0.4) { ctx.fillStyle = rgba(col); ctx.fillRect(x - r, y - r, 2 * r, 2 * r); return; }
  const c = col.map(v => v * tint), dark = c.map(v => v * 0.62), lite = c.map(v => Math.min(255, v * 1.15 + 25));
  r *= lerp(0.35, 1, open);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, 0.78);
  if (kind === 'daisy' || kind === 'cosmos') {
    const n = kind === 'daisy' ? 12 : 8, pl = kind === 'daisy' ? 0.95 : 1.0, pw = kind === 'daisy' ? 0.2 : 0.38;
    for (let i = 0; i < n; i++) { const a = i / n * 6.283; ctx.fillStyle = rgba(i % 2 ? c : lite); ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * pl * 0.5, Math.sin(a) * r * pl * 0.5, r * pl * 0.5, r * pw, a, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = kind === 'daisy' ? '#e8a91e' : '#f2cf4a'; ctx.beginPath(); ctx.arc(0, 0, r * 0.24, 0, 6.283); ctx.fill();
  } else if (kind === 'poppy' || kind === 'tulip') {
    const n = kind === 'poppy' ? 5 : 3;
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + 0.3; ctx.fillStyle = rgba(i % 2 ? c : dark); ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42 - (kind === 'tulip' ? r * 0.2 : 0), r * 0.55, r * (kind === 'tulip' ? 0.7 : 0.48), a, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = rgba(lite, 0.7); ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 0.25, r * 0.25, r * 0.12, -0.5, 0, 6.283); ctx.fill();
    if (kind === 'poppy') { ctx.fillStyle = '#2a1414'; ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, 6.283); ctx.fill(); }
  } else if (kind === 'rose') {
    ctx.fillStyle = rgba(dark); ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, 6.283); ctx.fill();
    for (let k = 0; k < 4; k++) { const rr = r * (0.85 - k * 0.2); ctx.fillStyle = rgba(mixc(dark, lite, k / 3)); for (let i = 0; i < 5; i++) { const a = i * 1.257 + k * 0.6; ctx.beginPath(); ctx.ellipse(Math.cos(a) * rr * 0.35, Math.sin(a) * rr * 0.35, rr * 0.6, rr * 0.42, a, 0, 6.283); ctx.fill(); } }
  } else if (kind === 'lav' || kind === 'bell') {
    ctx.restore(); ctx.save(); ctx.translate(x, y);
    const m = kind === 'lav' ? 7 : 4;
    for (let i = 0; i < m; i++) { const yy = -i * r * 0.42, rr = r * (kind === 'lav' ? 0.26 : 0.36) * (1 - i / (m * 1.6)); ctx.fillStyle = rgba(i % 2 ? c : lite); ctx.beginPath(); ctx.ellipse((i % 2 ? 1 : -1) * rr * 0.4, yy, rr, rr * 0.8, 0, 0, 6.283); ctx.fill(); }
  }
  ctx.restore();
}
function drawFlower(f, grow = 1, gradeF = null) {
  const sway = Math.sin(TT * 1.3 + f.ph) * 0.012 + Math.sin(TT * 0.7 + f.ph * 2) * 0.008;
  const y0 = f.y || 0, hh = f.h * clamp(grow * 1.5);
  const b = P(f.x, y0, f.z); if (b.d < NEAR + 0.05) return;
  const top = P(f.x + sway * hh * 3, y0 + hh, f.z);
  const k = b.k; if (k * f.s < 0.25) return;
  if (b.x < -150 || b.x > DW + 150 || top.y > DH + 100 || b.y < -150) return;
  const stemCol = gradeF === null ? 'rgb(64,112,52)' : ic(H('#40703a'), gradeF);
  ctx.strokeStyle = stemCol; ctx.lineWidth = Math.max(0.5, 0.007 * k); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.quadraticCurveTo(b.x + (top.x - b.x) * 0.2, (b.y + top.y) / 2, top.x, top.y); ctx.stroke();
  if (hh > 0.12 && k * 0.03 > 1.2) { ctx.fillStyle = gradeF === null ? 'rgb(78,132,60)' : ic(H('#4e843c'), gradeF); ctx.beginPath(); ctx.ellipse(lerp(b.x, top.x, 0.45) + 0.012 * k, lerp(b.y, top.y, 0.45), 0.028 * k, 0.009 * k, -0.6, 0, 6.283); ctx.fill(); }
  const open = gradeF === null ? 1 : backOut(seg(grow, 0.45, 1));
  if (grow > 0.45) {
    const col = gradeF === null ? f.col : mixc([170, 170, 170], f.col, 0.5 + 0.5 * gradeF);
    flowerHead(f.kind, col, top.x, top.y, f.s * k, open, f.tint, sway * 4);
  }
}
function drawBush(b) {
  const p = P(b.x, b.s * 0.55, b.z); if (p.d < NEAR + 0.3) return;
  const R = b.s * p.k, r = rng(Math.floor(b.ph * 1000));
  for (let i = 0; i < 9; i++) {
    const a = r() * 6.28, rr = r() * 0.6;
    const lit = clamp(0.45 + Math.sin(a) * -0.3 + (r() - .5) * 0.3);
    ctx.fillStyle = rgba(mixc(H('#24502a'), H('#86b858'), lit));
    ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * rr * R + Math.sin(TT + b.ph) * 0.01 * R, p.y + Math.sin(a) * rr * R * 0.6, R * (0.45 + r() * 0.3), 0, 6.283); ctx.fill();
  }
  for (let i = 0; i < 6; i++) { ctx.fillStyle = rgba(PAL[['pink', 'white', 'yellow', 'rose'][i % 4]]); ctx.beginPath(); ctx.arc(p.x + (r() - .5) * 1.2 * R, p.y + (r() - .6) * 0.8 * R, R * 0.07, 0, 6.283); ctx.fill(); }
}
function drawButterfly(b) {
  let t = TT, x, y, z, a = 1;
  const w = (i) => b.home[i] + b.amp[i] * Math.sin(t * b.w[i] * 2 + b.ph[i]) + b.amp[i] * 0.4 * Math.sin(t * b.w[i] * 5.3 + b.ph[i] * 2);
  x = w(0); y = w(1); z = w(2);
  if (b.inside) {
    if (TT < b.t0) return;
    const u = ease(seg(TT, b.t0, b.t0 + 2.4)); x = lerp(PEND[0], x, u); y = lerp(PEND[1] + 0.05, y, u); z = lerp(PEND[2], z, u);
    a = seg(TT, b.t0, b.t0 + 0.3);
  }
  const p = P(x, y, z); if (p.d < 0.5) return;
  const s = b.s * p.k; if (s < 0.6) return;
  const flap = Math.sin(TT * b.flap * 6.283 * 0.5 + b.ph[0]), open = 0.25 + 0.75 * Math.abs(flap);
  const vx = Math.cos(t * b.w[0] * 2 + b.ph[0]);
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(vx * 0.35); ctx.globalAlpha = a;
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side * open, 1);
    const g = ctx.createLinearGradient(0, 0, s * 1.1, 0); g.addColorStop(0, rgba(b.col[1])); g.addColorStop(0.35, rgba(b.col[0])); g.addColorStop(1, rgba(b.col[0].map(v => v * 0.8)));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.05); ctx.bezierCurveTo(s * 0.5, -s * 1.0, s * 1.25, -s * 0.85, s * 1.0, -s * 0.15); ctx.lineTo(0, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s * 0.9, s * 0.05, s * 0.85, s * 0.8, s * 0.3, s * 0.7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(s * 0.8, -s * 0.45, s * 0.08, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#1a120c'; ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.07, s * 0.42, 0, 0, 6.283); ctx.fill();
  ctx.globalAlpha = 1; ctx.restore();
}

// ---------- architecture ----------
const CAFE = { x0: -2.6, x1: 2.6, zf: 6, zb: 14, h: 3.3 };
function drawInteriorShell() {
  const { x0, x1, zf, zb, h } = CAFE;
  // ceiling: dark wood boards and beams
  fillPoly([[x0, h, zf], [x1, h, zf], [x1, h, zb], [x0, h, zb]], ic(H('#3b3029'), revive([0, h, 11]) * 0.6));
  for (let z = zf + 0.5; z < zb; z += 1) box(x0, x1, h - 0.16, h, z - 0.08, z + 0.08, ic(H('#2a221c')), ic(H('#4a3c31'), revive([0, h, z]) * 0.6), ic(H('#3a2f27')));
  // side walls: faded plaster over wainscot
  for (const sx of [x0, x1]) {
    for (let z = zf; z < zb; z += 0.5) {
      const f = revive([sx, 1.5, z + 0.25]);
      fillPoly(quad(sx, 0.95, z, sx, h, z + 0.5, 'x'), ic(H('#9b8f76'), f * 0.7));
      fillPoly(quad(sx, 0, z, sx, 0.95, z + 0.5, 'x'), ic(H('#5d4a38'), f * 0.7));
    }
  }
  // floor: worn checker tiles
  const ts = 0.4;
  for (let z = zf; z < zb - 1e-6; z += ts) for (let x = x0; x < x1 - 1e-6; x += ts) {
    const odd = (Math.round((x - x0) / ts) + Math.round((z - zf) / ts)) % 2;
    const f = revive([x + ts / 2, 0, z + ts / 2]);
    const n = (Math.sin(x * 12.9 + z * 78.2) * 43758.5) % 1;
    fillPoly(quad(x, 0, z, x + ts, 0, z + ts, 'y'), ic(odd ? H('#8d8a78') : H('#c9bea2'), f * 0.75, 1).replace(/,1\)$/, `,${0.92 + n * 0.08})`));
  }
  // back low wall under the sill and the header above the glass
  fillPoly(quad(x0, 0, zb, x1, 0.4, zb, 'z'), ic(H('#6a5a48'), revive([0, 0.2, zb]) * 0.7));
  fillPoly(quad(x0, 3.0, zb, x1, h, zb, 'z'), ic(H('#7b6d58'), revive([0, 3.1, zb]) * 0.7));
  box(x0, x1, 0.38, 0.43, zb - 0.12, zb, ic(H('#7a6650'), revive([0, 0.4, zb])), ic(H('#5a4a3a')), ic(H('#5a4a3a')));
}
function drawGlassWall(z, door, fromOutside) {
  const { x0, x1 } = CAFE, gy0 = door ? 0.35 : 0.4, gy1 = 3.0;
  const panes = door ? [[x0, -0.62], [0.62, x1]] : [[x0, x1]];
  for (const [a, b] of panes) {
    fillPoly(quad(a, gy0, z, b, gy1, z, 'z'), fromOutside ? 'rgba(40,52,58,0.38)' : 'rgba(225,238,240,0.05)');
    const p0 = P(a, gy1, z), p1 = P(b, gy0, z);
    if (p0.d > NEAR) {
      ctx.save(); poly3(quad(a, gy0, z, b, gy1, z, 'z')); ctx.clip();
      const sh = (C.z * 0.35 + C.x) * 0.6;
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      const A = fromOutside ? 0.22 : 0.06;
      g.addColorStop(0, `rgba(210,230,255,${A})`); g.addColorStop(clamp(0.3 + sh * 0.1, 0.01, 0.9), `rgba(255,255,255,${A * 0.2})`);
      g.addColorStop(clamp(0.42 + sh * 0.1, 0.02, 0.95), `rgba(255,255,255,${A * 1.2})`); g.addColorStop(clamp(0.5 + sh * 0.1, 0.03, 0.99), `rgba(255,255,255,${A * 0.1})`); g.addColorStop(1, `rgba(200,220,200,${A * 0.5})`);
      ctx.fillStyle = g; ctx.fillRect(Math.min(p0.x, p1.x), p0.y, Math.abs(p1.x - p0.x), p1.y - p0.y);
      ctx.globalCompositeOperation = 'source-over';
      const gr = ctx.createLinearGradient(0, p1.y, 0, p0.y); gr.addColorStop(0, 'rgba(70,60,45,0.22)'); gr.addColorStop(0.25, 'rgba(70,60,45,0)');
      ctx.fillStyle = gr; ctx.fillRect(Math.min(p0.x, p1.x), p0.y, Math.abs(p1.x - p0.x), p1.y - p0.y);
      ctx.restore();
    }
  }
  const fc = fromOutside ? 'rgb(46,64,58)' : ic(H('#2e3d38'), revive([0, 1.5, z]) * 0.8), fl = fromOutside ? 'rgb(70,92,84)' : ic(H('#465a52'), revive([0, 1.5, z]) * 0.8);
  const mul = door ? [x0, -1.6, -0.62, 0.62, 1.6, x1] : [x0, -1.3, 0, 1.3, x1];
  for (const mx of mul) box(mx - 0.04, mx + 0.04, door && Math.abs(mx) < 0.7 ? 0 : gy0, gy1 + 0.02, z - 0.06, z, fl, fc, fl);
  box(x0, x1, gy1, gy1 + 0.06, z - 0.06, z, fl, fc, fl);
  box(x0, x1, 1.9, 1.94, z - 0.04, z, fl, fc, fl);
}
function drawFacadeOutside() {
  const z = CAFE.zf;
  // plaster facade above, base wall below the glass, side piers
  const pl = 'rgb(176,160,136)';
  fillPoly(quad(-3.2, 3.0, z, 3.2, 6.5, z, 'z'), pl);
  fillPoly(quad(-3.2, 0, z, -0.62, 0.35, z, 'z'), 'rgb(120,104,88)'); fillPoly(quad(0.62, 0, z, 3.2, 0.35, z, 'z'), 'rgb(120,104,88)');
  fillPoly(quad(-3.2, 0, z, CAFE.x0, 3.0, z, 'z'), pl); fillPoly(quad(CAFE.x1, 0, z, 3.2, 3.0, z, 'z'), pl);
  const st = rng(3);
  for (let i = 0; i < 14; i++) { const x = -3 + st() * 6, y = 3.2 + st() * 3; const p = P(x, y, z); if (p.d > NEAR) { const r = (0.2 + st() * 0.5) * p.k; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, 'rgba(90,80,60,0.18)'); g.addColorStop(1, 'rgba(90,80,60,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - r, p.y - r, 2 * r, 2 * r); } }
  // faded striped awning
  for (let i = 0; i < 14; i++) {
    const xa = -2.8 + i * 0.4, xb = xa + 0.4;
    fillPoly([[xa, 3.55, z], [xb, 3.55, z], [xb, 3.15, z - 0.75], [xa, 3.15, z - 0.75]], i % 2 ? 'rgb(150,166,150)' : 'rgb(222,212,190)');
  }
  for (let i = 0; i < 14; i++) { const xa = -2.8 + i * 0.4; fillPoly([[xa, 3.15, z - 0.75], [xa + 0.4, 3.15, z - 0.75], [xa + 0.3, 2.98, z - 0.75], [xa + 0.1, 2.98, z - 0.75]], i % 2 ? 'rgb(128,144,128)' : 'rgb(200,190,170)'); }
  // climbing roses around the door
  const rr = rng(17);
  for (let i = 0; i < 46; i++) {
    const side = i % 2 ? -1 : 1, y = rr() * 3.1, x = side * (0.68 + rr() * 0.12 + (y > 2.6 ? -rr() * 0.6 : 0));
    const p = P(x, y, z - 0.07); if (p.d < NEAR + 0.05) continue;
    ctx.fillStyle = rgba(mixc(H('#2f5e30'), H('#79a84e'), rr())); ctx.beginPath(); ctx.ellipse(p.x, p.y, 0.05 * p.k, 0.025 * p.k, rr() * 3, 0, 6.283); ctx.fill();
    if (i % 3 === 0) flowerHead('rose', rr() < .5 ? PAL.rose : PAL.pink, p.x, p.y, 0.04 * p.k, 1, 1, 0);
  }
}
function drawDoorLeaf() { // glass door swung inward on its hinge at x=+0.62
  const a = 1.72, hx = 0.62, z = CAFE.zf, ex = hx + 1.24 * Math.cos(Math.PI - a) * -1, ez = z + 1.24 * Math.sin(a);
  const fc = ic(H('#2e3d38'), revive([0.7, 1, 6.6]));
  fillPoly([[hx, 0.02, z], [ex, 0.02, ez], [ex, 2.48, ez], [hx, 2.48, z]], 'rgba(200,220,225,0.08)');
  for (const [y0, y1] of [[0.02, 0.14], [2.38, 2.48], [1.1, 1.16]]) fillPoly([[hx, y0, z], [ex, y0, ez], [ex, y1, ez], [hx, y1, z]], fc);
  fillPoly([[ex, 0.02, ez], [ex, 2.48, ez], [ex, 2.48, ez + 0.06], [ex, 0.02, ez + 0.06]], fc);
}

// ---------- furniture ----------
function chair(o) {
  const f = revive([o.x, 0.4, o.z]);
  const wood = ic(H('#6b5240'), f), woodL = ic(H('#8a6c54'), f), woodD = ic(H('#4b392c'), f);
  const dir = o.dir, sx = o.id === 'chairR' ? CH.rChairShift : 0;
  const X = o.x + sx, Z = o.z, s = 0.21;
  const parts = [];
  const leg = (lx, lz) => parts.push([lx - 0.018, lx + 0.018, 0, 0.45, lz - 0.018, lz + 0.018]);
  leg(X - s + 0.02, Z - s + 0.02); leg(X + s - 0.02, Z - s + 0.02); leg(X - s + 0.02, Z + s - 0.02); leg(X + s - 0.02, Z + s - 0.02);
  parts.push([X - s, X + s, 0.45, 0.48, Z - s, Z + s, 'seat']);
  // back rest on the side opposite to the facing direction
  if (dir === 1 || dir === -1) { const bx = X - dir * (s - 0.02); parts.push([bx - 0.02, bx + 0.02, 0.48, 0.95, Z - s + 0.02, Z - s + 0.05]); parts.push([bx - 0.02, bx + 0.02, 0.48, 0.95, Z + s - 0.05, Z + s - 0.02]); parts.push([bx - 0.02, bx + 0.02, 0.8, 0.92, Z - s + 0.02, Z + s - 0.02]); parts.push([bx - 0.02, bx + 0.02, 0.62, 0.67, Z - s + 0.02, Z + s - 0.02]); }
  else { const bz = Z + s - 0.03; parts.push([X - s + 0.02, X + s - 0.02, 0.8, 0.92, bz - 0.02, bz + 0.02]); parts.push([X - s + 0.02, X - s + 0.05, 0.48, 0.95, bz - 0.02, bz + 0.02]); parts.push([X + s - 0.05, X + s - 0.02, 0.48, 0.95, bz - 0.02, bz + 0.02]); parts.push([X - s + 0.02, X + s - 0.02, 0.62, 0.67, bz - 0.02, bz + 0.02]); }
  parts.sort((a, b) => Math.hypot((b[0] + b[1]) / 2 - C.x, (b[4] + b[5]) / 2 - C.z) - Math.hypot((a[0] + a[1]) / 2 - C.x, (a[4] + a[5]) / 2 - C.z));
  if (o.tilt) { ctx.save(); const p = P(X, 0, Z); ctx.translate(p.x, p.y); ctx.rotate(0.05); ctx.translate(-p.x, -p.y); }
  for (const q of parts) box(q[0], q[1], q[2], q[3], q[4], q[5], q[6] ? woodL : woodL, wood, woodD);
  if (o.tilt) ctx.restore();
}
function rtable(o) {
  const f = revive([o.x, 0.7, o.z]), X = o.x, Z = o.z, R = 0.36;
  const p0 = P(X, 0.005, Z); ctx.save(); ctx.translate(p0.x, p0.y); ctx.scale(1, 0.18); sprite('shadow', 0, 0, 0.5 * p0.k, 0.5); ctx.restore();
  box(X - 0.22, X + 0.22, 0, 0.03, Z - 0.03, Z + 0.03, ic(H('#3a3430'), f), ic(H('#2a2522'), f), ic(H('#2a2522'), f));
  box(X - 0.03, X + 0.03, 0, 0.03, Z - 0.22, Z + 0.22, ic(H('#3a3430'), f), ic(H('#2a2522'), f), ic(H('#2a2522'), f));
  box(X - 0.025, X + 0.025, 0.03, 0.72, Z - 0.025, Z + 0.025, ic(H('#3a3430'), f), ic(H('#2e2925'), f), ic(H('#24201d'), f));
  const pts = [], band = []; for (let i = 0; i < 32; i++) { const a = i / 32 * 6.283; pts.push([X + Math.cos(a) * R, 0.75, Z + Math.sin(a) * R]); }
  for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; band.push([X + Math.cos(a) * R, 0.75, Z + Math.sin(a) * R]); }
  for (let i = 16; i >= 0; i--) { const a = Math.PI + i / 16 * Math.PI; band.push([X + Math.cos(a) * R, 0.72, Z + Math.sin(a) * R]); }
  fillPoly(band, ic(H('#6a6258'), f)); fillPoly(pts, ic(H('#b8ad98'), f));
}
function sqTable(o, part) {
  const f = revive([0, 0.7, 11]), X = o.x, Z = o.z, s = 0.36;
  const w = ic(H('#6e5644'), f), wl = ic(H('#9a7d63'), f), wd = ic(H('#4a392d'), f);
  if (part === 'far') { for (const lx of [X - s + 0.04, X + s - 0.04]) box(lx - 0.022, lx + 0.022, 0, 0.72, Z + s - 0.064, Z + s - 0.02, wl, w, wd); return; }
  for (const lx of [X - s + 0.04, X + s - 0.04]) box(lx - 0.022, lx + 0.022, 0, 0.72, Z - s + 0.02, Z - s + 0.064, wl, w, wd);
  box(X - s, X + s, 0.68, 0.72, Z - s, Z + s, wl, w, wd);
  box(X - s - 0.02, X + s + 0.02, 0.72, 0.76, Z - s - 0.02, Z + s + 0.02, wl, w, wd);
  // soft garden light falling on the table top
  const a = P(X - s, 0.76, Z + s), b = P(X + s, 0.76, Z - s);
  if (a.d > NEAR) { ctx.save(); poly3([[X - s, 0.76, Z - s], [X + s, 0.76, Z - s], [X + s, 0.76, Z + s], [X - s, 0.76, Z + s]]); ctx.clip(); const g = ctx.createLinearGradient(0, a.y, 0, b.y); g.addColorStop(0, `rgba(255,236,200,${0.25 + 0.15 * f})`); g.addColorStop(1, 'rgba(255,236,200,0)'); ctx.fillStyle = g; ctx.fillRect(a.x - 50, a.y, b.x - a.x + 100, b.y - a.y); ctx.restore(); }
}

// ---------- characters ----------
const CH = { rChairShift: 0 };
function ik(sx, sy, tx, ty, l1, l2, bend) {
  const dx = tx - sx, dy = ty - sy; let d = Math.hypot(dx, dy); const a = Math.atan2(dy, dx); d = Math.min(d, l1 + l2 - 1e-4);
  const b = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), e = [sx + l1 * Math.cos(a + bend * b), sy + l1 * Math.sin(a + bend * b)];
  const ang = Math.atan2(ty - e[1], tx - e[0]); return [e, [e[0] + l2 * Math.cos(ang), e[1] + l2 * Math.sin(ang)]];
}
const up = a => [Math.sin(a), Math.cos(a)];
const HEAD = {
  S: [[0.0, 0.125], [0.058, 0.108], [0.086, 0.064], [0.093, 0.032], [0.09, 0.014], [0.111, -0.021], [0.097, -0.034], [0.1, -0.048], [0.094, -0.058], [0.097, -0.068], [0.087, -0.082], [0.088, -0.098], [0.058, -0.113], [0.018, -0.098], [-0.04, -0.07], [-0.094, -0.02], [-0.1, 0.045], [-0.068, 0.104]],
  R: [[0.0, 0.13], [0.062, 0.112], [0.09, 0.066], [0.098, 0.034], [0.093, 0.016], [0.121, -0.026], [0.101, -0.04], [0.104, -0.052], [0.097, -0.062], [0.101, -0.073], [0.092, -0.088], [0.096, -0.108], [0.058, -0.124], [0.016, -0.106], [-0.04, -0.076], [-0.1, -0.02], [-0.106, 0.048], [-0.072, 0.108]],
};
const LOOK = {
  R: { skin: H('#c4916c'), hair: H('#231914'), cloth: H('#ddd3bd'), vest: H('#4c5643'), legs: H('#33363f'), shoe: H('#2a1d16'), lip: H('#a8675a'), sc: 1.0 },
  S: { skin: H('#dcab8a'), hair: H('#2e1c14'), cloth: H('#b0566a'), vest: null, legs: H('#dcab8a'), shoe: H('#6a3c34'), lip: H('#b8545e'), sc: 0.94 },
};
function drawHead(who, L, f, eye, tilt) {
  const sk = ic(L.skin, Math.max(0.55, f)), hr = ic(L.hair, Math.max(0.5, f));
  ctx.save(); ctx.rotate(-tilt);
  if (who === 'S') { // long hair behind
    ctx.fillStyle = hr; const sw = Math.sin(TT * 0.9) * 0.006;
    smooth([[0.07, 0.085], [0.03, 0.135], [-0.05, 0.137], [-0.115, 0.08], [-0.13, -0.03], [-0.125 + sw, -0.16], [-0.14 + sw, -0.3], [-0.105 + sw * 2, -0.4], [-0.065 + sw, -0.36], [-0.06, -0.22], [-0.045, -0.1], [-0.02, 0.0], [0.03, 0.06]]); ctx.fill();
  }
  ctx.fillStyle = sk; smooth(HEAD[who]); ctx.fill();
  ctx.fillStyle = ic(L.skin.map(v => v * 0.85), Math.max(0.55, f)); ctx.beginPath(); ctx.ellipse(-0.008, -0.004, 0.02, 0.031, 0.1, 0, 6.283); ctx.fill(); // ear
  ctx.fillStyle = ic(L.lip, f); smooth([[0.092, -0.05], [0.101, -0.051], [0.096, -0.059], [0.098, -0.068], [0.088, -0.071], [0.087, -0.058]]); ctx.fill();
  if (who === 'R') { ctx.fillStyle = 'rgba(30,22,18,0.35)'; smooth([[-0.02, -0.03], [0.04, -0.045], [0.083, -0.042], [0.1, -0.075], [0.096, -0.106], [0.058, -0.123], [0.008, -0.1], [-0.035, -0.06]]); ctx.fill(); }
  else { ctx.fillStyle = 'rgba(220,110,110,0.18)'; ctx.beginPath(); ctx.ellipse(0.05, -0.02, 0.028, 0.018, 0, 0, 6.283); ctx.fill(); }
  // eye (profile almond), lids blink by eye openness
  const ex = 0.063, ey = 0.02, o = clamp(eye);
  ctx.fillStyle = '#f2ebe2'; ctx.beginPath(); ctx.moveTo(ex - 0.014, ey); ctx.quadraticCurveTo(ex + 0.002, ey + 0.012 * o, ex + 0.017, ey + 0.002); ctx.quadraticCurveTo(ex + 0.004, ey - 0.007, ex - 0.014, ey); ctx.fill();
  if (o > 0.15) { ctx.save(); ctx.clip(); ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.arc(ex + 0.008, ey + 0.002, 0.0065, 0, 6.283); ctx.fill(); ctx.fillStyle = '#0d0806'; ctx.beginPath(); ctx.arc(ex + 0.0095, ey + 0.002, 0.003, 0, 6.283); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle = '#1a100c'; ctx.lineWidth = 0.0032; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex - 0.015, ey + 0.001); ctx.quadraticCurveTo(ex + 0.002, ey + 0.013 * o, ex + 0.019, ey + 0.004); ctx.stroke();
  ctx.strokeStyle = hr; ctx.lineWidth = who === 'R' ? 0.007 : 0.005; ctx.beginPath(); ctx.moveTo(ex - 0.016, ey + 0.024); ctx.quadraticCurveTo(ex + 0.006, ey + 0.033, ex + 0.024, ey + 0.026); ctx.stroke();
  ctx.fillStyle = hr;
  if (who === 'R') smooth([[0.088, 0.078], [0.07, 0.128], [-0.01, 0.15], [-0.088, 0.112], [-0.112, 0.04], [-0.1, -0.03], [-0.07, -0.02], [-0.045, 0.045], [0.0, 0.08], [0.05, 0.078]]);
  else smooth([[0.084, 0.078], [0.06, 0.122], [-0.01, 0.142], [-0.09, 0.11], [-0.112, 0.04], [-0.085, 0.0], [-0.06, 0.05], [-0.02, 0.075], [0.03, 0.084]]);
  ctx.fill();
  if (who === 'S') { ctx.strokeStyle = rgba(L.hair.map(v => v * 1.8), 0.5); ctx.lineWidth = 0.003; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-0.02 - i * 0.02, 0.12 - i * 0.01); ctx.quadraticCurveTo(-0.1 - i * 0.008, 0.02, -0.11 - i * 0.004, -0.14 - i * 0.04); ctx.stroke(); } }
  ctx.restore();
}
function hand(wx, wy, ang, sk, grip) {
  ctx.save(); ctx.translate(wx, wy); ctx.rotate(ang);
  ctx.fillStyle = sk; cap(0, 0, 0.022, 0.06 - grip * 0.012, 0, 0.02); ctx.fill();
  cap(0.05 - grip * 0.012, 0, 0.017, 0.09 - grip * 0.04, -grip * 0.015, 0.011); ctx.fill();
  cap(0.02, 0.012, 0.011, 0.05 - grip * 0.01, 0.025 - grip * 0.02, 0.009); ctx.fill();
  ctx.restore();
}
// pose(): computes the skeleton for a character at time t (local frame: facing +x, meters, origin at floor below hip)
function pose(who, t) {
  const br = Math.sin(t * 1.6 + (who === 'S' ? 1 : 0)) * 0.5 + 0.5; // breathing
  const p = { hip: [0, 0.48], torso: 0.12 + br * 0.012, neck: 0.12, tilt: -0.02, eye: 1, wristN: [0.55, 0.8], wristF: [0.42, 0.8], gripN: 0, ankleN: [0.47, 0.07], ankleF: [0.4, 0.07], facing: 1, sx: 1, walkPh: -1, armSwing: 0, handOnChest: 0 };
  const blink = (times) => { for (const b of times) if (t > b && t < b + 0.16) p.eye = Math.abs(t - b - 0.08) / 0.08; };
  if (who === 'S') {
    blink([16.9, 19.0, 21.4]);
    p.torso = 0.1 + br * 0.012; p.tilt = 0.02 + 0.03 * ss(15.5, 18, t); p.wristN = [0.53, 0.795];
  } else {
    blink([17.6, 22.6, 27.4, 30.2, 37.2]);
    p.tilt = 0.0 + 0.02 * ss(15.5, 18, t);
    // looks down at the pendant with emotion
    const look = ss(T.look0, T.look1, t);
    p.tilt += look * 0.32 + Math.sin(t * 0.8) * 0.01 * look; p.torso += look * 0.04;
    // reach, grasp, lift to the lips, kiss, look, place in pocket, hand on heart
    const reach = ss(T.reach0, T.grab, t), lift = ss(T.grab + 0.3, T.lift1, t), down = ss(T.kiss1, T.kiss1 + 0.9, t), pk = ss(T.pocket0, T.pocketIn, t), hold = ss(T.pocketIn, T.pocket1, t), rel = ss(T.stand0 - 0.3, T.stand0 + 0.3, t);
    p.torso += reach * 0.14 - lift * 0.12;
    p.tilt += reach * 0.06 - lift * 0.42 + down * 0.3 - pk * 0.2;
    const tableW = [0.7, 0.79 + reach * 0.03 + 0.04 * ss(T.grab, T.grab + 0.4, t)];
    const mouth = [0.19, 0.975], viewW = [0.36, 1.0], pocketW = [0.2, 0.88], chestW = [0.17, 0.83];
    let w = mixc([...p.wristN, 0], [...tableW, 0], reach);
    w = mixc(w, [...mouth, 0], lift); w = mixc(w, [...viewW, 0], down); w = mixc(w, [...pocketW, 0], pk); w = mixc(w, [...chestW, 0], hold);
    w = mixc(w, [0.1, 0.6, 0], rel);
    p.wristN = [w[0], w[1]]; p.gripN = ss(T.grab - 0.2, T.grab + 0.2, t) * (1 - hold);
    p.handOnChest = hold * (1 - rel);
    if (t > T.kiss0 - 0.3 && t < T.kiss1 + 0.2) p.eye = 1 - ss(T.kiss0 - 0.3, T.kiss0 + 0.1, t) * (1 - ss(T.kiss1 - 0.1, T.kiss1 + 0.2, t));
    // stand up, turn, walk away to the left
    const st = ease(seg(t, T.stand0, T.stand1));
    if (t > T.stand0) {
      p.ankleN = [lerp(0.47, 0.13, ss(T.stand0, T.stand0 + 0.5, t)), 0.07]; p.ankleF = [lerp(0.4, 0.06, ss(T.stand0, T.stand0 + 0.5, t)), 0.07];
      p.hip = [lerp(0, 0.1, st), lerp(0.48, 0.93, st)]; p.torso = lerp(p.torso, 0.05, st) + Math.sin(st * Math.PI) * 0.35; p.tilt = lerp(p.tilt, 0.04, st);
      p.wristF = mixc([...p.wristF, 0], [0.12, 0.55, 0], st).slice(0, 2);
      CH.rChairShift = -0.08 * ss(T.stand0, T.stand0 + 0.6, t);
    } else CH.rChairShift = 0;
    if (t > T.stand1) {
      const tr = ss(T.stand1, T.turn1, t); p.facing = tr < 0.5 ? 1 : -1; p.sx = 0.32 + 0.68 * Math.abs(Math.cos(tr * Math.PI));
    }
    if (t > T.walk0) p.walkPh = (t - T.walk0) / 1.36;
  }
  return p;
}
function walkPos(t) { // Rami's world position (hip x, z) while leaving
  const base = [-0.84 + 0.18, 11.04];
  if (t < T.stand0) return base;
  const st = ease(seg(t, T.stand0, T.stand1)), b = [base[0] + 0.1 * st, base[1]];
  if (t < T.walk0) return b;
  const d = Math.max(0, t - T.walk0) * 0.6 - 0.05 * (1 - Math.exp(-(t - T.walk0) * 3)); // calm pace, matched to the stride
  return [b[0] - d * 0.94, b[1] - d * 0.32];
}
function drawPerson(who, t, pass, wpos) {
  const L = LOOK[who], p = pose(who, t);
  const wx = who === 'S' ? 0.66 : wpos[0], wz = who === 'S' ? 11.04 : wpos[1];
  const f = Math.max(0.35, revive([wx, 1, wz]));
  const base = P(wx, 0, wz);
  ctx.save(); ctx.translate(base.x, base.y);
  const face = who === 'S' ? -1 : p.facing;
  ctx.scale(base.k * face * p.sx * L.sc, -base.k * L.sc);
  // walking cycle (local, facing +x after the turn)
  let hip = p.hip.slice(), ankN = p.ankleN, ankF = p.ankleF, swingN = 0;
  if (p.walkPh >= 0) {
    const ramp = ss(0, 0.6, p.walkPh), str = 0.5 * ramp;
    const foot = ph => { ph = ((ph % 1) + 1) % 1; if (ph < 0.6) return [0.1 + str * (0.5 - ph / 0.6), 0.07]; const s = (ph - 0.6) / 0.4; return [0.1 + str * (-0.5 + sine(s)), 0.07 + 0.1 * Math.sin(Math.PI * s) * ramp]; };
    ankN = foot(p.walkPh); ankF = foot(p.walkPh + 0.5);
    hip = [0.1, 0.93 + 0.018 * Math.cos(p.walkPh * 4 * Math.PI) * ramp]; swingN = Math.sin(p.walkPh * 2 * Math.PI) * 0.35 * ramp;
  }
  const sh = [hip[0] + up(p.torso)[0] * 0.47, hip[1] + up(p.torso)[1] * 0.47];
  const neckTop = [sh[0] + up(p.neck + p.torso * 0.5)[0] * 0.09 + 0.015, sh[1] + up(p.neck)[1] * 0.09];
  const sk = ic(L.skin, Math.max(0.55, f)), cloth = ic(L.cloth, Math.max(0.45, f)), clothD = ic(L.cloth.map(v => v * 0.72), Math.max(0.45, f));
  const legsC = ic(L.legs, Math.max(0.45, f)), shoe = ic(L.shoe, f);
  const arm = (wr, far, swing, grip) => {
    let elbow, wrist; const s0 = [sh[0] - 0.01, sh[1] - 0.03];
    if (p.walkPh >= 0 || (who === 'R' && t > T.stand1)) { const a1 = (far ? -swing : swing), a2 = a1 + 0.25; elbow = [s0[0] + Math.sin(a1) * 0.29, s0[1] - Math.cos(a1) * 0.29]; wrist = [elbow[0] + Math.sin(a2) * 0.26, elbow[1] - Math.cos(a2) * 0.26]; }
    else[elbow, wrist] = ik(s0[0], s0[1], wr[0], wr[1], 0.29, 0.27, -1);
    const col = far ? clothD : cloth, skn = far ? ic(L.skin.map(v => v * 0.8), Math.max(0.55, f)) : sk;
    ctx.fillStyle = col; cap(s0[0], s0[1], 0.048, elbow[0], elbow[1], 0.038); ctx.fill();
    if (who === 'R') { cap(elbow[0], elbow[1], 0.037, lerp(elbow[0], wrist[0], 0.55), lerp(elbow[1], wrist[1], 0.55), 0.033); ctx.fill(); ctx.fillStyle = skn; cap(lerp(elbow[0], wrist[0], 0.5), lerp(elbow[1], wrist[1], 0.5), 0.03, wrist[0], wrist[1], 0.024); ctx.fill(); }
    else { cap(elbow[0], elbow[1], 0.035, lerp(elbow[0], wrist[0], 0.35), lerp(elbow[1], wrist[1], 0.35), 0.031); ctx.fill(); ctx.fillStyle = skn; cap(lerp(elbow[0], wrist[0], 0.3), lerp(elbow[1], wrist[1], 0.3), 0.027, wrist[0], wrist[1], 0.021); ctx.fill(); }
    let ha = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]) * 0.6;
    if (!far && who === 'R') ha = lerp(ha, -1.35, p.handOnChest) + lerp(0, -0.5, ss(T.pocket0, T.pocketIn, t) * (1 - p.handOnChest));
    hand(wrist[0], wrist[1], ha, skn, grip);
    return { wrist, ha };
  };
  const leg = (ank, far) => {
    const [knee, a] = ik(hip[0], hip[1], ank[0], ank[1], 0.45, 0.44, 1);
    const col = far ? ic(L.legs.map(v => v * 0.75), Math.max(0.45, f)) : legsC;
    if (who === 'S') { // dress over the thigh, bare shins
      ctx.fillStyle = col; cap(knee[0], knee[1], 0.04, a[0], a[1], 0.03); ctx.fill();
      ctx.fillStyle = far ? clothD : cloth; cap(hip[0], hip[1], 0.11, knee[0], knee[1], 0.075); ctx.fill();
      ctx.beginPath(); ctx.moveTo(knee[0] + 0.07, knee[1] + 0.03); ctx.lineTo(knee[0] + 0.06, knee[1] - 0.22); ctx.quadraticCurveTo(knee[0] - 0.02, knee[1] - 0.25, knee[0] - 0.1, knee[1] - 0.2); ctx.lineTo(knee[0] - 0.1, knee[1] + 0.02); ctx.fill();
    } else { ctx.fillStyle = col; cap(hip[0], hip[1], 0.085, knee[0], knee[1], 0.058); ctx.fill(); cap(knee[0], knee[1], 0.055, a[0], a[1], 0.042); ctx.fill(); }
    ctx.fillStyle = far ? ic(L.shoe.map(v => v * 0.7), f) : shoe; cap(a[0] - 0.03, a[1] - 0.035, 0.035, a[0] + 0.15, a[1] - 0.05, 0.022); ctx.fill();
  };
  if (pass === 'body') {
    arm(p.wristF, true, swingN, 0);
    leg(ankF, true);
    // torso
    const U = up(p.torso), V = [U[1], -U[0]], TP = (v, u) => [hip[0] + V[0] * v + U[0] * u, hip[1] + V[1] * v + U[1] * u];
    const tor = who === 'R' ? [[-0.12, -0.04], [-0.13, 0.12], [-0.12, 0.3], [-0.1, 0.44], [-0.05, 0.5], [0.03, 0.51], [0.07, 0.48], [0.115, 0.41], [0.128, 0.31], [0.118, 0.17], [0.105, 0.05], [0.12, -0.04], [0.02, -0.09], [-0.1, -0.08]]
      : [[-0.11, -0.04], [-0.115, 0.12], [-0.105, 0.3], [-0.085, 0.42], [-0.04, 0.47], [0.02, 0.475], [0.055, 0.455], [0.09, 0.4], [0.128, 0.335], [0.122, 0.27], [0.085, 0.22], [0.072, 0.14], [0.09, 0.04], [0.12, -0.04], [0.02, -0.1], [-0.1, -0.09]];
    ctx.fillStyle = cloth; smooth(tor.map(q => TP(q[0], q[1]))); ctx.fill();
    if (who === 'R') {
      ctx.fillStyle = ic(L.vest, Math.max(0.45, f)); smooth([[-0.125, -0.02], [-0.128, 0.2], [-0.112, 0.42], [-0.06, 0.475], [-0.01, 0.47], [0.05, 0.33], [0.121, 0.3], [0.112, 0.16], [0.1, 0.03], [0.11, -0.03], [0.0, -0.06]].map(q => TP(q[0], q[1]))); ctx.fill();
      // chest pocket (the one nearest his heart)
      ctx.strokeStyle = ic(H('#2c3326'), f); ctx.lineWidth = 0.006; const a = TP(0.052, 0.335), b = TP(0.112, 0.32); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); for (let i = 0; i < 4; i++) { const q = TP([0.055, 0.112, 0.112, 0.06][i], [0.33, 0.315, 0.24, 0.25][i]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.closePath(); ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
      p._pocket = TP(0.085, 0.3);
    } else { ctx.fillStyle = sk; const n0 = TP(0.02, 0.475), n1 = TP(0.062, 0.45), n2 = TP(0.035, 0.405); ctx.beginPath(); ctx.moveTo(n0[0], n0[1]); ctx.lineTo(n1[0], n1[1]); ctx.lineTo(n2[0], n2[1]); ctx.fill(); }
    ctx.fillStyle = sk; cap(sh[0] - 0.005, sh[1] - 0.04, 0.045, neckTop[0], neckTop[1], 0.04); ctx.fill();
    leg(ankN, false);
    ctx.save(); ctx.translate(neckTop[0] + 0.0, neckTop[1] + 0.085); drawHead(who, L, f, p.eye, p.tilt); ctx.restore();
    if (who === 'R' && p.walkPh >= 0) arm(p.wristN, false, swingN, 0);
  } else if (pass === 'arm') {
    if (who === 'R' && p.walkPh >= 0) { ctx.restore(); return null; }
    const r = arm(p.wristN, false, 0, p.gripN);
    const ft = [r.wrist[0] + Math.cos(r.ha) * 0.075, r.wrist[1] + Math.sin(r.ha) * 0.075];
    const m = ctx.getTransform(); const pt = m.transformPoint(new DOMPoint(ft[0], ft[1]));
    const tor = up(p.torso), pk = [hip[0] + tor[1] * 0.085 + tor[0] * 0.3, hip[1] - tor[0] * 0.085 + tor[1] * 0.3], pkp = m.transformPoint(new DOMPoint(pk[0], pk[1]));
    ctx.restore(); return { fingers: [pt.x / S, pt.y / S], pocket: [pkp.x / S, pkp.y / S], k: base.k };
  }
  ctx.restore(); return null;
}

// Character layers with backlit rim light and (for Samar) the dissolve.
let NOISE = null, NOISE_BOX = null;
function personLayer(who, t, pass, wpos, extra) {
  const cx = who === 'S' ? 0.5 : wpos[0], cz = who === 'S' ? 11.04 : wpos[1], hw = who === 'S' ? 0.55 : 0.95;
  const a = P(cx - hw, 1.95, cz), b = P(cx + hw, -0.12, cz);
  const bx = [a.x, a.y, b.x - a.x, b.y - a.y]; // design-space bbox [x,y,w,h]
  const X = clamp(Math.floor(bx[0] * S), 0, cv.width - 1), Y = clamp(Math.floor(bx[1] * S), 0, cv.height - 1);
  const W = clamp(Math.ceil((bx[0] + bx[2]) * S), X + 1, cv.width) - X, Hh = clamp(Math.ceil((bx[1] + bx[3]) * S), Y + 1, cv.height) - Y;
  L1c.setTransform(1, 0, 0, 1, 0, 0); L1c.clearRect(X, Y, W, Hh); L1c.setTransform(S, 0, 0, S, 0, 0);
  const prev = ctx; ctx = L1c; const info = drawPerson(who, t, pass, wpos); ctx = prev;
  // rim light from the bright garden behind
  L2c.setTransform(1, 0, 0, 1, 0, 0); L2c.clearRect(X, Y, W, Hh);
  L2c.globalCompositeOperation = 'source-over'; L2c.drawImage(L1, X, Y, W, Hh, X, Y, W, Hh);
  L2c.globalCompositeOperation = 'source-in'; L2c.fillStyle = 'rgba(255,232,190,1)'; L2c.fillRect(X, Y, W, Hh);
  L2c.globalCompositeOperation = 'destination-out'; L2c.drawImage(L1, X, Y, W, Hh, X + 2.2 * S * (who === 'S' ? -1 : 1), Y + 2.6 * S, W, Hh);
  L2c.globalCompositeOperation = 'source-over';
  L1c.setTransform(1, 0, 0, 1, 0, 0);
  L1c.globalCompositeOperation = 'source-atop';
  const sh = L1c.createLinearGradient(0, Y, 0, Y + Hh); sh.addColorStop(0, 'rgba(20,16,24,0.05)'); sh.addColorStop(0.55, 'rgba(20,16,24,0.18)'); sh.addColorStop(1, 'rgba(10,8,12,0.42)');
  L1c.fillStyle = sh; L1c.fillRect(X, Y, W, Hh);
  L1c.globalAlpha = 0.7; L1c.drawImage(L2, X, Y, W, Hh, X, Y, W, Hh); L1c.globalAlpha = 1;
  if (extra && extra.glow > 0) { L1c.fillStyle = `rgba(255,214,150,${extra.glow * 0.45})`; L1c.fillRect(X, Y, W, Hh); }
  L1c.globalCompositeOperation = 'source-over';
  if (extra && extra.dis > 0) dissolve(X, Y, W, Hh, extra.dis);
  mainCtx.save(); mainCtx.setTransform(1, 0, 0, 1, 0, 0);
  mainCtx.drawImage(L1, X, Y, W, Hh, X, Y, W, Hh);
  mainCtx.restore();
  return info;
}
function dissolve(X, Y, W, Hh, prog) {
  if (!NOISE || NOISE_BOX !== `${X},${Y},${W},${Hh}`) { // smooth value noise over the box
    NOISE_BOX = `${X},${Y},${W},${Hh}`; NOISE = new Float32Array(W * Hh); const g = 24 * S, gw = Math.ceil(W / g) + 2, gh = Math.ceil(Hh / g) + 2, r = rng(41), grid = new Float32Array(gw * gh).map(() => r());
    const g2 = 7 * S, gw2 = Math.ceil(W / g2) + 2, gh2 = Math.ceil(Hh / g2) + 2, grid2 = new Float32Array(gw2 * gh2).map(() => r());
    const samp = (gr, gwid, gs, x, y) => { const fx = x / gs, fy = y / gs, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, a = gr[iy * gwid + ix], b = gr[iy * gwid + ix + 1], c = gr[(iy + 1) * gwid + ix], d = gr[(iy + 1) * gwid + ix + 1]; const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty); return lerp(lerp(a, b, sx), lerp(c, d, sx), sy); };
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) NOISE[y * W + x] = 0.42 * (0.7 * samp(grid, gw, g, x, y) + 0.3 * samp(grid2, gw2, g2, x, y)) + 0.58 * (y / Hh);
  }
  const id = L1c.getImageData(X, Y, W, Hh), d = id.data, p = prog * 1.12 - 0.04;
  for (let i = 0, n = W * Hh; i < n; i++) {
    const a = d[i * 4 + 3]; if (!a) continue;
    const e = NOISE[i] - p;
    if (e < 0) { d[i * 4 + 3] = 0; continue; }
    if (e < 0.05) { const k = 1 - e / 0.05; d[i * 4] = lerp(d[i * 4], 255, k); d[i * 4 + 1] = lerp(d[i * 4 + 1], 226, k); d[i * 4 + 2] = lerp(d[i * 4 + 2], 160, k); d[i * 4 + 3] = a * clamp(e / 0.012); }
  }
  L1c.putImageData(id, X, Y);
}

// ---------- pendant ----------
function hbPulse(t) {
  if (t < T.hb0 || t > T.hbEnd + 1) return 0;
  const i = Math.floor((t - T.hb0) / T.hbP), tb = T.hb0 + i * T.hbP, u = t - tb;
  const fade = 1 - ss(T.hbEnd - 1, T.hbEnd + 0.5, t);
  return fade * (Math.exp(-Math.pow(u / 0.06, 2)) + 0.6 * Math.exp(-Math.pow((u - 0.2) / 0.06, 2)));
}
function drawPendant(sx, sy, k, mode, alpha) {
  // sx, sy screen center; k pixels per meter; mode: 'table' (lying, foreshortened) or 'hang'
  if (alpha <= 0) return;
  const R = 0.042 * k, squash = mode === 'table' ? 0.62 : 1, pulse = hbPulse(TT), red = ss(T.glowRed, T.glowRed + 0.8, TT);
  ctx.save(); ctx.globalAlpha = alpha;
  // chain
  ctx.strokeStyle = 'rgba(232,196,120,0.95)'; ctx.lineWidth = Math.max(0.6, 0.0035 * k); ctx.setLineDash([0.006 * k, 0.003 * k]);
  ctx.beginPath();
  if (mode === 'table') ctx.ellipse(sx + R * 0.6, sy - R * 0.5 * squash, R * 2.3, R * 1.0, 0.08, 0, 6.283);
  else { ctx.moveTo(sx - R * 0.3, sy - R); ctx.bezierCurveTo(sx - R * 1.6, sy + R * 2.5, sx + R * 1.2, sy + R * 3.2, sx + R * 0.4, sy - R); }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.translate(sx, sy); ctx.scale(1, squash);
  // halo
  ctx.globalCompositeOperation = 'lighter';
  sprite(red > 0 ? 'red' : 'gold', 0, 0, R * (3.4 + pulse * 1.4 + red * 2.0), alpha * (0.35 + 0.35 * pulse + 0.25 * red));
  ctx.globalCompositeOperation = 'source-over';
  // gold ring with filigree petals
  const g = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R * 1.1); g.addColorStop(0, '#fff3c4'); g.addColorStop(0.5, '#e2b450'); g.addColorStop(1, '#8a5d1c');
  ctx.fillStyle = g; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; ctx.beginPath(); ctx.ellipse(Math.cos(a) * R * 1.05, Math.sin(a) * R * 1.05, R * 0.22, R * 0.12, a, 0, 6.283); ctx.fill(); }
  ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill();
  const gl = ctx.createRadialGradient(0, -R * 0.2, 0, 0, 0, R * 0.78); gl.addColorStop(0, '#2c4a52'); gl.addColorStop(1, '#0c171c');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, R * 0.78, 0, 6.283); ctx.fill();
  ctx.strokeStyle = 'rgba(255,236,170,0.8)'; ctx.lineWidth = R * 0.05; ctx.beginPath(); ctx.arc(0, 0, R * 0.7, 0, 6.283); ctx.stroke();
  // the heart: beats with the heartbeat, becomes a glossy luminous red balloon after the kiss
  const hs = R * (0.46 + 0.07 * pulse + red * 0.06) * (1 + Math.sin(TT * 2) * 0.01 * red), hy = -red * Math.sin(TT * 1.4) * R * 0.03;
  const hg = ctx.createRadialGradient(-hs * 0.35, hy - hs * 0.4, hs * 0.05, 0, hy, hs * 1.2);
  hg.addColorStop(0, rgba(mixc([210, 90, 100], [255, 190, 190], red))); hg.addColorStop(0.45, rgba(mixc([150, 26, 40], [240, 30, 50], red))); hg.addColorStop(1, rgba(mixc([70, 8, 16], [150, 0, 20], red)));
  ctx.fillStyle = hg; heartPath(0, hy, hs); ctx.fill();
  ctx.globalCompositeOperation = 'lighter'; sprite('red', 0, hy, hs * (2 + pulse * 1.5), 0.25 + pulse * 0.4 + red * 0.5); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(255,255,255,${0.35 + red * 0.5})`; ctx.beginPath(); ctx.ellipse(-hs * 0.42, hy - hs * 0.35, hs * 0.2, hs * 0.11, -0.7, 0, 6.283); ctx.fill();
  ctx.restore();
}

// ---------- interior growth ----------
function drawGrowth(it) {
  const st = T.wave + dist3([it.x !== undefined ? it.x : it.pts[0][0], it.y !== undefined ? it.y : it.pts[0][1], it.z], PEND) / WAVE_V + it.jit * 0.6;
  const g = seg(TT, st, st + (it.t === 'vine' ? 2.6 : 1.3)); if (g <= 0) return;
  if (it.t === 'gflower') { if (it.wall) { const p = P(it.x, it.y, it.z); if (p.d < NEAR) return; ctx.fillStyle = rgba(H('#4e843c')); ctx.beginPath(); ctx.ellipse(p.x, p.y + 0.02 * p.k, 0.03 * p.k * g, 0.012 * p.k, 0.4, 0, 6.283); ctx.fill(); flowerHead(it.kind, it.col, p.x, p.y, it.s * p.k * backOut(g), 1, it.tint, 0); } else drawFlower(it, g, 1); return; }
  if (it.t === 'grass') { const b = P(it.x, 0, it.z); if (b.d < NEAR) return; ctx.strokeStyle = rgba(mixc(H('#4c7a34'), H('#8fbf55'), it.jit)); ctx.lineWidth = Math.max(0.5, 0.004 * b.k); ctx.beginPath(); for (let i = 0; i < 5; i++) { const ox = (i - 2) * 0.012, sw = Math.sin(TT * 1.5 + it.ph + i) * 0.01; ctx.moveTo(b.x + ox * b.k, b.y); ctx.quadraticCurveTo(b.x + (ox + sw) * b.k, b.y - it.h * g * 0.6 * b.k, b.x + (ox * 2 + sw * 2 + (i - 2) * 0.01) * b.k, b.y - it.h * g * b.k); } ctx.stroke(); return; }
  if (it.t === 'moss') { const b = P(it.x, 0.001, it.z); if (b.d < NEAR) return; ctx.save(); ctx.translate(b.x, b.y); ctx.scale(1, 0.22 * (1 + (C.y - 1.24))); ctx.globalAlpha = 0.55 * g; ctx.fillStyle = rgba(mixc(H('#5f8a3a'), H('#9cc25c'), it.jit)); ctx.beginPath(); ctx.arc(0, 0, it.s * b.k * ease(g), 0, 6.283); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1; return; }
  if (it.t === 'vine') {
    const n = it.pts.length - 1, len = g * n; ctx.strokeStyle = 'rgb(62,104,46)'; ctx.lineCap = 'round';
    const pts = []; for (let i = 0; i <= Math.ceil(len) && i <= n; i++) { const a = it.pts[Math.min(i, n)], b = it.pts[Math.min(i + 1, n)], u = Math.min(1, len - i); pts.push(i < Math.floor(len) || i === n ? a : a); if (i === Math.floor(len) && i < n) pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]); }
    const sp = pts.map(q => P(q[0], q[1], q[2])); if (sp[0].d < NEAR) return;
    ctx.lineWidth = Math.max(0.6, it.w * sp[0].k); ctx.beginPath(); sp.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
    for (let i = 0; i < sp.length - 1; i++) for (let j = 0; j < 4; j++) { const u = (j + 0.5) / 4, x = lerp(sp[i].x, sp[i + 1].x, u), y = lerp(sp[i].y, sp[i + 1].y, u), k = sp[i].k; ctx.fillStyle = rgba(mixc(H('#3d7036'), H('#86b558'), (i * 4 + j) % 3 / 2)); ctx.beginPath(); ctx.ellipse(x + (j % 2 ? 1 : -1) * 0.025 * k, y, 0.032 * k, 0.014 * k, (j % 2 ? 0.5 : -0.5), 0, 6.283); ctx.fill(); if ((i + j) % 3 === 0) flowerHead('cosmos', j % 2 ? PAL.pink : PAL.white, x + (j % 2 ? -1 : 1) * 0.02 * k, y, 0.025 * k, 1, 1, 0); }
    return;
  }
  if (it.t === 'hang') { // wisteria-like hanging blossoms
    const a = P(it.x, it.y, it.z); if (a.d < NEAR) return; const L = it.len * ease(g), sw = Math.sin(TT * 0.8 + it.jit * 9) * 0.01;
    ctx.strokeStyle = 'rgb(70,110,52)'; ctx.lineWidth = Math.max(0.5, 0.005 * a.k); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x + sw * a.k, a.y + L * a.k); ctx.stroke();
    for (let i = 0; i < 9; i++) { const u = (i + 1) / 10; if (u > ease(g)) break; const rr = 0.028 * (1 - u * 0.6) * a.k; ctx.fillStyle = rgba(mixc(it.col, [255, 255, 255], (i % 3) * 0.15)); ctx.beginPath(); ctx.ellipse(a.x + sw * a.k * u + (i % 2 ? 1 : -1) * rr * 0.6, a.y + u * L * a.k, rr, rr * 0.8, 0, 0, 6.283); ctx.fill(); }
  }
}
function furnitureGrowth(o) { // vines and blossoms on the old furniture
  const st = T.wave + dist3([o.x, 0.5, o.z], PEND) / WAVE_V; const g = seg(TT, st, st + 2.2); if (g <= 0) return;
  const r = rng(Math.floor(o.x * 100 + o.z * 1000));
  const legs = o.t === 'chair' ? [[-0.19, -0.19], [0.19, -0.19]] : o.t === 'rtable' ? [[0, -0.025]] : [[-0.32, -0.32], [0.32, -0.32]];
  for (const [lx, lz] of legs) {
    const x = o.x + lx + (o.id === 'chairR' ? CH.rChairShift : 0), z = o.z + lz - 0.02, H0 = (o.t === 'chair' ? 0.46 : 0.72) * ease(g);
    const pts = []; for (let i = 0; i <= 8; i++) { const y = H0 * i / 8; const p = P(x + Math.sin(i * 1.4) * 0.025, y, z); pts.push(p); }
    if (pts[0].d < NEAR) continue;
    ctx.strokeStyle = 'rgb(62,104,46)'; ctx.lineWidth = Math.max(0.6, 0.007 * pts[0].k); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
    pts.forEach((q, i) => { if (i % 2) { ctx.fillStyle = 'rgb(84,140,64)'; ctx.beginPath(); ctx.ellipse(q.x + (i % 4 ? 1 : -1) * 0.02 * q.k, q.y, 0.025 * q.k, 0.011 * q.k, 0.5, 0, 6.283); ctx.fill(); } });
  }
  const tops = o.t === 'chair' ? (o.id === 'chairS' ? 9 : 4) : o.t === 'rtable' ? 6 : 4;
  for (let i = 0; i < tops; i++) {
    let x, y, z;
    if (o.t === 'chair') { x = o.x + (r() - 0.5) * 0.36; y = 0.49; z = o.z + (r() - 0.5) * 0.36; if (o.id === 'chairS') { x = o.x + (r() - 0.5) * 0.3; z = o.z + (r() - 0.5) * 0.3; } }
    else if (o.t === 'rtable') { const a = r() * 6.28; x = o.x + Math.cos(a) * 0.33; y = 0.76; z = o.z + Math.sin(a) * 0.33; }
    else { const side = i % 2 ? -1 : 1; x = side * 0.3; y = 0.77; z = o.z + (i < 2 ? -0.28 : 0.28); }
    const gg = seg(g, 0.3 + i * 0.05, 1); if (gg <= 0) continue; const p = P(x, y, z); if (p.d < NEAR) continue;
    const kind = o.id === 'chairS' ? 'rose' : ['rose', 'cosmos', 'daisy'][i % 3];
    ctx.fillStyle = 'rgb(70,120,54)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 0.006 * p.k, 0.04 * p.k * gg, 0.012 * p.k, 0, 0, 6.283); ctx.fill();
    flowerHead(kind, o.id === 'chairS' ? [PAL.rose, PAL.pink, PAL.cream][i % 3] : [PAL.pink, PAL.white, PAL.peach][i % 3], p.x, p.y - 0.012 * p.k, (o.id === 'chairS' ? 0.045 : 0.035) * p.k * backOut(gg), 1, 1, 0);
  }
}

// ---------- frame ----------
function setup(scale) {
  S = scale; cv = document.getElementById('c'); cv.width = Math.round(DW * S); cv.height = Math.round(DH * S);
  mainCtx = ctx = cv.getContext('2d');
  L1 = mk(cv.width, cv.height); L1c = L1.getContext('2d', { willReadFrequently: true });
  L2 = mk(cv.width, cv.height); L2c = L2.getContext('2d');
  SM = mk(Math.ceil(cv.width / 8), Math.ceil(cv.height / 8)); SMc = SM.getContext('2d');
  buildWorld(); buildSprites(); buildBackdrop();
}
function renderFrame(t) {
  TT = t; camera(t); ctx = mainCtx;
  ctx.setTransform(S, 0, 0, S, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#9cc0de'; ctx.fillRect(0, 0, DW, DH);
  // 1. the garden beyond the back glass (drawn into a layer, softened for depth of field)
  L1c.setTransform(1, 0, 0, 1, 0, 0); L1c.clearRect(0, 0, cv.width, cv.height); L1c.setTransform(S, 0, 0, S, 0, 0);
  ctx = L1c;
  drawPlaneImg(BG, BGP); drawPlaneImg(MID, MIDP);
  fillPoly([[-30, 0, 14], [30, 0, 14], [30, 0, 24.9], [-30, 0, 24.9]], 'rgb(96,140,66)');
  const items = BACKG.filter(o => o.z - C.z > NEAR).sort((a, b) => b.z - a.z);
  for (const o of items) o.t === 'bush' ? drawBush(o) : drawFlower(o);
  for (const b of BFLY) if (!b.inside && b.home[2] > 14) drawButterfly(b);
  ctx = mainCtx; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const inside = C.z > CAFE.zf + 0.4;
  ctx.filter = `blur(${(inside ? 2.2 : 1.4) * S}px)`; ctx.drawImage(L1, 0, 0); ctx.filter = 'none';
  ctx.setTransform(S, 0, 0, S, 0, 0);
  // 2. back glass wall
  drawGlassWall(CAFE.zb, false, false);
  // 3. interior
  drawInteriorShell();
  // garden light pooling on the floor, light shafts, contact shadows
  ctx.globalCompositeOperation = 'screen';
  const lf = 0.18 + 0.12 * ss(T.wave, T.wave + 4, TT);
  { const a = P(0, 0, 14), b = P(0, 0, 8.5); if (a.d > NEAR && b.d > NEAR) { const g = ctx.createLinearGradient(0, a.y, 0, b.y); g.addColorStop(0, `rgba(255,236,196,${lf * 1.4})`); g.addColorStop(1, 'rgba(255,236,196,0)'); fillPoly([[-2.6, 0, 14], [2.6, 0, 14], [2.2, 0, 8.5], [-2.2, 0, 8.5]], g); } }
  for (const [x0, x1] of [[-2.5, -1.4], [-1.2, -0.1], [0.1, 1.2], [1.4, 2.5]]) {
    const a = P(0, 3, 14), b = P(0, 0, 10); if (a.d < NEAR || b.d < NEAR) continue;
    const g = ctx.createLinearGradient(0, a.y, 0, b.y); g.addColorStop(0, `rgba(255,240,210,${0.07 + lf * 0.12})`); g.addColorStop(1, 'rgba(255,240,210,0)');
    fillPoly([[x0, 3.0, 14], [x1, 3.0, 14], [x1 * 0.8, 0, 10.2], [x0 * 0.8, 0, 10.2]], g);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const o of FURN) { const p = P(o.x, 0.004, o.z - 0.25); if (p.d < NEAR) continue; ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.2); sprite('shadow', 0, 0, (o.t === 'chair' ? 0.32 : 0.45) * p.k, 0.45); ctx.restore(); }
  const wp = walkPos(TT); { const p = P(wp[0] + 0.1, 0.004, wp[1] - 0.2); if (p.d > NEAR) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.2); sprite('shadow', 0, 0, 0.42 * p.k, 0.4); ctx.restore(); } }
  // sortable interior items
  const list = [];
  for (const it of INT) list.push({ z: it.z + (it.t === 'moss' ? 50 : 0) - (it.t === 'hang' || it.wall || it.t === 'vine' ? -40 : 0), f: () => drawGrowth(it) });
  for (const o of FURN) {
    if (o.t === 'chair') list.push({ z: o.z, f: () => { chair(o); furnitureGrowth(o); } });
    else if (o.t === 'rtable') list.push({ z: o.z, f: () => { rtable(o); furnitureGrowth(o); } });
    else { list.push({ z: 11.3, f: () => sqTable(o, 'far') }); list.push({ z: 11.0, f: () => { sqTable(o, 'near'); furnitureGrowth(o); } }); }
  }
  list.push({ z: 6.6, f: drawDoorLeaf });
  const sGlow = ss(T.glow, T.dis0 + 0.6, TT), sDis = seg(TT, T.dis0, T.dis1);
  if (sDis < 1) list.push({ z: 11.04, f: () => { if (sGlow > 0) { const p = P(0.62, 0.95, 11.04); ctx.globalCompositeOperation = 'lighter'; sprite('warm', p.x, p.y, 0.9 * p.k, sGlow * 0.55 * (1 - sDis)); ctx.globalCompositeOperation = 'source-over'; } personLayer('S', TT, 'body', null, { glow: sGlow * 0.8, dis: sDis }); } });
  if (sDis < 1) list.push({ z: 10.99, f: () => personLayer('S', TT, 'arm', null, { glow: sGlow * 0.8, dis: sDis }) });
  let armInfo = null;
  const rz = wp[1];
  list.push({ z: rz + 0.0001, f: () => personLayer('R', TT, 'body', wp) });
  list.push({ z: rz < 11.0 ? rz - 0.0001 : 10.99, f: () => { armInfo = personLayer('R', TT, 'arm', wp); pendantAndMagic(armInfo); } });
  for (const b of BFLY) if (b.inside) list.push({ z: 9.6, f: () => drawButterfly(b) });
  list.push({ z: 9.0, f: drawPetals });
  list.sort((a, b) => b.z - a.z);
  for (const it of list) if (it.z - C.z > NEAR || it.z > 30) it.f();
  // dust motes in the light, before the bloom
  ctx.globalCompositeOperation = 'lighter';
  const md = 1 - ss(T.wave, T.wave + 3, TT);
  for (const m of MOTES) { const y = m.y + Math.sin(TT * m.sp * 6 + m.ph) * 0.08 + ((TT * m.sp) % 1) * 0.2, p = P(m.x + Math.sin(TT * 0.3 + m.ph) * 0.1, y, m.z); if (p.d > 0.3) sprite('soft', p.x, p.y, 0.012 * p.k, 0.5 * md); }
  ctx.globalCompositeOperation = 'source-over';
  // 4. front facade and front garden (only while outside)
  if (C.z < CAFE.zf) {
    drawGlassWall(CAFE.zf, true, true);
    drawFacadeOutside();
    fillPoly([[-30, 0, -4], [30, 0, -4], [30, 0, CAFE.zf], [-30, 0, CAFE.zf]], 'rgb(92,134,62)');
    fillPoly([[-0.6, 0.002, -4], [0.6, 0.002, -4], [0.6, 0.002, CAFE.zf], [-0.6, 0.002, CAFE.zf]], 'rgb(150,140,120)');
    for (let z = -3.6; z < CAFE.zf; z += 0.55) for (const x of [-0.3, 0.3]) fillPoly([[x - 0.27, 0.003, z], [x + 0.27, 0.003, z], [x + 0.27, 0.003, z + 0.5], [x - 0.27, 0.003, z + 0.5]], (Math.round(z * 3) + (x > 0 ? 1 : 0)) % 2 ? 'rgb(176,166,146)' : 'rgb(164,152,132)');
    const fi = FRONT.filter(o => o.z - C.z > NEAR + 0.05).sort((a, b) => b.z - a.z);
    for (const o of fi) { if (o.z - C.z < 0.75) { ctx.globalAlpha = 0.8; } o.t === 'bush' ? drawBush(o) : drawFlower(o); ctx.globalAlpha = 1; }
    for (const b of BFLY) if (!b.inside && b.home[2] < 14) drawButterfly(b);
  }
  post();
}
function pendantAndMagic(info) {
  const t = TT;
  // golden motes stream from Samar toward the table and become the pendant
  const target = P(PEND[0], PEND[1], PEND[2]);
  if (t > T.dis0 - 0.2 && t < T.pend1 + 2.5) {
    ctx.globalCompositeOperation = 'lighter';
    for (const s of SPARKS) {
      const yN = s.v; s.tb = T.dis0 + (0.15 + 0.62 * yN) * (T.dis1 - T.dis0) + (s.w - 0.5) * 0.5;
      const u = (t - s.tb) / s.dur; if (u < 0 || u > 1) continue;
      const lx = lerp(-0.14, 0.12, s.u) + (yN < 0.25 ? 0.03 : 0), ly = lerp(1.4, 0.5, yN);
      const sp = P(0.66 - lx * 0.94, ly, 11.04);
      const e = ease(u), cx = (sp.x + target.x) / 2 + s.sw * 70, cy = Math.min(sp.y, target.y) - 60 - s.w * 80;
      const x = (1 - e) * (1 - e) * sp.x + 2 * (1 - e) * e * cx + e * e * target.x + Math.sin(t * 3 + s.ph) * 4 * (1 - e);
      const y = (1 - e) * (1 - e) * sp.y + 2 * (1 - e) * e * cy + e * e * target.y;
      const a = Math.sin(Math.PI * u);
      if (s.petal) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(244,150,170,${a * 0.9})`; ctx.beginPath(); ctx.ellipse(x, y, s.size * 1.6, s.size * 0.8, t * 2 + s.ph, 0, 6.283); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; }
      else sprite('gold', x, y, s.size * 3, a * 0.9);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  // pendant: forms on the table, then follows Rami's fingers
  const form = ss(T.pend0, T.pend1, t);
  if (form > 0 && t < T.pocketIn + 0.15) {
    let x = target.x, y = target.y, k = target.k, mode = 'table';
    if (t > T.grab && info) { const u = ss(T.grab, T.grab + 0.35, t); x = lerp(target.x, info.fingers[0], u); y = lerp(target.y, info.fingers[1] + 0.012 * k, u); mode = u > 0.5 ? 'hang' : 'table'; }
    if (t > T.pocket0 && info) { const u = ss(T.pocket0 + 0.9, T.pocketIn, t); x = lerp(x, info.pocket[0], u); y = lerp(y, info.pocket[1], u); }
    const a = form * (1 - ss(T.pocketIn - 0.25, T.pocketIn + 0.1, t));
    if (form < 1) { ctx.globalCompositeOperation = 'lighter'; sprite('gold', x, y, (0.08 + 0.1 * form) * k, (1 - form) * 0.9 + 0.2); ctx.globalCompositeOperation = 'source-over'; }
    if (t > T.grab + 0.17) drawPendant(x, y, k, mode, a);
    else { ctx.save(); ctx.globalAlpha = 0.35 * form; ctx.translate(x, y + 0.006 * k); ctx.scale(1, 0.25); sprite('shadow', 0, 0, 0.06 * k, 0.5); ctx.restore(); drawPendant(x, y, k, mode, a); }
  }
  // warm red glow through the pocket after he places it there
  if (t > T.pocketIn - 0.2 && info) { ctx.globalCompositeOperation = 'lighter'; const gl = ss(T.pocketIn - 0.2, T.pocketIn + 0.3, t) * (1 - ss(T.stand0, T.stand1 + 1, t) * 0.75); sprite('red', info.pocket[0], info.pocket[1], (0.07 + 0.03 * hbPulse(t)) * target.k, gl * 0.7); ctx.globalCompositeOperation = 'source-over'; }
  if (t > T.stand0 && !info) { /* walking: glow follows the body pass */ }
  // the blooming wave: flash and a ring of light spreading across the floor
  if (t > T.wave - 0.3 && t < T.wave + 4) {
    ctx.globalCompositeOperation = 'lighter';
    const fl = Math.exp(-Math.pow((t - T.wave) / 0.45, 2)); sprite('gold', target.x, target.y, (0.4 + 1.2 * seg(t, T.wave - 0.3, T.wave + 0.6)) * target.k, fl * 0.85);
    const R = Math.max(0.01, (t - T.wave) * WAVE_V), fa = (1 - seg(t, T.wave, T.wave + 4)) * 0.5;
    if (t > T.wave) { const pts = []; for (let i = 0; i < 48; i++) { const a = i / 48 * 6.283; pts.push([PEND[0] + Math.cos(a) * R, 0.01, PEND[2] + Math.sin(a) * R]); } if (poly3(pts)) { ctx.strokeStyle = `rgba(255,226,160,${fa})`; ctx.lineWidth = 10; ctx.stroke(); ctx.strokeStyle = `rgba(255,250,230,${fa})`; ctx.lineWidth = 3; ctx.stroke(); } }
    ctx.globalCompositeOperation = 'source-over';
  }
}
function drawPetals() {
  if (TT < T.wave) return;
  for (const p of PETALS) {
    const u = TT - p.t0; if (u < 0) continue;
    const r = p.spd * (1 - Math.exp(-u * 1.1)) / 1.1;
    let y = PEND[1] + p.dir[1] * r * 1.2 - 0.12 * u * u * 0.5 - 0.08 * u; const land = y < 0.005; if (land) y = 0.005;
    const x = PEND[0] + p.dir[0] * r + Math.sin(u * 2 + p.ph) * 0.05 * (land ? 0 : 1), z = PEND[2] + p.dir[2] * r;
    const q = P(x, y, z); if (q.d < 0.4) continue;
    ctx.fillStyle = rgba(p.col, 0.92); ctx.beginPath(); ctx.ellipse(q.x, q.y, p.s * q.k, p.s * q.k * (land ? 0.3 : 0.55 + 0.4 * Math.sin(u * 5 + p.ph)), p.ph + (land ? 0 : u * 2), 0, 6.283); ctx.fill();
  }
}
function post() {
  const c = mainCtx; c.setTransform(1, 0, 0, 1, 0, 0);
  // bloom from a small, blurred copy of the highlights
  SMc.setTransform(1, 0, 0, 1, 0, 0); SMc.filter = 'none'; SMc.globalCompositeOperation = 'copy'; SMc.drawImage(cv, 0, 0, SM.width, SM.height);
  SMc.globalCompositeOperation = 'source-over'; SMc.filter = `brightness(0.9) contrast(2.2) blur(${3 * Math.max(0.5, S)}px)`; SMc.drawImage(SM, 0, 0); SMc.filter = 'none';
  c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.32; c.drawImage(SM, 0, 0, cv.width, cv.height); c.globalAlpha = 1;
  // gentle warm grade and vignette
  c.globalCompositeOperation = 'soft-light'; c.fillStyle = `rgba(255,214,170,${0.25 + 0.1 * ss(T.wave, T.wave + 5, TT)})`; c.fillRect(0, 0, cv.width, cv.height);
  c.globalCompositeOperation = 'source-over';
  const v = c.createRadialGradient(cv.width / 2, cv.height * 0.48, cv.width * 0.35, cv.width / 2, cv.height * 0.48, cv.height * 0.62);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(8,6,4,0.55)'); c.fillStyle = v; c.fillRect(0, 0, cv.width, cv.height);
  // film grain (deterministic offset per frame)
  const fr = Math.round(TT * FPS), ox = (fr * 73) % 256, oy = (fr * 151) % 256;
  c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.07; c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.translate(-ox, -oy); c.fillRect(ox, oy, cv.width, cv.height); c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  // fade in from black / gentle fade out
  const fade = Math.max(1 - seg(TT, 0, 1.2), ss(DUR - 1.4, DUR, TT));
  if (fade > 0) { c.fillStyle = `rgba(0,0,0,${fade})`; c.fillRect(0, 0, cv.width, cv.height); }
}
window.setup = setup; window.renderFrame = renderFrame;
