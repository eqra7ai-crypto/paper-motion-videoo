import {Easing, interpolate, spring} from 'remotion';
import {FPS} from './theme';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

/** 0 → 1 between frame `start` and `start + dur`, with a premium ease-out. */
export const rise = (frame: number, start: number, dur = 20, ease = easeOut) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: ease});

/** 1 → 0 between frame `start` and `start + dur`. */
export const fall = (frame: number, start: number, dur = 16, ease = easeIn) =>
  interpolate(frame, [start, start + dur], [1, 0], {...clamp, easing: ease});

export const pop = (frame: number, start: number, damping = 14, mass = 0.7) =>
  spring({frame: frame - start, fps: FPS, config: {damping, mass, stiffness: 140}});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
