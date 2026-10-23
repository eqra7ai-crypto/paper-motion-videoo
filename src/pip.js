/*
 * Pip: a tiny cut-paper character rigged for squash & stretch.
 * Local origin is the point between Pip's feet on the floor.
 */
(function (root) {
  'use strict';
  const { el, paper, blob, leaf, tf, T, R, S, f } = root.Paper;

  const SHOULDER = { L: [-47, -50], R: [47, -50] };
  const ARM_LEN = 27;
  const C = {
    body: 'url(#pipBody)', arm: '#F0E1C8', foot: '#E1C29F', ear: '#E8D6B9',
    ink: '#4A3830', cheek: '#EEA595', mouth: '#9A5E4C',
  };

  function build(parent) {
    const root = el('g', { id: 'pip' }, parent);
    const shadow = el('ellipse', { cx: 0, cy: 2, rx: 46, ry: 7.5, fill: 'url(#contact)' }, root);
    const lift = el('g', null, root); // vertical offset + lean
    const squash = el('g', null, lift);

    const arm = (side) => {
      const g = el('g', { filter: 'url(#pipSoft)' }, squash);
      paper(g, blob(0, 12, 8.6, 16, { seed: side === 'L' ? 21 : 22, wob: 0.03 }), C.arm, { edgeW: 1.2 });
      return g;
    };
    const armL = arm('L'), armR = arm('R');
    const foot = (x, seed) => {
      const g = el('g', null, squash);
      paper(g, blob(0, 0, 15, 8.5, { seed, wob: 0.04 }), C.foot, { edgeW: 1.2 });
      tf(g, T(x, -3));
      return g;
    };
    const footL = foot(-19, 23), footR = foot(19, 24);

    const bodyD = blob(0, -56, 50, 55, { egg: 0.07, wob: 0.012, seed: 11, n: 56 });
    paper(squash, bodyD, C.body, { attrs: { filter: 'url(#pipSoft)' }, edgeW: 2 });
    // signature folded corner on Pip's head
    el('path', { d: 'M10,-108 C20,-107 31,-103 38,-96 C30,-95 22,-97 16,-101 Z', fill: 'rgba(120,90,60,0.16)' }, squash);
    paper(squash, 'M12,-110 C22,-108 31,-104 37,-97 C28,-100 19,-99 12,-110 Z', C.ear, { edgeW: 1 });
    // soft belly light
    el('ellipse', { cx: -10, cy: -74, rx: 22, ry: 16, fill: 'rgba(255,253,247,0.45)' }, squash);
    // arms are layered on top of the body so raised hands always read
    squash.appendChild(armL);
    squash.appendChild(armR);

    const face = el('g', null, squash);
    const cheekL = el('ellipse', { cx: -30, cy: -48, rx: 9, ry: 5.6, fill: C.cheek }, face);
    const cheekR = el('ellipse', { cx: 30, cy: -48, rx: 9, ry: 5.6, fill: C.cheek }, face);
    const eyes = el('g', null, face);
    const eye = (x) => {
      const g = el('g', null, eyes);
      const open = el('g', null, g);
      el('ellipse', { cx: 0, cy: 0, rx: 5.6, ry: 7.6, fill: C.ink }, open);
      el('circle', { cx: 1.8, cy: -2.8, r: 1.9, fill: '#FFF9EE' }, open);
      const sleep = el('path', { d: 'M-6,-1 Q0,4.5 6,-1', fill: 'none', stroke: C.ink, 'stroke-width': 2.6, 'stroke-linecap': 'round' }, g);
      const happy = el('path', { d: 'M-6,2.5 Q0,-5 6,2.5', fill: 'none', stroke: C.ink, 'stroke-width': 2.8, 'stroke-linecap': 'round' }, g);
      return { g, open, sleep, happy, x };
    };
    const eL = eye(-16), eR = eye(16);
    const smile = el('path', { d: 'M-5,0 Q0,4.6 5,0', fill: 'none', stroke: C.ink, 'stroke-width': 2.3, 'stroke-linecap': 'round' }, face);
    const mouthO = el('g', null, face);
    el('ellipse', { cx: 0, cy: 1.5, rx: 4.6, ry: 5, fill: C.mouth }, mouthO);
    el('ellipse', { cx: 0, cy: 4, rx: 2.8, ry: 1.8, fill: '#E99A8A' }, mouthO);

    // things Pip can hold (outside the squash group so they keep their shape)
    const held = el('g', null, lift);
    const seed = el('g', null, held);
    seedShape(seed);
    const can = el('g', null, held);
    canShape(can);

    return { root, shadow, lift, squash, armL, armR, footL, footR, face, eyes, eL, eR, cheekL, cheekR, smile, mouthO, seed, can };
  }

  function seedShape(g) {
    paper(g, 'M-9,0 C-9,-6 -3,-9 0,-9 C5,-9 10,-5 9,0 C8,5 3,7 0,7 C-4,7 -9,4 -9,0 Z', '#B98563', { edgeW: 1 });
    el('path', { d: 'M-5,-1 C-2,-4 3,-4 6,-2', fill: 'none', stroke: 'rgba(255,240,220,0.65)', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g);
  }

  // Watering can; origin is the handle grip
  const CAN_TIP = [65.6, -0.8]; // spout rose, relative to the grip
  function canShape(g) {
    const s = el('g', { transform: 'scale(0.82) translate(-12,13)' }, g);
    el('path', { d: 'M-6,10 C-12,-18 26,-30 34,6', fill: 'none', stroke: '#C9826A', 'stroke-width': 7, 'stroke-linecap': 'round' }, s);
    paper(s, 'M52,30 L86,-12 L94,-6 L60,40 Z', '#CF8C72', { edgeW: 1.2 });
    paper(s, blob(92, -14, 7, 11, { rot: 0.65, seed: 41, wob: 0.02 }), '#C47C63', { edgeW: 1.2 });
    paper(s, 'M-4,14 C-6,4 2,0 14,0 L46,0 C58,0 62,6 61,16 L58,52 C57,60 52,62 44,62 L10,62 C2,62 -2,58 -2,50 Z', '#D9977C', { edgeW: 1.6 });
    paper(s, 'M-3,24 L60,24 L59.3,34 L-2.6,34 Z', '#F4E4CC', { edgeW: 1 });
    el('ellipse', { cx: 16, cy: 46, rx: 8, ry: 5, fill: 'rgba(255,248,236,0.35)' }, s);
  }

  // Hand position in Pip's lift space for an arm angle (deg, SVG clockwise)
  function hand(side, angle, sx, sy) {
    const a = (angle * Math.PI) / 180, sh = SHOULDER[side];
    const x = sh[0] - ARM_LEN * Math.sin(a), y = sh[1] + ARM_LEN * Math.cos(a);
    return [x * sx, y * sy];
  }

  function rot(p, deg) {
    const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
  }

  // Position of the watering can's spout tip in world space
  function canTip(s, floorY) {
    const h = hand('R', s.canArm, s.sx, s.sy);
    const tip = rot(CAN_TIP, s.canRot);
    const local = rot([h[0] + tip[0], h[1] + s.canDy + tip[1]], s.rot);
    return [s.x + local[0], floorY + s.floorOff - s.air + local[1]];
  }

  function handWorld(s, floorY, side, angle) {
    const h = rot(hand(side, angle, s.sx, s.sy), s.rot);
    return [s.x + h[0], floorY + s.floorOff - s.air + h[1]];
  }

  function update(rig, s, floorY) {
    tf(rig.root, T(s.x, floorY) + S(s.appear));
    const airK = Math.max(0, 1 - s.air / 90);
    tf(rig.shadow, S(0.55 + 0.45 * airK * s.sx, 1));
    rig.shadow.setAttribute('opacity', f(0.35 + 0.65 * airK));
    tf(rig.lift, T(0, s.floorOff - s.air) + R(s.rot));
    tf(rig.squash, S(s.sx, s.sy));
    tf(rig.armL, T(SHOULDER.L[0], SHOULDER.L[1]) + R(s.armL));
    tf(rig.armR, T(SHOULDER.R[0], SHOULDER.R[1]) + R(s.armR));
    tf(rig.footL, T(-19 - s.footSpread, -3 - s.footL));
    tf(rig.footR, T(19 + s.footSpread, -3 - s.footR));
    tf(rig.face, T(s.lookX * 0.9, s.lookY * 0.7));
    tf(rig.eyes, T(s.lookX * 0.45, s.lookY * 0.35));
    const open = Math.max(0.06, 1 - s.blink) * s.eyeScale;
    for (const e of [rig.eL, rig.eR]) {
      tf(e.g, T(e.x, -63));
      tf(e.open, S(s.eyeScale, open));
      e.open.setAttribute('opacity', s.eyes === 'open' ? 1 : 0);
      e.sleep.setAttribute('opacity', s.eyes === 'sleep' ? 1 : 0);
      e.happy.setAttribute('opacity', s.eyes === 'happy' ? 1 : 0);
    }
    rig.cheekL.setAttribute('opacity', f(s.cheek));
    rig.cheekR.setAttribute('opacity', f(s.cheek));
    tf(rig.smile, T(0, -50));
    tf(rig.mouthO, T(0, -51) + S(s.mouthOpen, s.mouthOpen));
    rig.smile.setAttribute('opacity', s.mouthOpen > 0.15 ? 0 : 1);
    rig.mouthO.setAttribute('opacity', s.mouthOpen > 0.15 ? 1 : 0);

    rig.seed.setAttribute('display', s.seed ? 'inline' : 'none');
    if (s.seed) {
      const h = hand('R', s.armR, s.sx, s.sy);
      tf(rig.seed, T(h[0], h[1] - 2));
    }
    rig.can.setAttribute('display', s.can ? 'inline' : 'none');
    if (s.can) {
      const h = hand('R', s.canArm, s.sx, s.sy);
      tf(rig.can, T(h[0], h[1] + s.canDy) + R(s.canRot));
    }
  }

  root.Pip = { build, update, hand, canTip, handWorld, seedShape };
})(this);
