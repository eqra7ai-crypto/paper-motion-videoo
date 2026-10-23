#!/usr/bin/env node
/*
 * Procedural soundtrack: a gentle kalimba / music-box lullaby over a soft pad,
 * plus paper rustles, pops, hops and water drops cued from src/timeline.js.
 * Fully deterministic; writes out/soundtrack.wav (44.1 kHz, 16-bit stereo).
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TL = createRequire(import.meta.url)(resolve(ROOT, 'src/timeline.js'));
const SR = 44100, DUR = TL.DURATION, N = Math.ceil(SR * DUR);
const music = [new Float32Array(N), new Float32Array(N)];
const sfx = [new Float32Array(N), new Float32Array(N)];
const rand = TL.rng(2024);

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, Bb: 10, B: 11 };
const hz = (name) => {
  const m = /^([A-G]b?)(\d)$/.exec(name);
  return 440 * Math.pow(2, (NOTE[m[1]] + (Number(m[2]) + 1) * 12 - 69) / 12);
};

function add(bus, t0, len, pan, fn) {
  const s0 = Math.max(0, Math.floor(t0 * SR)), s1 = Math.min(N, Math.floor((t0 + len) * SR));
  const l = Math.cos(((pan + 1) * Math.PI) / 4), r = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = s0; i < s1; i++) {
    const v = fn((i - t0 * SR) / SR);
    bus[0][i] += v * l;
    bus[1][i] += v * r;
  }
}

// Kalimba / music box: soft fundamental, quick overtone, tiny inharmonic tine
function pluck(t0, f, amp, pan = 0, decay = 1.1) {
  add(music, t0, decay * 4, pan, (t) => {
    const a = Math.min(1, t / 0.004);
    return amp * a * (Math.sin(2 * Math.PI * f * t) * Math.exp(-t / decay) +
      0.28 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t / (decay * 0.35)) +
      0.1 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t / 0.06));
  });
}

// Warm pad voice with slow swell and gentle chorus
function pad(t0, len, f, amp) {
  add(music, t0, len + 1.6, 0, (t) => {
    const env = Math.min(1, t / 1.1) * (t > len ? Math.exp(-(t - len) / 0.5) : 1);
    return amp * env * (Math.sin(2 * Math.PI * f * t) + 0.6 * Math.sin(2 * Math.PI * f * 1.003 * t + 1) +
      0.18 * Math.sin(4 * Math.PI * f * t));
  });
}

// Biquad band-pass (RBJ) applied to fresh noise
function bandNoise(len, fc, q, seed) {
  const r = TL.rng(seed), n = Math.floor(len * SR), out = new Float32Array(n);
  const w = (2 * Math.PI * fc) / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al;
  const b0 = al / a0, b2 = -al / a0, a1 = (-2 * Math.cos(w)) / a0, a2 = (1 - al) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    const x = r() * 2 - 1, y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y; out[i] = y;
  }
  return out;
}

// Paper rustle: band-passed noise broken into crinkly grains
function rustle(t0, len, amp, pan) {
  const nz = bandNoise(len, 2600 + rand() * 1800, 0.9, Math.floor(rand() * 1e6));
  const grains = Array.from({ length: Math.floor(len * 40) }, () => [rand() * len, 0.01 + rand() * 0.03, 0.4 + rand() * 0.6]);
  add(sfx, t0, len, pan, (t) => {
    const i = Math.floor(t * SR);
    if (!(i >= 0 && i < nz.length)) return 0;
    let g = 0.25;
    for (const [c, w, a] of grains) g += a * Math.exp(-Math.pow((t - c) / w, 2));
    return amp * nz[i] * g * Math.sin((Math.PI * t) / len);
  });
}

function pop(t0, amp, f0 = 420, pan = 0) {
  add(sfx, t0, 0.18, pan, (t) => amp * Math.sin(2 * Math.PI * (f0 * t - ((f0 * 0.55) * t * t) / 0.16)) * Math.exp(-t / 0.045) * Math.min(1, t / 0.002));
}

function thump(t0, amp, f = 110, pan = 0) {
  const nz = bandNoise(0.12, 500, 0.7, Math.floor(rand() * 1e6));
  add(sfx, t0, 0.12, pan, (t) => amp * (Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.04) + 0.5 * (nz[Math.floor(t * SR)] || 0) * Math.exp(-t / 0.02)));
}

function drip(t0, amp, pan) {
  const f0 = 700 + rand() * 300;
  add(sfx, t0, 0.12, pan, (t) => amp * Math.sin(2 * Math.PI * (f0 * t + 5000 * t * t)) * Math.exp(-t / 0.03) * Math.min(1, t / 0.002));
}

/* ---------- music ---------- */
const BAR = 3; // 80 bpm, 4 beats
const chords = [
  ['F3', 'A3', 'C4'], ['D3', 'F3', 'A3'], ['Bb2', 'D3', 'F3'], ['C3', 'E3', 'G3'],
  ['F3', 'A3', 'C4'], ['D3', 'F3', 'A3'], ['Bb2', 'D3', 'F3'], ['C3', 'E3', 'G3'], ['F3', 'A3', 'C4'],
];
chords.forEach((c, b) => {
  const len = b === chords.length - 1 ? 2.2 : BAR;
  c.forEach((n) => pad(b * BAR, len, hz(n), b === 0 ? 0.018 : 0.026));
  pad(b * BAR, len, hz(c[0]) / 2, 0.02);
  // arpeggio an octave up, sparse before Pip wakes
  const arp = [c[0], c[1], c[2], c[1]].map((n) => hz(n) * 2);
  for (let k = 0; k < 8; k++) {
    const t = b * BAR + k * 0.375;
    if (t > DUR - 1.4) break;
    if (b === 0 && k % 4 !== 0) continue;
    pluck(t, arp[k % 4], 0.07 * (k % 2 ? 0.7 : 1), k % 2 ? 0.35 : -0.35, 0.9);
  }
});
const melody = [
  [], ['A5', null, 'C6', 'A5'], ['F5', null, 'D5', 'F5'], ['E5', 'G5', null, 'C6'],
  ['A5', null, 'G5', 'F5'], ['D5', 'F5', 'A5', null], ['D6', null, 'C6', 'Bb5'], ['G5', null, 'E5', 'G5'], ['F5', null, null, null],
];
melody.forEach((bar, b) => bar.forEach((n, k) => n && pluck(b * BAR + k * 0.75 + 0.02, hz(n), 0.11, 0.1, 1.4)));
// final resolving chime
['F5', 'A5', 'C6', 'F6'].forEach((n, i) => pluck(24.75 + i * 0.12, hz(n), 0.06, -0.3 + i * 0.2, 1.8));
// sparkles and the bloom glissando
const pent = ['F5', 'G5', 'A5', 'C6', 'D6', 'F6', 'G6', 'A6', 'C7'];
TL.CUES.sparkle.forEach((t0) => ['C6', 'F6', 'A6'].forEach((n, i) => pluck(t0 + i * 0.06, hz(n), 0.05, 0.4 - i * 0.3, 0.6)));
pent.forEach((n, i) => pluck(19.25 + i * 0.045, hz(n), 0.055, -0.6 + i * 0.15, 0.9));

