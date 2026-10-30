import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {clamp} from '../anim';
import {C, H, W} from '../theme';

/** Islamic 8-point star lattice (khatam), drawn in with a stroke animation. */
export const GeoPattern: React.FC<{
  opacity?: number;
  color?: string;
  size?: number;
  draw?: number; // 0..1 draw-in progress
  drift?: number; // px of parallax drift over the scene
  id: string;
}> = ({opacity = 0.18, color = C.gold, size = 150, draw = 1, drift = 0, id}) => {
  const frame = useCurrentFrame();
  const s = size;
  const h = s / 2;
  const r = s * 0.36;
  const sq = (rot: number) => {
    const pts = [0, 1, 2, 3].map((k) => {
      const a = ((rot + k * 90) * Math.PI) / 180;
      return `${h + r * Math.cos(a)},${h + r * Math.sin(a)}`;
    });
    return pts.join(' ');
  };
  const dash = 900;
  return (
    <AbsoluteFill style={{opacity, transform: `translateY(${-drift * (frame / 300)}px)`}}>
      <svg width={W} height={H + 400} style={{position: 'absolute', top: -200}}>
        <defs>
          <pattern id={id} width={s} height={s} patternUnits="userSpaceOnUse">
            <g
              fill="none"
              stroke={color}
              strokeWidth={1.4}
              strokeDasharray={dash}
              strokeDashoffset={dash * (1 - draw)}
            >
              <polygon points={sq(0)} />
              <polygon points={sq(45)} />
              <circle cx={h} cy={h} r={r * 0.42} />
              <line x1={0} y1={0} x2={h - r * 0.72} y2={h - r * 0.72} />
              <line x1={s} y1={0} x2={h + r * 0.72} y2={h - r * 0.72} />
              <line x1={0} y1={s} x2={h - r * 0.72} y2={h + r * 0.72} />
              <line x1={s} y1={s} x2={h + r * 0.72} y2={h + r * 0.72} />
            </g>
          </pattern>
          <radialGradient id={`${id}-fade`} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id={`${id}-mask`}>
            <rect width="100%" height="100%" fill={`url(#${id}-fade)`} />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} mask={`url(#${id}-mask)`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Floating gold dust; deterministic so every render is identical. */
export const GoldDust: React.FC<{count?: number; seed?: string; opacity?: number; speed?: number}> = ({
  count = 70,
  seed = 'dust',
  opacity = 1,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
      {new Array(count).fill(0).map((_, i) => {
        const x = random(`${seed}x${i}`) * W;
        const y0 = random(`${seed}y${i}`) * H;
        const sz = 2 + random(`${seed}s${i}`) * 5;
        const v = (0.3 + random(`${seed}v${i}`) * 0.9) * speed;
        const y = ((y0 - frame * v) % H + H) % H;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame / (14 + i % 9) + i));
        const sway = Math.sin(frame / 40 + i) * 14;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + sway,
              top: y,
              width: sz,
              height: sz,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #FFF6DA 0%, #E3BE72 45%, rgba(200,163,90,0) 75%)',
              opacity: tw,
              boxShadow: `0 0 ${sz * 3}px rgba(255,220,150,0.55)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Soft warm studio background shared by the light scenes. */
export const WarmBackground: React.FC<{glow?: number; children?: React.ReactNode}> = ({
  glow = 1,
  children,
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 90% 60% at 50% 42%, rgba(255,240,205,${0.95 * glow}) 0%, ${C.beige} 45%, ${C.beige2} 100%)`,
    }}
  >
    {children}
  </AbsoluteFill>
);

/** Thin animated gold strokes used as the transition between scenes. */
export const GoldSweep: React.FC<{start: number; dur?: number; lines?: number}> = ({
  start,
  dur = 26,
  lines = 9,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={W} height={H}>
        <defs>
          <linearGradient id="sweepg" x1="0" x2="1">
            <stop offset="0" stopColor="#FFF1CF" stopOpacity="0" />
            <stop offset="0.5" stopColor="#E9C982" />
            <stop offset="1" stopColor="#B88A3E" stopOpacity="0" />
          </linearGradient>
        </defs>
        {new Array(lines).fill(0).map((_, i) => {
          const s = start + i * 2;
          const t = interpolate(frame, [s, s + dur], [0, 1], clamp);
          const len = 2600;
          const y = 300 + i * 150;
          const d = `M -200 ${y + 500} C 300 ${y + 200}, 700 ${y - 300}, 1300 ${y - 700}`;
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="url(#sweepg)"
              strokeWidth={i % 3 === 0 ? 3 : 1.4}
              strokeDasharray={`${len * 0.35} ${len}`}
              strokeDashoffset={interpolate(t, [0, 1], [len * 0.35, -len])}
              opacity={Math.sin(t * Math.PI)}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Rotating light rays (used behind the Kaaba and the gift box). */
export const LightRays: React.FC<{opacity?: number; size?: number; speed?: number; color?: string}> = ({
  opacity = 0.5,
  size = 1600,
  speed = 0.12,
  color = 'rgba(255,226,160,0.55)',
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '50%',
        opacity,
        transform: `rotate(${frame * speed}deg)`,
        background: `repeating-conic-gradient(from 0deg, ${color} 0deg 4deg, rgba(255,255,255,0) 4deg 15deg)`,
        maskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,0.6) 30%, transparent 68%)',
        WebkitMaskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,0.6) 30%, transparent 68%)',
      }}
    />
  );
};

export const fadeIn = (frame: number, dur = 14) => interpolate(frame, [0, dur], [0, 1], clamp);
