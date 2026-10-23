/*
 * "Pip's Little Paper World" — the whole film as a pure function of time.
 * Scene.build() creates the layered SVG once; Scene.render(t) poses every
 * element for time t (seconds), so preview and frame-by-frame render match.
 */
(function (root) {
  'use strict';
  const P = root.Paper, TL = root.TIMELINE, Pip = root.Pip;
  const { el, paper, blob, ridge, leaf, star, crPath, tf, T, R, S, f, kf, E, prog, clamp, lerp, pulse, rng } = P;
  const W = 1920, H = 1080, GROUND = TL.GROUND, FX = TL.FLOWER_X;

  const PAL = {
    cream: '#F4EADB', ivory: '#FBF6EE', sand: '#E7D4B9', far1: '#EBDDC9', far2: '#E2CFB5',
    mid1: '#D3D9BF', mid2: '#C4CDAB', hillL: '#BCC8A3', hill: '#AFBD96', hillR: '#9FAF88',
    meadow: '#B8C49E', meadow2: '#AEBB94', band: '#A2B189', fore: '#91A27B', bush1: '#9AAB83', bush2: '#8C9E76', bush3: '#A7B68F',
    stem: '#8BA172', stemLight: '#A9BB8F', leaf: '#9DB282', soil: '#C2967A', soilDark: '#8E6551',
    petal1: '#EBA893', petal2: '#F1BEA8', petal3: '#F7D8C8', center: '#D3866A', dots: '#EBC58D',
    water: '#CFDDD9', shadow: '#5E4532',
  };

  let svg, L = {};

  /* ---------- small utilities ---------- */

  // Smooth interpolation through keyframes with monotone cubic tangents
  function smooth(t, keys, idx) {
    const n = keys.length;
    if (t <= keys[0][0]) return keys[0][idx];
    if (t >= keys[n - 1][0]) return keys[n - 1][idx];
    let i = 0;
    while (t > keys[i + 1][0]) i++;
    const x0 = keys[i][0], x1 = keys[i + 1][0], y0 = keys[i][idx], y1 = keys[i + 1][idx], h = x1 - x0;
    const slope = (a, b) => (keys[b][idx] - keys[a][idx]) / (keys[b][0] - keys[a][0]);
    const tan = (k) => {
      if (k === 0 || k === n - 1) return 0;
      const s0 = slope(k - 1, k), s1 = slope(k, k + 1);
      return s0 * s1 <= 0 ? 0 : (2 * s0 * s1) / (s0 + s1);
    };
    const m0 = tan(i) * h, m1 = tan(i + 1) * h, u = (t - x0) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * m1;
  }

  function bez(p0, p1, p2, p3, u) {
    const v = 1 - u;
    return [
      v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
      v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
    ];
  }

  function rotP(p, deg) {
    const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
  }

  function show(e, on) {
    e.setAttribute('display', on ? 'inline' : 'none');
  }

  /* ---------- defs: textures, gradients, soft paper shadows ---------- */

  function defs() {
    const d = el('defs', null, svg);
    const pat = (id, size, seed, strength) => {
      const p = el('pattern', { id, patternUnits: 'userSpaceOnUse', width: size, height: size }, d);
      el('image', { href: P.grainTexture(size, seed, strength), width: size, height: size }, p);
    };
    pat('grain', 256, 5, 1);
    pat('grainScreen', 512, 9, 0.55);

    const lin = (id, stops, attrs) => {
      const g = el('linearGradient', Object.assign({ id, x1: 0, y1: 0, x2: 0, y2: 1 }, attrs), d);
      stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a === undefined ? 1 : a }, g));
    };
    const rad = (id, stops, attrs) => {
      const g = el('radialGradient', Object.assign({ id }, attrs), d);
      stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a === undefined ? 1 : a }, g));
    };
    lin('sky', [[0, '#F1DFCC'], [0.55, '#F6E9DA'], [1, '#F9F1E5']]);
    lin('skyWarm', [[0, '#EFC6AE'], [0.6, '#F5DCC8'], [1, '#F9EBDD']]);
    lin('meadowG', [[0, PAL.meadow], [1, '#A6B48B']]);
    lin('stemG', [[0, PAL.stemLight], [1, PAL.stem]], { x1: 0, y1: 0, x2: 1, y2: 0 });
    rad('pipBody', [[0, '#FFF9EE'], [0.62, '#F7EBD6'], [1, '#EAD7BB']], { cx: 0.4, cy: 0.36, r: 0.72 });
    rad('contact', [[0, PAL.shadow, 0.32], [0.6, PAL.shadow, 0.14], [1, PAL.shadow, 0]]);
    rad('sunGlow', [[0, '#F6D7C0', 0.85], [0.55, '#F6DCC8', 0.35], [1, '#F6DCC8', 0]]);
    rad('vignette', [[0.55, '#6B4A35', 0], [1, '#6B4A35', 0.2]], { cx: 0.5, cy: 0.5, r: 0.75 });
    rad('light', [[0, '#FFFDF7', 0.32], [1, '#FFFDF7', 0]], { cx: 0.22, cy: 0.05, r: 0.8 });

    const shadowF = (id, dy, sd, op) => {
      const fl = el('filter', { id, x: '-10%', y: '-10%', width: '120%', height: '130%', 'color-interpolation-filters': 'sRGB' }, d);
      el('feDropShadow', { dx: 0, dy, stdDeviation: sd, 'flood-color': PAL.shadow, 'flood-opacity': op }, fl);
    };
    shadowF('liftFar', 3, 4, 0.1);
    shadowF('liftMid', 4, 6, 0.14);
    shadowF('lift', 6, 7, 0.19);
    shadowF('liftNear', 9, 12, 0.24);
    shadowF('pipSoft', 3, 3.5, 0.16);
    shadowF('small', 3, 3, 0.17);
    shadowF('iris', 6, 12, 0.3);
    return d;
  }

  /* ---------- builders ---------- */

  function cloudPath(w, h, seed) {
    const r = rng(seed), circles = [];
    const n = 4 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, rr = h * (0.45 + r() * 0.35) * (1 - Math.abs(u - 0.5) * 0.8);
      circles.push([(u - 0.5) * w * 0.82, -rr * 0.6, rr]);
    }
    const top = [], bot = [], x0 = -w / 2, x1 = w / 2;
    for (let x = x0; x <= x1; x += 6) {
      let yt = Infinity;
      for (const [cx, cy, cr] of circles) if (Math.abs(x - cx) < cr) yt = Math.min(yt, cy - Math.sqrt(cr * cr - (x - cx) * (x - cx)));
      if (yt < 0) top.push([x, yt]);
    }
    const a = top[0][0], b = top[top.length - 1][0];
    for (let x = b; x >= a; x -= 12) {
      const e = 1 - Math.pow(Math.abs((x - (a + b) / 2) / ((b - a) / 2)), 6);
      bot.push([x, -6 + 10 * (1 - e) * -1 + 4]);
    }
    return crPath(top.concat(bot), true);
  }

  function scallop(r, n, depth, seed) {
    const w = P.wobbler(seed, 0.015), pts = [];
    for (let i = 0; i < n * 6; i++) {
      const th = (i / (n * 6)) * P.TAU;
      const k = r * (1 - depth + depth * Math.pow(Math.abs(Math.cos((th * n) / 2)), 0.6)) * (1 + w(th));
      pts.push([Math.cos(th) * k, Math.sin(th) * k]);
    }
    return crPath(pts, true);
  }

  function layer(id, p, filter) {
    const cam = el('g', { id }, svg);
    const intro = el('g', null, cam);
    const content = el('g', filter ? { filter: 'url(#' + filter + ')' } : null, intro);
    L[id] = { cam, intro, content, p };
    return content;
  }

  function buildSky() {
    L.sky = el('g', null, svg);
    el('rect', { width: W, height: H, fill: PAL.cream }, L.sky);
    L.skyMain = el('rect', { width: W, height: H, fill: 'url(#sky)' }, L.sky);
    L.skyWarm = el('rect', { width: W, height: H, fill: 'url(#skyWarm)', opacity: 0 }, L.sky);
    el('rect', { width: W, height: H, fill: 'url(#grainScreen)', opacity: 0.8 }, L.sky);
  }

  function buildSun() {
    const g = layer('sun', 0.08);
    L.sunG = el('g', null, g);
    el('circle', { cx: 0, cy: 0, r: 190, fill: 'url(#sunGlow)' }, L.sunG);
    const inner = el('g', { filter: 'url(#liftFar)' }, L.sunG);
    L.sunRing = paper(inner, scallop(106, 16, 0.12, 61), '#F2D3BB');
    paper(inner, blob(0, 0, 76, 76, { seed: 62, wob: 0.01, n: 48 }), '#ECB597');
    paper(inner, blob(-12, -12, 46, 46, { seed: 63, wob: 0.015 }), '#F0C3A7', { edge: false });
  }

  function buildClouds() {
    const g = layer('clouds', 0.18, 'liftFar');
    L.cloudList = [[-80, 240, 300, 120, 71, 6], [760, 170, 380, 140, 72, -5], [1700, 300, 260, 100, 73, 7], [2500, 200, 340, 130, 74, -4]].map(
      ([x, y, w, h, seed, v]) => {
        const c = el('g', null, g);
        paper(c, cloudPath(w, h, seed), PAL.ivory, { edgeColor: 'rgba(255,255,255,0.9)' });
        return { c, x, y, v };
      },
    );
  }

  function buildFar() {
    const g = layer('far', 0.3, 'liftFar');
    paper(g, ridge((x) => 645 + 38 * Math.sin(x / 260) + 24 * Math.sin(x / 123 + 1), -500, 3800, 1600, { seed: 81, step: 50 }), PAL.far1);
    paper(g, ridge((x) => 705 + 32 * Math.sin(x / 210 + 2) + 18 * Math.sin(x / 97), -500, 3800, 1600, { seed: 82, step: 50 }), PAL.far2);
  }

  function buildMid() {
    const g = layer('mid', 0.55, 'liftMid');
    const y1 = (x) => 740 + 30 * Math.sin(x / 300) + 18 * Math.sin(x / 140 + 0.5);
    paper(g, ridge(y1, -500, 3800, 1600, { seed: 91, step: 40 }), PAL.mid1);
    const trees = el('g', null, g);
    [[-120, 0.9], [380, 1.1], [980, 0.85], [1290, 1.05], [2980, 1.1], [3350, 0.9]].forEach(([x, s], i) => {
      const t = el('g', { transform: T(x, y1(x) + 12) + S(s) }, trees);
      paper(t, 'M-3.5,0 L-2.5,-46 L2.5,-46 L3.5,0 Z', '#CDB18F', { grain: false });
      paper(t, blob(0, -64, 26, 30, { seed: 100 + i, wob: 0.04, egg: -0.08 }), i % 2 ? '#B7C49E' : '#ADBC95');
    });
    paper(g, ridge((x) => 782 + 22 * Math.sin(x / 240 + 1.3) + 12 * Math.sin(x / 90), -500, 3800, 1600, { seed: 92, step: 40 }), PAL.mid2);
  }

  function buildHill(g) {
    const hill = el('g', { filter: 'url(#lift)' }, g);
    L.hill = hill;
    const d = ridge((x) => TL.hillY(x) - 8, -600, 1260, 850, { seed: 111, step: 20, jit: 1.2 });
    const clip = el('clipPath', { id: 'hillClip' }, svg.querySelector('defs'));
    el('path', { d }, clip);
    paper(hill, d, PAL.hill);
    const facets = el('g', { 'clip-path': 'url(#hillClip)' }, hill);
    el('path', { d: 'M-200,400 L560,400 L560,630 L448,860 L-200,860 Z', fill: PAL.hillL, opacity: 0.9 }, facets);
    el('path', { d: 'M560,400 L1400,400 L1400,860 L706,860 L560,630 Z', fill: PAL.hillR, opacity: 0.9 }, facets);
    el('path', { d: 'M560,630 L448,860 M560,630 L706,860', fill: 'none', stroke: 'rgba(255,250,238,0.45)', 'stroke-width': 1.6 }, facets);
    el('path', { d, fill: 'url(#grain)' }, facets);
  }

  function stemD(h, bend) {
    return 'M0,0 Q' + f(bend) + ',' + f(-h * 0.5) + ' ' + f(bend * 0.35) + ',' + f(-h);
  }

  function gardenItem(parent, it) {
    const r = rng(it.seed), g = el('g', null, parent), h = it.h;
    const inner = el('g', { transform: S(it.s) }, g);
    const bend = (r() - 0.5) * 14;
    const top = [bend * 0.35, -h];
    const stem = () => {
      el('path', { d: stemD(h, bend), fill: 'none', stroke: PAL.stem, 'stroke-width': 4.2, 'stroke-linecap': 'round' }, inner);
      if (r() < 0.7) {
        const lg = el('g', { transform: T(bend * 0.25, -h * (0.3 + r() * 0.2)) + R(r() < 0.5 ? -55 : 55) }, inner);
        paper(lg, leaf(20 + r() * 10, 7), PAL.leaf, { grain: false, edgeW: 1 });
      }
    };
    if (it.type === 'daisy') {
      stem();
      const hd = el('g', { transform: T(top[0], top[1]) }, inner);
      for (let i = 0; i < 9; i++) paper(hd, blob(0, -9, 4.4, 8.6, { seed: it.seed + i, wob: 0.03 }), '#FBF3E6', { grain: false, edgeW: 0.8, attrs: { transform: R(i * 40) } });
      paper(hd, blob(0, 0, 5.4, 5.4, { seed: it.seed + 20 }), '#E3B57E', { grain: false, edgeW: 0.8 });
    } else if (it.type === 'tulip') {
      stem();
      const c = ['#E39C83', '#DA8A6E', '#EDB3A0'][Math.floor(r() * 3)];
      paper(inner, 'M-12,-4 C-15,-20 -9,-27 -6,-29 L-2,-20 L0,-31 L2,-20 L6,-29 C9,-27 15,-20 12,-4 C8,4 -8,4 -12,-4 Z', c,
        { attrs: { transform: T(top[0], top[1] + 4) }, edgeW: 1 });
    } else if (it.type === 'pompom') {
      stem();
      const c = ['#E8B4A8', '#F0C9B4', '#DDA08F'][Math.floor(r() * 3)];
      const hd = el('g', { transform: T(top[0], top[1] - 6) }, inner);
      paper(hd, scallop(14, 9, 0.18, it.seed), c, { edgeW: 1 });
      el('circle', { cx: -3, cy: -3, r: 5, fill: 'rgba(255,248,238,0.35)' }, hd);
    } else if (it.type === 'sprig') {
      stem();
      const c = r() < 0.5 ? '#E8D2A4' : '#DCC1C6';
      for (let i = 0; i < 4; i++) {
        const u = 1 - i * 0.16, side = i % 2 ? 1 : -1;
        paper(inner, blob(bend * 0.35 * u + side * 6, -h * u, 5.2 - i * 0.6, 5.6 - i * 0.6, { seed: it.seed + i }), c, { grain: false, edgeW: 0.8 });
      }
    } else if (it.type === 'tuft') {
      const n = 4 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const a = -40 + (80 * i) / (n - 1) + (r() - 0.5) * 10;
        paper(inner, leaf(h * (0.7 + r() * 0.4), 5 + r() * 2, { bend: a * 0.12 }), i % 2 ? '#98AC80' : '#A8BA8E',
          { grain: false, edgeW: 0.8, attrs: { transform: R(a) } });
      }
    } else if (it.type === 'mushroom') {
      paper(inner, 'M-6,0 C-7,-12 -5,-' + f(h * 0.6) + ' 0,-' + f(h * 0.6) + ' C5,-' + f(h * 0.6) + ' 7,-12 6,0 Z', '#F6ECDC', { edgeW: 1 });
      const cy = -h * 0.58;
      paper(inner, 'M-18,' + f(cy) + ' C-18,' + f(cy - 22) + ' 18,' + f(cy - 22) + ' 18,' + f(cy) + ' C10,' + f(cy + 3) + ' -10,' + f(cy + 3) + ' -18,' + f(cy) + ' Z', '#D18A6E', { edgeW: 1.2 });
      [[-8, -9, 3], [5, -13, 2.4], [10, -6, 2]].forEach(([x, y, rr]) => el('circle', { cx: x, cy: cy + y, r: rr, fill: '#F7E9D6' }, inner));
    }
    return g;
  }

  function buildFlower(g) {
    const fl = el('g', null, g);
    const sway = el('g', null, fl);
    const stemDark = el('path', { fill: 'none', stroke: PAL.stem, 'stroke-width': 10, 'stroke-linecap': 'round' }, sway);
    const stemLight = el('path', { fill: 'none', stroke: PAL.stemLight, 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: 0.9 }, sway);
    const mkLeaf = (len, wid, bend, seed, mirror) => {
      const a = el('g', null, sway);
      const s = el('g', mirror ? { transform: 'scale(-1,1)' } : null, a);
      paper(s, leaf(len, wid, { bend }), PAL.leaf, { edgeW: 1.2 });
      el('path', { d: 'M0,-2 Q' + f(bend * 0.6) + ',' + f(-len * 0.5) + ' ' + f(bend) + ',' + f(-len * 0.92), fill: 'none', stroke: 'rgba(232,240,220,0.7)', 'stroke-width': 1.3 }, s);
      return a;
    };
    const cotL = mkLeaf(18, 8, 2, 201, false), cotR = mkLeaf(18, 8, 2, 202, true);
    const leaf1 = mkLeaf(50, 16, 5, 203, false), leaf2 = mkLeaf(44, 14, 4, 204, true);
    const head = el('g', null, sway);
    const bud = el('g', null, head);
    paper(bud, 'M0,-34 C10,-26 15,-12 13,-2 C11,6 -11,6 -13,-2 C-15,-12 -10,-26 0,-34 Z', '#A6B98C', { edgeW: 1.2 });
    const blush = paper(bud, 'M0,-34 C8,-27 11,-20 10,-14 C4,-17 -4,-17 -10,-14 C-11,-20 -8,-27 0,-34 Z', PAL.petal1, { edgeW: 1 });
    const petals = [], inner = [];
    const pg = el('g', { filter: 'url(#small)' }, head);
    for (let i = 0; i < 7; i++) {
      const p = el('g', null, pg);
      paper(p, blob(0, -30, 17, 30, { seed: 210 + i, wob: 0.03, egg: -0.12 }), i % 2 ? PAL.petal2 : PAL.petal1, { edgeW: 1.4 });
      petals.push(p);
    }
    for (let i = 0; i < 7; i++) {
      const p = el('g', null, pg);
      paper(p, blob(0, -18, 10.5, 19, { seed: 230 + i, wob: 0.03, egg: -0.1 }), PAL.petal3, { edgeW: 1.1 });
      inner.push(p);
    }
    const center = el('g', null, head);
    paper(center, blob(0, 0, 15, 15, { seed: 250, wob: 0.03 }), PAL.center, { edgeW: 1.2 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * P.TAU;
      el('circle', { cx: Math.cos(a) * 9, cy: Math.sin(a) * 9, r: 2.1, fill: PAL.dots }, center);
    }
    el('circle', { cx: -4, cy: -5, r: 4, fill: 'rgba(255,240,225,0.35)' }, center);
    Object.assign(L, { flower: fl, fSway: sway, stemDark, stemLight, cotL, cotR, leaf1, leaf2, head, bud, blush, petals, inner, center });
  }

  function butterfly(parent, c1, c2) {
    const g = el('g', null, parent);
    const body = el('g', { filter: 'url(#small)' }, g);
    const wing = (mirror) => {
      const w = el('g', null, body);
      const m = el('g', mirror ? { transform: 'scale(-1,1)' } : null, w);
      paper(m, blob(-13, -7, 13, 10.5, { seed: 300, rot: -0.5, wob: 0.03 }), c1, { grain: false, edgeW: 1 });
      paper(m, blob(-9, 7, 8.5, 7.5, { seed: 301, rot: 0.4, wob: 0.03 }), c1, { grain: false, edgeW: 1 });
      el('circle', { cx: -15, cy: -8, r: 3.2, fill: c2 }, m);
      el('circle', { cx: -9, cy: 8, r: 2.2, fill: c2 }, m);
      return w;
    };
    const wl = wing(false), wr = wing(true);
    el('ellipse', { cx: 0, cy: 0, rx: 2.6, ry: 11, fill: '#6E5244' }, body);
    el('path', { d: 'M-1,-10 Q-5,-18 -7,-19 M1,-10 Q5,-18 7,-19', fill: 'none', stroke: '#6E5244', 'stroke-width': 1.2, 'stroke-linecap': 'round' }, body);
    return { g, wl, wr };
  }

  function buildMain() {
    const g = layer('main', 1);
    L.meadowG = el('g', null, g);
    buildHill(L.meadowG);
    L.backGarden = el('g', { filter: 'url(#small)' }, L.meadowG);
    paper(L.meadowG, ridge((x) => 824 + 3 * Math.sin(x / 70), -300, 3800, 1500, { seed: 121, step: 30, jit: 1.5 }), 'url(#meadowG)', { attrs: { filter: 'url(#lift)' } });
    paper(L.meadowG, ridge((x) => 885 + 5 * Math.sin(x / 110 + 1), -300, 3800, 1500, { seed: 122, step: 40, jit: 2 }), PAL.meadow2, { attrs: { filter: 'url(#liftMid)' }, grain: 0.7 });
    L.ground = el('g', null, L.meadowG); // story props live here, above the meadow
    L.frontGarden = el('g', { filter: 'url(#small)' }, L.meadowG);
    paper(L.meadowG, ridge((x) => 954 + 5 * Math.sin(x / 90 + 2), -300, 3800, 1500, { seed: 123, step: 30, jit: 2 }), PAL.band, { attrs: { filter: 'url(#lift)' } });

    L.garden = TL.GARDEN.map((it) => {
      const parent = it.row === 'back' ? L.backGarden : L.frontGarden;
      return { it, g: gardenItem(parent, it), y: it.row === 'back' ? GROUND : 960 };
    });

    const gr = L.ground;
    L.hole = el('g', null, gr);
    el('ellipse', { cx: 0, cy: 0, rx: 24, ry: 8, fill: PAL.soilDark }, L.hole);
    el('ellipse', { cx: 0, cy: 1.5, rx: 18, ry: 5, fill: '#76523F' }, L.hole);
    L.seedFly = el('g', null, gr);
    Pip.seedShape(L.seedFly);
    buildFlower(gr);
    L.hump = el('g', null, gr);
    const humpD = 'M-30,2 C-27,-13 -10,-17 0,-17 C11,-17 27,-12 30,2 Z';
    paper(L.hump, humpD, PAL.soil, { attrs: { filter: 'url(#small)' }, edgeW: 1.3 });
    L.wet = el('path', { d: humpD, fill: '#93664F', opacity: 0 }, L.hump);
    L.seedGround = el('g', { transform: T(TL.SEED_X, GROUND - 3) + R(18) }, gr);
    Pip.seedShape(L.seedGround);

    L.pip = Pip.build(gr);

    L.drops = TL.DROPS.map(() => {
      const d = el('g', null, gr);
      el('path', { d: 'M0,-7 C3,-2 4.5,1 4.5,3 C4.5,6 2.5,7.5 0,7.5 C-2.5,7.5 -4.5,6 -4.5,3 C-4.5,1 -3,-2 0,-7 Z', fill: PAL.water, stroke: 'rgba(255,255,255,0.7)', 'stroke-width': 1 }, d);
      el('circle', { cx: -1.4, cy: 2.6, r: 1.3, fill: '#FFFFFF', opacity: 0.8 }, d);
      const sp = el('g', null, gr);
      el('ellipse', { cx: 0, cy: 0, rx: 9, ry: 2.6, fill: 'none', stroke: PAL.water, 'stroke-width': 1.6 }, sp);
      el('circle', { cx: -7, cy: -6, r: 1.8, fill: PAL.water }, sp);
      el('circle', { cx: 7, cy: -7, r: 1.5, fill: PAL.water }, sp);
      return { d, sp };
    });

    const spark = (n) => Array.from({ length: n }, () => {
      const s = el('g', null, gr);
      el('path', { d: star(9), fill: '#F7E2AE', stroke: 'rgba(255,252,240,0.9)', 'stroke-width': 1 }, s);
      return s;
    });
    L.glint = spark(1)[0];
    L.burst1 = spark(6);
    L.burst2 = spark(9);

    L.b1 = butterfly(gr, '#EDB49C', '#F8E6D2');
    L.b2 = butterfly(gr, '#F6E8D2', '#DE9C82');

    L.motes = Array.from({ length: 16 }, () => el('circle', { r: 2.2, fill: '#FFF8EA', opacity: 0 }, gr));
  }

  function buildFore() {
    const g = layer('fore', 1.35, 'liftNear');
    L.bush = el('g', null, g);
    [[0, -40, 220, 190, PAL.bush2], [-170, 40, 170, 150, PAL.bush1], [170, 30, 180, 160, PAL.bush1], [-60, 80, 200, 140, PAL.bush3], [90, 110, 190, 120, PAL.bush2]].forEach(
      ([x, y, rx, ry, c], i) => paper(L.bush, blob(x, y, rx, ry, { seed: 400 + i, wob: 0.05, n: 48 }), c),
    );
    tf(L.bush, T(1480, 760) + S(0.72));
    const grass = (x) => 1032 + 14 * Math.sin(x / 33) * Math.sin(x / 151) + 6 * Math.sin(x / 13);
    paper(g, ridge(grass, -600, 4400, 1700, { seed: 131, step: 14, jit: 2 }), PAL.fore);
  }

  function buildOverlay() {
    L.overlay = el('g', null, svg);
    el('rect', { width: W, height: H, fill: 'url(#light)' }, L.overlay);
    el('rect', { width: W, height: H, fill: 'url(#vignette)' }, L.overlay);
    el('rect', { width: W, height: H, fill: 'url(#grainScreen)', opacity: 0.45 }, L.overlay);
    L.iris = el('g', null, svg);
    L.irisSand = el('path', { fill: PAL.sand, 'fill-rule': 'evenodd', filter: 'url(#iris)' }, L.iris);
    L.irisSandG = el('path', { fill: 'url(#grain)', 'fill-rule': 'evenodd' }, L.iris);
    L.irisCream = el('path', { fill: '#F3E8D8', 'fill-rule': 'evenodd', filter: 'url(#iris)' }, L.iris);
    L.irisCreamG = el('path', { fill: 'url(#grain)', 'fill-rule': 'evenodd' }, L.iris);
  }

  function build(target) {
    svg = el('svg', { xmlns: P.NS, viewBox: '0 0 ' + W + ' ' + H, width: W, height: H }, null);
    target.appendChild(svg);
    defs();
    buildSky();
    buildSun();
    buildClouds();
    buildFar();
    buildMid();
    buildMain();
    buildFore();
    buildOverlay();
    return svg;
  }

  /* ---------- Pip's performance ---------- */

  const SQ = [[0, 1], [3.42, 1], [3.62, 0.86, E.out], [3.84, 1.16, E.out], [4.04, 1.15], [4.2, 0.95], [4.36, 1.02], [4.5, 1],
    [8.22, 1], [8.4, 0.9], [8.62, 0.92], [8.78, 1.06], [8.92, 1],
    [10.3, 1], [10.5, 0.94], [10.8, 0.96], [10.95, 1],
    [11.4, 1], [11.5, 0.9, E.out], [11.64, 1], [11.8, 1], [11.9, 0.9, E.out], [12.04, 1],
    [13.08, 1], [13.18, 0.9, E.out], [13.32, 1.02], [13.42, 1],
    [17.0, 1], [18.6, 1.04], [19.3, 1.04], [19.45, 1],
    [23.75, 1], [23.92, 1.06], [24.15, 0.85, E.out], [24.32, 0.91], [27, 0.9]];
  const ROT = [[0, -7], [2.9, -7], [3.3, 0], [8.22, 0], [8.42, 16], [8.62, 16], [8.86, 0], [9.84, 0], [10.1, 6], [10.32, 6], [10.55, 13], [10.8, 13],
    [11.0, 5], [11.38, 6], [11.48, 17, E.out], [11.6, 9], [11.82, 9], [11.9, 17, E.out], [12.04, 6], [12.12, 0],
    [13.3, 0], [13.55, -3], [15.0, -3], [15.3, 0], [17.0, 0], [18.6, -6], [19.35, -6], [19.45, 0], [24.0, 0], [24.4, 5], [27, 5]];
  const ARMR = [[0, -10], [3.62, -10], [3.86, -165], [4.04, -165], [4.3, -14], [8.22, -14], [8.45, -38], [8.65, -38], [8.95, -172], [9.6, -172],
    [9.9, -150], [10.35, -140], [10.62, -70], [10.85, -55], [11.05, -25], [11.4, -30], [11.5, -52], [11.62, -35], [11.82, -35], [11.9, -52],
    [12.04, -30], [12.18, -14], [12.85, -14], [13.02, -112, E.out], [13.3, -112], [13.55, -150], [15.3, -150], [15.6, -14],
    [19.42, -14], [19.6, -165, E.out], [19.95, -160], [20.2, -14], [24.3, -14], [24.7, -60], [27, -60]];
  const ARML = [[0, 10], [3.62, 10], [3.86, 165], [4.04, 165], [4.3, 14], [9.0, 14], [9.08, 70], [9.32, 70], [9.45, 14],
    [13.4, 14], [13.6, 28], [15.2, 28], [15.5, 14], [19.42, 14], [19.6, 165, E.out], [19.95, 160], [20.2, 14], [27, 14]];
  const LOOKX = [[0, 0], [4.3, 0], [4.44, -6], [4.58, -6], [4.74, 6], [8.22, 6], [8.32, 7], [8.7, 4], [9.0, 0], [9.4, 0], [9.55, 5], [12.1, 5],
    [12.2, 0], [12.45, 0], [12.6, 5], [15.6, 5], [16.0, 4], [19.0, 2], [19.4, 0], [21.0, 0], [21.2, -6], [21.6, -6], [21.9, 6], [22.4, 6],
    [22.7, 3], [24.0, 3], [24.4, 1], [27, 1]];
  const LOOKY = [[0, 0], [8.22, 0], [8.32, 5], [8.62, 5], [8.8, -5], [9.35, -5], [9.5, 0], [9.85, 3], [12.1, 3], [12.2, 0], [13.4, 0], [13.6, 4],
    [15.2, 4], [15.6, 2], [16.2, 0], [17.2, -4], [18.6, -6], [19.4, -5], [19.6, 0], [21.9, -2], [22.2, -6], [22.6, -3], [23.0, 0], [24.6, -1], [27, -1]];
  const EYESCALE = [[0, 1], [8.22, 1], [8.32, 1.25, E.out], [8.6, 1.15], [8.75, 1], [18.9, 1], [19.05, 1.28, E.out], [19.4, 1.2], [19.5, 1]];
  const MOUTH = [[0, 0], [3.66, 0], [3.8, 1], [4.0, 1], [4.12, 0], [8.95, 0], [9.05, 0.8], [9.35, 0.8], [9.45, 0], [19.42, 0], [19.55, 1], [20.0, 1], [20.15, 0]];
  const HAPPY = [[3.74, 4.06], [9.02, 9.38], [12.14, 12.45], [14.1, 14.85], [19.62, 20.42], [24.55, 25.7], [26.05, 99]];
  const BLINKS = [3.3, 5.9, 7.1, 10.9, 12.9, 16.3, 17.9, 21.45, 23.55, 25.85];

  function hopMotion(t) {
    const o = { x: TL.HOPS[0].x0, off: 0, air: 0, sx: 1, sy: 1, rot: 0, airN: 0 };
    for (const h of TL.HOPS) {
      if (t >= h.t0 + h.d) { o.x = h.x1; continue; }
      if (t < h.t0) break;
      const u = (t - h.t0) / h.d, dir = Math.sign(h.x1 - h.x0);
      if (u < 0.22) {
        const q = Math.sin(((u / 0.22) * Math.PI) / 2);
        o.sy = 1 - 0.16 * q; o.sx = 1 + 0.11 * q; o.x = h.x0; o.rot = -dir * 3 * q;
      } else if (u < 0.82) {
        const v = (u - 0.22) / 0.6, st = Math.abs(Math.cos(Math.PI * v));
        o.x = lerp(h.x0, h.x1, v);
        o.air = h.h * 4 * v * (1 - v);
        o.sy = 1 + 0.13 * st; o.sx = 1 - 0.08 * st;
        o.rot = dir * (5 - 10 * v);
        o.airN = Math.sin(Math.PI * v);
        o.off = lerp(TL.hillY(h.x0), TL.hillY(h.x1), v) - TL.hillY(o.x);
      } else {
        const q = Math.sin(((u - 0.82) / 0.18) * Math.PI);
        o.sy = 1 - 0.17 * q; o.sx = 1 + 0.12 * q; o.x = h.x1; o.rot = dir * 1.5 * q;
      }
      break;
    }
    return o;
  }

  function pipState(t) {
    const h = hopMotion(t);
    const s = {
      x: h.x, floorOff: h.off, air: h.air, rot: h.rot + kf(t, ROT), sx: h.sx, sy: h.sy,
      appear: t < 1.35 ? 0.001 : Math.max(0.001, E.back(prog(t, 1.35, 1.85))),
      lookX: kf(t, LOOKX), lookY: kf(t, LOOKY), eyeScale: kf(t, EYESCALE), mouthOpen: kf(t, MOUTH),
      armL: kf(t, ARML), armR: kf(t, ARMR), footL: h.airN * 3, footR: h.airN * 3, footSpread: 0,
      cheek: 0.72, blink: 0, eyes: 'open', seed: t >= 8.65 && t < 10.42, can: t >= 12.85 && t < 15.8,
      canRot: 0, canDy: 0, canArm: 0,
    };
    const sq = kf(t, SQ);
    s.sy *= sq; s.sx *= 1 + (1 - sq) * 0.75;
    const br = t < 2.9 ? 0.03 * Math.sin(t * 2.2) : t > 24.3 ? 0.016 * Math.sin(t * 2.0) : 0.01 * Math.sin(t * 2.7);
    s.sy *= 1 + br; s.sx *= 1 - br * 0.6;
    if (!s.seed && !s.can) { s.armL += h.airN * 35; s.armR -= h.airN * 35; }
    if (t < 2.9) s.eyes = 'sleep';
    else if (HAPPY.some(([a, b]) => t >= a && t < b)) s.eyes = 'happy';
    s.blink = Math.max(t >= 2.9 && t < 3.06 ? 1 - prog(t, 2.9, 3.06) : 0, pulse(t, BLINKS, 0.08));
    if (s.eyes === 'happy') s.cheek = 0.95;
    if (t > 24.0) {
      const k = E.inOut(prog(t, 23.95, 24.25));
      s.footSpread = 7 * k; s.footL += 2 * k; s.footR += 2 * k; s.floorOff += 2 * k;
      s.rot += 1.6 * Math.sin((t - 24) * 1.5) * k;
      s.cheek = lerp(s.cheek, 1, k);
    }
    if (s.can) {
      s.canArm = kf(Math.min(t, 15.3), ARMR);
      s.canDy = kf(t, [[12.85, -560], [13.1, 0, E.inQuad], [13.18, -10, E.out], [13.26, 0, E.inQuad], [15.3, 0], [15.8, -760, E.in]]);
      s.canRot = kf(t, [[13.3, 0], [13.62, 40], [14.95, 40], [15.22, 0]]) + (t > 13.62 && t < 14.95 ? 2.5 * Math.sin(t * 15) : 0);
    }
    return s;
  }

  /* ---------- the flower ---------- */

  function flowerState(t) {
    const G = TL.GROW;
    const boil = t > 15.6 && t < 19.8;
    const ts = boil ? Math.floor(t * G.step) / G.step : t;
    const r = rng(Math.floor(t * G.step) * 7 + 3);
    const stemH = ts < G.stem[0] ? 26 * E.out(prog(ts, G.sprout[0], G.sprout[1])) : lerp(26, 230, E.out(prog(ts, G.stem[0], G.stem[1])));
    return {
      ts, stemH,
      bulge: kf(ts, [[G.bulge[0], 0], [G.bulge[0] + 0.2, 1, E.out], [G.bulge[1], 0.3]]),
      cot: E.back(prog(ts, G.cotyledon[0], G.cotyledon[1])),
      leaf1: E.back(prog(ts, G.leaf1[0], G.leaf1[1])), leaf2: E.back(prog(ts, G.leaf2[0], G.leaf2[1])),
      bud: E.back(prog(ts, G.bud[0], G.bud[1])) * (1 - E.inQuad(prog(ts, G.petals + 0.1, G.petals + 0.5))),
      swell: prog(ts, G.swell[0], G.swell[1]),
      petal: (i) => E.back(prog(ts, G.petals + i * 0.07, G.petals + i * 0.07 + 0.26)),
      inner: (i) => E.back(prog(ts, G.inner + i * 0.05, G.inner + i * 0.05 + 0.24)),
      center: E.back(prog(ts, G.center[0], G.center[1])),
      boilR: boil ? (r() - 0.5) * 1.8 : 0, boilS: boil ? 1 + (r() - 0.5) * 0.03 : 1,
      sway: (t > 19.6 ? 2.2 * Math.sin((t - 19.6) * 1.5) * Math.min(1, t - 19.6) : 0) + kf(t, [[24.4, 0], [25.4, -5]]),
    };
  }

  function stemGeom(h) {
    const b = 12 * (h / 230);
    const p = [[0, 0], [b * 0.9, -h * 0.35], [-b * 0.7, -h * 0.7], [b * 0.3, -h]];
    return { p, at: (u) => bez(p[0], p[1], p[2], p[3], u) };
  }

  function flowerHeadWorld(fs) {
    const g = stemGeom(fs.stemH);
    const tp = rotP(g.p[3], fs.sway + fs.boilR);
    return [FX + tp[0], GROUND + tp[1]];
  }

  function renderFlower(t) {
    const fs = flowerState(t);
    const on = t >= TL.GROW.sprout[0];
    show(L.flower, on);
    if (!on) return fs;
    tf(L.flower, T(FX, GROUND - 2));
    tf(L.fSway, R(fs.sway + fs.boilR) + S(fs.boilS));
    const g = stemGeom(fs.stemH), p = g.p;
    const d = 'M0,0C' + f(p[1][0]) + ',' + f(p[1][1]) + ' ' + f(p[2][0]) + ',' + f(p[2][1]) + ' ' + f(p[3][0]) + ',' + f(p[3][1]);
    L.stemDark.setAttribute('d', d);
    L.stemLight.setAttribute('d', d);
    L.stemLight.setAttribute('transform', T(-2, 0));
    L.stemLight.setAttribute('opacity', fs.stemH > 30 ? 0.9 : 0);
    const cu = Math.min(1, 20 / Math.max(fs.stemH, 1));
    const cp = g.at(cu);
    tf(L.cotL, T(cp[0], cp[1]) + R(-58) + S(fs.cot * 0.9));
    tf(L.cotR, T(cp[0], cp[1]) + R(58) + S(fs.cot * 0.9));
    const l1 = g.at(0.4), l2 = g.at(0.6);
    tf(L.leaf1, T(l1[0], l1[1]) + R(-64 + (1 - fs.leaf1) * 40) + S(fs.leaf1));
    tf(L.leaf2, T(l2[0], l2[1]) + R(60 - (1 - fs.leaf2) * 40) + S(fs.leaf2));
    const hd = p[3];
    tf(L.head, T(hd[0], hd[1]) + R(-fs.sway * 0.6));
    const wob = fs.swell > 0 && fs.swell < 1 ? Math.sin(fs.ts * 40) * 7 : 0;
    tf(L.bud, R(wob) + S(fs.bud * (1 + 0.25 * fs.swell)));
    show(L.bud, fs.bud > 0.01);
    L.blush.setAttribute('opacity', f(fs.swell));
    L.petals.forEach((pe, i) => {
      const k = fs.petal(i);
      show(pe, k > 0.01);
      tf(pe, R((i * 360) / 7 + 8 - (1 - k) * 30) + S(Math.max(0.001, k)));
    });
    L.inner.forEach((pe, i) => {
      const k = fs.inner(i);
      show(pe, k > 0.01);
      tf(pe, R((i * 360) / 7 + 34 - (1 - k) * 30) + S(Math.max(0.001, k)));
    });
    show(L.center, fs.center > 0.01);
    tf(L.center, S(Math.max(0.001, fs.center)) + R(t * 8));
    return fs;
  }

  /* ---------- camera ---------- */

  const CAM = [
    [0, 700, 600, 1.25], [4.6, 600, 612, 1.55], [5.0, 615, 614, 1.55], [8.3, 1990, 722, 1.6], [9.3, 2010, 732, 1.75],
    [12.4, 2015, 745, 2.0], [15.4, 2010, 740, 2.0], [18.9, 2030, 680, 1.65], [20.0, 2030, 680, 1.6],
    [22.6, 2010, 640, 1.2], [27.0, 2020, 690, 1.45],
  ];
  function camera(t) {
    return {
      x: smooth(t, CAM, 1) + 3 * Math.sin(t * 0.7),
      y: smooth(t, CAM, 2) + 2 * Math.sin(t * 0.9 + 1),
      z: smooth(t, CAM, 3),
    };
  }
  function layerTf(p, c) {
    const s = 1 + (c.z - 1) * p;
    return T(W / 2, H / 2) + S(s) + T(-(960 + (c.x - 960) * p), -(540 + (c.y - 540) * p));
  }
  function toScreen(p, c, x, y) {
    const s = 1 + (c.z - 1) * p;
    return [W / 2 + (x - (960 + (c.x - 960) * p)) * s, H / 2 + (y - (540 + (c.y - 540) * p)) * s];
  }

  /* ---------- effects ---------- */

  function sparkleBurst(arr, t, t0, cx, cy, radius) {
    arr.forEach((s, i) => {
      const u = prog(t, t0 + i * 0.02, t0 + 0.75 + i * 0.02);
      show(s, u > 0 && u < 1);
      if (u <= 0 || u >= 1) return;
      const a = (i / arr.length) * P.TAU + 0.4, d = radius * E.out(u);
      const k = Math.sin(Math.PI * u) * (0.7 + 0.3 * ((i * 7) % 3) / 2);
      tf(s, T(cx + Math.cos(a) * d, cy + Math.sin(a) * d) + R(u * 140) + S(Math.max(0.001, k)));
    });
  }

  function spline(t, pts) {
    let i = 0;
    while (i < pts.length - 2 && t > pts[i + 1][0]) i++;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const u = clamp((t - p1[0]) / (p2[0] - p1[0])), u2 = u * u, u3 = u2 * u;
    const c = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3);
    return [c(1), c(2)];
  }

  function renderButterfly(b, t, pts, landAt, headPos) {
    const on = t >= pts[0][0] && t <= pts[pts.length - 1][0] + 0.001 + (landAt ? 99 : 0);
    show(b.g, on);
    if (!on) return;
    let [x, y] = spline(Math.min(t, pts[pts.length - 1][0]), pts);
    const ahead = spline(Math.min(t + 0.05, pts[pts.length - 1][0]), pts);
    let tilt = clamp((ahead[0] - x) * 1.2, -18, 18), flap = Math.abs(Math.cos(t * 16));
    y += 5 * Math.sin(t * 7);
    if (landAt) {
      const k = E.inOut(prog(t, landAt - 0.5, landAt));
      x = lerp(x, headPos[0] + 4, k);
      y = lerp(y, headPos[1] - 22, k);
      tilt = lerp(tilt, 8, k);
      if (t > landAt) flap = 0.55 + 0.45 * Math.abs(Math.cos((t - landAt) * 2.4));
    }
    const k = 0.18 + 0.82 * flap;
    tf(b.g, T(x, y) + R(tilt) + S(1.1));
    tf(b.wl, S(k, 1));
    tf(b.wr, S(k, 1));
  }

  function irisD(cx, cy, r, seed) {
    return 'M-20,-20H1940V1100H-20Z' + blob(cx, cy, r, r, { seed, wob: 0.006, n: 64 });
  }

  /* ---------- render ---------- */

  function render(t) {
    t = clamp(t, 0, TL.DURATION);
    const cam = camera(t);
    for (const id of ['sun', 'clouds', 'far', 'mid', 'main', 'fore']) tf(L[id].cam, layerTf(L[id].p, cam));

    // opening: the paper world assembles itself
    L.skyMain.setAttribute('opacity', f(E.sine(prog(t, 0, 0.6))));
    L.skyWarm.setAttribute('opacity', f(kf(t, [[19.8, 0], [23, 0.8]])));
    tf(L.far.intro, T(0, (1 - E.backSoft(prog(t, 0.05, 1.0))) * 430));
    tf(L.mid.intro, T(0, (1 - E.backSoft(prog(t, 0.25, 1.2))) * 400));
    tf(L.meadowG, T(0, (1 - E.backSoft(prog(t, 0.4, 1.2))) * 360));
    const unfold = Math.max(0.001, E.back(prog(t, 0.5, 1.35)));
    tf(L.hill, T(0, 832) + S(1, unfold) + T(0, -832));
    const fo = E.backSoft(prog(t, 0.75, 1.55));
    tf(L.fore.intro, T(0, (1 - fo) * 520));
    tf(L.bush, T(1480 + (1 - fo) * 420, 760) + S(0.72));
    const sun = E.back(prog(t, 0.9, 1.5));
    tf(L.sunG, T(1420, 262 + Math.sin(t * 0.6) * 4) + S(Math.max(0.001, sun)) + R((1 - sun) * -40));
    tf(L.sunRing, R(t * 6));
    L.cloudList.forEach((c, i) => {
      const u = E.out(prog(t, 0.6 + i * 0.12, 1.6 + i * 0.12));
      tf(c.c, T(c.x + (1 - u) * (i % 2 ? 420 : -420) + t * c.v, c.y));
      c.c.setAttribute('opacity', f(u));
    });

    // Pip
    const s = pipState(t);
    Pip.update(L.pip, s, TL.hillY(s.x));

    // seed: found, held, planted
    show(L.seedGround, t < 8.65);
    const gl = t > 7.2 && t < 8.65;
    show(L.glint, gl);
    if (gl) tf(L.glint, T(TL.SEED_X + 8, GROUND - 18) + R(t * 90) + S(0.55 + 0.35 * Math.abs(Math.sin(t * 5))));
    if (t > 9.0 && t < 10.0) {
      const hp = Pip.handWorld(s, TL.hillY(s.x), 'R', s.armR);
      sparkleBurst(L.burst1, t, 9.1, hp[0], hp[1], 46);
    } else L.burst1.forEach((b) => show(b, false));
    const hp = kf(t, [[9.85, 0], [10.2, 1, E.back]]);
    show(L.hole, hp > 0.01);
    tf(L.hole, T(FX, GROUND - 1) + S(Math.max(0.001, hp)));
    const fly = t >= 10.42 && t < 11.3;
    show(L.seedFly, fly);
    if (fly) {
      const s0 = pipState(10.42), a = Pip.handWorld(s0, TL.hillY(s0.x), 'R', s0.armR);
      const u = prog(t, 10.42, 10.8), bounce = t > 10.8 ? 5 * Math.sin(prog(t, 10.8, 10.98) * Math.PI) : 0;
      tf(L.seedFly, T(lerp(a[0], FX, u), lerp(a[1], GROUND - 2, u * u) - 26 * Math.sin(Math.PI * u) - bounce) + R(u * 300));
    }

    // soil mound: pops up, is pushed over the seed, gets patted and watered
    const fs0 = flowerState(t);
    const mp = E.back(prog(t, 9.95, 10.25));
    show(L.hump, mp > 0.01);
    const cover = E.inOut(prog(t, 11.0, 11.35));
    const pat = 1 - 0.22 * (pulse(t, [11.52], 0.08) + pulse(t, [11.92], 0.08));
    const hx = lerp(FX + 40, FX, cover), hsx = lerp(0.62, 1, cover), hsy = lerp(1.25, 0.82, cover) * pat * (1 + 0.35 * fs0.bulge);
    tf(L.hump, T(hx, GROUND + 1) + S(Math.max(0.001, mp * hsx), Math.max(0.001, mp * hsy)));
    L.wet.setAttribute('opacity', f(kf(t, [[13.8, 0], [15.0, 0.55], [20, 0.25]])));

    // watering can droplets
    L.drops.forEach((dr, i) => {
      const D = TL.DROPS[i], ps = pipState(D.t), tip = Pip.canTip(ps, TL.hillY(ps.x));
      const ang = ((ps.canRot + ps.rot) * Math.PI) / 180;
      const vx = Math.cos(ang) * 110 + D.spread * 30, vy = Math.sin(ang) * 110, g = 1500, yL = GROUND - 3;
      const tl = (-vy + Math.sqrt(vy * vy + 2 * g * Math.max(1, yL - tip[1]))) / g;
      const dt = t - D.t, alive = dt > 0 && dt < tl;
      show(dr.d, alive);
      if (alive) {
        const vyy = vy + g * dt;
        tf(dr.d, T(tip[0] + vx * dt, tip[1] + vy * dt + 0.5 * g * dt * dt) + R((Math.atan2(vx, vyy) * -180) / Math.PI) + S(D.size));
      }
      const su = (dt - tl) / 0.3, sp = su > 0 && su < 1;
      show(dr.sp, sp);
      if (sp) {
        tf(dr.sp, T(tip[0] + vx * tl, yL) + S(0.5 + su * 0.8 * D.size));
        dr.sp.setAttribute('opacity', f(1 - su));
      }
    });

    // the flower and its bloom
    const fs = renderFlower(t);
    const head = flowerHeadWorld(fs);
    sparkleBurst(L.burst2, t, 19.45, head[0], head[1], 80);

    // the garden ripples into being
    L.garden.forEach(({ it, g, y }) => {
      const p = prog(t, it.pop, it.pop + 0.5);
      show(g, p > 0);
      if (p <= 0) return;
      const k = E.back(p), dir = it.x < FX ? -1 : 1;
      tf(g, T(it.x, y + (1 - k) * (it.h * it.s + 30)) + R((1 - k) * 12 * dir + 1.6 * Math.sin(t * 1.4 + it.x * 0.01) * Math.min(1, p * 2)));
    });

    renderButterfly(L.b1, t, [[20.7, 2760, 520], [21.4, 2450, 620], [22.0, 2150, 600], [22.5, 1995, 650], [23.1, 2120, 560], [23.8, 2250, 610], [24.4, 2140, 540], [25.0, 2075, 560]], 25.0, head);
    renderButterfly(L.b2, t, [[21.1, 1180, 610], [21.9, 1450, 520], [22.7, 1700, 600], [23.6, 1880, 470], [24.5, 2400, 420], [25.6, 2800, 300], [26.6, 3250, 180]]);

    L.motes.forEach((m, i) => {
      const r = rng(500 + i), st = 22.4 + r() * 3.2, x0 = 1820 + r() * 480, life = 2.6 + r() * 1.5;
      const u = (t - st) / life;
      if (u <= 0 || u >= 1) { m.setAttribute('opacity', 0); return; }
      m.setAttribute('cx', f(x0 + 14 * Math.sin(t * 1.3 + i)));
      m.setAttribute('cy', f(820 - u * 190));
      m.setAttribute('opacity', f(Math.sin(Math.PI * u) * 0.8));
    });

    // closing: a layered paper vignette frames Pip and the flower
    const ir = kf(t, [[25.3, 1300], [26.45, 440, E.inOut]]);
    const ic = toScreen(1, cam, 2030, 700);
    const on = ir < 1290;
    show(L.iris, on);
    if (on) {
      const dS = irisD(ic[0], ic[1], ir, 601), dC = irisD(ic[0], ic[1], ir + 16, 602);
      L.irisSand.setAttribute('d', dS);
      L.irisSandG.setAttribute('d', dS);
      L.irisCream.setAttribute('d', dC);
      L.irisCreamG.setAttribute('d', dC);
    }
  }

  root.Scene = { build, render, duration: TL.DURATION, fps: TL.FPS, _pipState: pipState, _camera: camera, _toScreen: toScreen };
})(this);