// Schroeder reverb on the music bus
function reverb(buf, mix) {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ d, b: new Float32Array(d), i: 0 }));
  const aps = [225, 556].map((d) => ({ d, b: new Float32Array(d), i: 0 }));
  const out = new Float32Array(buf.length);
  for (let n = 0; n < buf.length; n++) {
    let s = 0;
    for (const c of combs) { const y = c.b[c.i]; c.b[c.i] = buf[n] + y * 0.8; c.i = (c.i + 1) % c.d; s += y; }
    s *= 0.25;
    for (const a of aps) { const y = a.b[a.i]; const v = -s + y; a.b[a.i] = s + y * 0.5; a.i = (a.i + 1) % a.d; s = v; }
    out[n] = buf[n] + s * mix;
  }
  return out;
}

/* ---------- sound effects ---------- */
TL.CUES.rustle.forEach((t, i) => rustle(t, t > 25 ? 0.9 : 0.4, 0.09, i % 2 ? 0.4 : -0.4));
TL.CUES.pop.forEach((t) => pop(t, 0.16));
TL.HOPS.forEach((h) => thump(h.land, h.h > 30 ? 0.14 : 0.09, 120, ((h.x1 - 2000) / 1500) * 0.6));
TL.CUES.pat.forEach((t) => thump(t, 0.13, 95));
thump(TL.CUES.seedPlop, 0.08, 180);
pop(TL.CUES.seedPlop, 0.08, 620);
thump(TL.CUES.cover, 0.07, 90);
rustle(TL.CUES.cover, 0.3, 0.05, 0.2);
add(sfx, TL.CUES.yawn, 0.4, 0, (t) => 0.035 * Math.sin(2 * Math.PI * (520 * t - 240 * t * t)) * Math.sin((Math.PI * t) / 0.4));
add(sfx, TL.CUES.catchCan, 0.3, 0.2, (t) => 0.08 * (Math.sin(2 * Math.PI * 330 * t) + 0.5 * Math.sin(2 * Math.PI * 790 * t)) * Math.exp(-t / 0.07));
TL.DROPS.forEach((d, i) => drip(d.t + 0.2 + rand() * 0.05, 0.05, 0.2 + (i % 3) * 0.1));
for (let t = 15.9; t < 19.0; t += 0.2) rustle(t, 0.08, 0.035, 0.15);
TL.GARDEN.forEach((g) => pop(g.pop + 0.08, 0.035, 380 + rand() * 300, Math.max(-0.8, Math.min(0.8, (g.x - 2060) / 900))));
pop(16.05, 0.06, 700);
TL.GARDEN.length && rustle(20.0, 2.2, 0.03, 0);

/* ---------- mix & write ---------- */
const L = reverb(music[0], 0.35), R = reverb(music[1], 0.35);
const out = Buffer.alloc(44 + N * 4);
let peak = 0;
const mixed = [new Float32Array(N), new Float32Array(N)];
for (let i = 0; i < N; i++) {
  const t = i / SR, fade = Math.min(1, t / 0.4) * Math.min(1, (DUR - t) / 1.6);
  mixed[0][i] = (L[i] + sfx[0][i]) * fade;
  mixed[1][i] = (R[i] + sfx[1][i]) * fade;
  peak = Math.max(peak, Math.abs(mixed[0][i]), Math.abs(mixed[1][i]));
}
const gain = 0.7 / peak; // about -3 dBFS
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVE', 8); out.write('fmt ', 12);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  out.writeInt16LE(Math.round(Math.tanh(mixed[0][i] * gain) * 32767), 44 + i * 4);
  out.writeInt16LE(Math.round(Math.tanh(mixed[1][i] * gain) * 32767), 46 + i * 4);
}
mkdirSync(resolve(ROOT, 'out'), { recursive: true });
writeFileSync(resolve(ROOT, 'out/soundtrack.wav'), out);
console.log(`wrote out/soundtrack.wav (${DUR}s, peak normalised from ${peak.toFixed(3)})`);
