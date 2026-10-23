/*
 * Shared story timeline for "Pip's Little Paper World".
 * Loaded by the browser scene (window.TIMELINE) and by the Node audio
 * generator (module.exports), so picture and sound cues never drift apart.
 */
(function (root) {
  'use strict';

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const DURATION = 27;
  const FPS = 30;
  const GROUND = 838; // Pip's floor on the meadow (world units)
  const FLOWER_X = 2060; // where the seed is planted
  const SEED_X = 2072; // where the seed lies before Pip finds it

  // Folded paper hill Pip sleeps on. Returns Pip's floor height at x.
  function hillY(x) {
    const peak = 560, top = 640;
    const w = x < peak ? 430 : 600;
    const u = (x - peak) / w;
    if (Math.abs(u) >= 1) return GROUND;
    const c = Math.cos((u * Math.PI) / 2);
    return GROUND - (GROUND - top) * c * c;
  }

  // Every hop / jump Pip makes: [x0, x1, duration, height, startTime?]
  const plan = [
    // the journey from the hill to the seed
    [560, 720, 0.5, 46, 4.75], [720, 880, 0.42, 40], [880, 1040, 0.42, 38],
    [1040, 1220, 0.42, 40], [1220, 1440, 0.42, 48], [1440, 1660, 0.42, 48],
    [1660, 1860, 0.42, 44], [1860, 2005, 0.42, 34],
    // joy jump holding the seed, then a small step back to plant it
    [2005, 2005, 0.38, 24, 9.0], [2005, 1988, 0.34, 12, 9.42],
    // happy bounce after planting, then a hop to the watering spot
    [1988, 1988, 0.3, 10, 12.12], [1988, 1938, 0.36, 16, 12.46],
    // the flower blooms: a big jump and two little bounces
    [1938, 1938, 0.56, 46, 19.45], [1938, 1938, 0.3, 12, 20.12], [1938, 1938, 0.28, 8, 20.46],
    // two little steps to sit beside the flower
    [1938, 1972, 0.32, 10, 22.95], [1972, 2000, 0.32, 9, 23.35],
  ];
  const HOPS = [];
  let t = 0;
  for (const [x0, x1, d, h, start] of plan) {
    if (start !== undefined) t = start;
    HOPS.push({ t0: t, d, x0, x1, h, land: t + d * 0.82 });
    t += d;
  }

  // Water droplets leaving the watering can
  const DROPS = [];
  {
    const r = rng(31);
    for (let i = 0; i < 16; i++) {
      DROPS.push({ t: 13.64 + i * 0.082 + r() * 0.03, spread: r() * 2 - 1, size: 0.75 + r() * 0.5 });
    }
  }

  // Garden that pops up around the flower, rippling outward from it
  const GARDEN = [];
  {
    const r = rng(7);
    const types = ['daisy', 'tulip', 'pompom', 'sprig', 'tuft', 'daisy', 'tulip', 'mushroom', 'tuft', 'pompom'];
    for (let x = 1070; x < 2990; x += 46 + r() * 52) {
      if (x > 1900 && x < 2140) continue;
      const type = types[Math.floor(r() * types.length)];
      GARDEN.push({
        row: 'back', x, type, seed: Math.floor(r() * 1e6),
        h: type === 'tuft' ? 26 + r() * 18 : type === 'mushroom' ? 30 + r() * 14 : 52 + r() * 78,
        s: 0.85 + r() * 0.35,
        pop: 20.05 + (Math.abs(x - FLOWER_X) / 1000) * 1.9 + r() * 0.16,
      });
    }
    for (let x = 1050; x < 2990; x += 80 + r() * 90) {
      if (x > 1840 && x < 2200) continue;
      const type = ['tuft', 'daisy', 'mushroom', 'tuft', 'pompom'][Math.floor(r() * 5)];
      GARDEN.push({
        row: 'front', x, type, seed: Math.floor(r() * 1e6),
        h: type === 'tuft' ? 30 + r() * 20 : type === 'mushroom' ? 34 + r() * 12 : 46 + r() * 40,
        s: 1.05 + r() * 0.3,
        pop: 20.25 + (Math.abs(x - FLOWER_X) / 1000) * 1.9 + r() * 0.16,
      });
    }
  }

  // Stop-motion growth of the flower (seconds)
  const GROW = {
    bulge: [15.6, 15.95], sprout: [15.85, 16.45], cotyledon: [16.0, 16.5], stem: [16.4, 17.9],
    leaf1: [16.9, 17.45], leaf2: [17.2, 17.75], bud: [17.6, 18.1], swell: [18.3, 18.85],
    petals: 18.9, inner: 19.15, center: [19.35, 19.6], step: 10, // stop-motion rate (fps)
  };

  // Moments that deserve a sound
  const CUES = {
    rustle: [0.1, 0.3, 0.5, 0.6, 0.8, 1.0, 5.9, 6.4, 15.35, 25.3],
    pop: [0.95, 1.4, 9.95, 12.88, 16.0, 17.6],
    pat: [11.5, 11.9],
    seedPlop: 10.8,
    sparkle: [7.4, 9.1, 19.5],
    catchCan: 13.1,
    cover: 11.05,
    yawn: 3.72,
  };

  const TIMELINE = {
    DURATION, FPS, GROUND, FLOWER_X, SEED_X, HOPS, DROPS, GARDEN, GROW, CUES, hillY, rng,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = TIMELINE;
  else root.TIMELINE = TIMELINE;
})(this);
