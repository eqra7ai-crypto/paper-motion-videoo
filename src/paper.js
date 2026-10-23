/*
 * Paper-craft toolkit: easing, keyframes, organic cut-paper paths,
 * SVG element helpers and the procedural paper-fibre texture.
 */
(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;
  const rng = root.TIMELINE.rng;

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const backE = (c1) => (u) => 1 + (c1 + 1) * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
  const E = {
    lin: (u) => u,
    sine: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
    inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    out: (u) => 1 - Math.pow(1 - u, 3),
    in: (u) => u * u * u,
    outQuad: (u) => 1 - (1 - u) * (1 - u),
    inQuad: (u) => u * u,
    back: backE(1.6),
    backSoft: backE(0.9),
    elastic: (u) => (u <= 0 ? 0 : u >= 1 ? 1 : Math.pow(2, -9 * u) * Math.sin((u * 10 - 0.75) * (TAU / 3)) + 1),
  };

  // keys: [[time, value, ease?], ...]; the ease shapes the segment that ends at that key
  function kf(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (t <= k[0]) {
        const p = keys[i - 1];
        return lerp(p[1], k[1], (k[2] || E.inOut)((t - p[0]) / (k[0] - p[0] || 1)));
      }
    }
    return keys[keys.length - 1][1];
  }

  // Short pulse centred on each time in `times`
  const pulse = (t, times, half = 0.08) => times.reduce((m, c) => Math.max(m, 1 - Math.abs(t - c) / half), 0);

  const f = (n) => (Math.round(n * 100) / 100).toString();

  // Catmull-Rom spline through points -> cubic Bezier path
  function crPath(pts, closed) {
    const n = pts.length;
    const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.min(n - 1, Math.max(0, i))]);
    let d = 'M' + f(pts[0][0]) + ',' + f(pts[0][1]);
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ',' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        f(p2[0] - (p3[0] - p1[0]) / 6) + ',' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ',' + f(p2[1]);
    }
    return closed ? d + 'Z' : d;
  }

  // Periodic hand-cut wobble for closed shapes
  function wobbler(seed, amp, k0 = 2, k1 = 7) {
    const r = rng(seed), terms = [];
    for (let k = k0; k <= k1; k++) terms.push([k, ((r() * 2 - 1) * amp) / Math.sqrt(k - k0 + 1), r() * TAU]);
    return (th) => terms.reduce((s, [k, a, p]) => s + a * Math.sin(k * th + p), 0);
  }

  // Non-periodic wobble for open edges (terrain)
  function noise1(seed, amp, scale) {
    const r = rng(seed), terms = [];
    for (let i = 0; i < 5; i++) terms.push([(0.5 + r() * 2.5) / scale, ((r() * 2 - 1) * amp) / (i + 1), r() * TAU]);
    return (x) => terms.reduce((s, [k, a, p]) => s + a * Math.sin(k * x + p), 0);
  }

  // Organic ellipse; egg > 0 widens the bottom
  function blob(cx, cy, rx, ry, o = {}) {
    const n = o.n || 40, w = wobbler(o.seed || 1, o.wob === undefined ? 0.025 : o.wob), egg = o.egg || 0;
    const cr = Math.cos(o.rot || 0), sr = Math.sin(o.rot || 0), pts = [];
    for (let i = 0; i < n; i++) {
      const th = (i / n) * TAU, k = 1 + w(th);
      const x = Math.cos(th) * rx * k * (1 + egg * Math.sin(th)), y = Math.sin(th) * ry * k;
      pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
    }
    return crPath(pts, true);
  }

  // Terrain strip: top edge follows fn(x), filled down to `bottom`
  function ridge(fn, x0, x1, bottom, o = {}) {
    const step = o.step || 40, nz = noise1(o.seed || 3, o.jit === undefined ? 2 : o.jit, 60), pts = [];
    for (let x = x0; x <= x1 + 0.1; x += step) pts.push([x, fn(x) + nz(x)]);
    return crPath(pts, false) + 'L' + f(x1) + ',' + f(bottom) + 'L' + f(x0) + ',' + f(bottom) + 'Z';
  }

  // Leaf pointing up from the origin
  function leaf(len, wid, o = {}) {
    const bend = o.bend || 0;
    return 'M0,0C' + f(wid) + ',' + f(-len * 0.22) + ' ' + f(wid * 0.85 + bend) + ',' + f(-len * 0.78) + ' ' + f(bend) + ',' + f(-len) +
      'C' + f(-wid * 0.85 + bend) + ',' + f(-len * 0.78) + ' ' + f(-wid) + ',' + f(-len * 0.22) + ' 0,0Z';
  }

  // Four-point sparkle
  function star(r) {
    return 'M0,' + f(-r) + 'Q0,0 ' + f(r) + ',0Q0,0 0,' + f(r) + 'Q0,0 ' + f(-r) + ',0Q0,0 0,' + f(-r) + 'Z';
  }

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // One piece of cut paper: colour, fibre texture and a pale cut edge
  function paper(parent, d, fill, o = {}) {
    const g = el('g', o.attrs, parent);
    el('path', { d, fill }, g);
    if (o.grain !== false) el('path', { d, fill: 'url(#grain)', opacity: o.grain || 1 }, g);
    if (o.edge !== false) {
      el('path', {
        d, fill: 'none', stroke: o.edgeColor || 'rgba(255,251,243,0.45)',
        'stroke-width': o.edgeW || 1.6, 'stroke-linejoin': 'round',
      }, g);
    }
    return g;
  }

  const tf = (e, s) => e.setAttribute('transform', s);
  const T = (x, y) => 'translate(' + f(x) + ',' + f(y) + ')';
  const R = (a) => 'rotate(' + f(a) + ')';
  const S = (x, y = x) => 'scale(' + f(x) + ',' + f(y) + ')';

  // Procedural paper fibres: speckles plus short curly fibres, drawn once to a canvas
  function grainTexture(size, seed, strength = 1) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d'), r = rng(seed);
    const img = g.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const v = r();
      const dark = v < 0.5;
      img.data[i * 4] = dark ? 92 : 255;
      img.data[i * 4 + 1] = dark ? 66 : 250;
      img.data[i * 4 + 2] = dark ? 46 : 240;
      img.data[i * 4 + 3] = Math.floor((dark ? 0.5 - v : v - 0.5) * 2 * 26 * strength);
    }
    g.putImageData(img, 0, 0);
    g.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const light = r() < 0.6;
      g.strokeStyle = light ? 'rgba(255,252,244,' + (0.25 + r() * 0.3) * strength + ')' : 'rgba(110,80,55,' + (0.05 + r() * 0.07) * strength + ')';
      g.lineWidth = 0.5 + r() * 0.9;
      let x = r() * size, y = r() * size, a = r() * TAU;
      g.beginPath();
      g.moveTo(x, y);
      const len = 6 + r() * 22;
      for (let s = 0; s < len; s += 2) {
        a += (r() - 0.5) * 0.7;
        x += Math.cos(a) * 2;
        y += Math.sin(a) * 2;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    return c.toDataURL('image/png');
  }

  root.Paper = {
    NS, TAU, clamp, lerp, prog, E, kf, pulse, f, crPath, wobbler, noise1, blob, ridge, leaf, star,
    el, paper, tf, T, R, S, grainTexture, rng,
  };
})(this);
