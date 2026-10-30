import React from 'react';

const KW = 380; // width (x) and depth (z)
const KH = 420; // height (y)

const Ornament: React.FC<{w: number; h: number}> = ({w, h}) => (
  // abstract arabesque band (decorative, no text)
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
    <defs>
      <linearGradient id="kg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE9B5" />
        <stop offset="0.5" stopColor="#D5AE5E" />
        <stop offset="1" stopColor="#8E6A2C" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width={w} height={3} fill="url(#kg)" />
    <rect x="0" y={h - 3} width={w} height={3} fill="url(#kg)" />
    {new Array(Math.ceil(w / 38)).fill(0).map((_, i) => (
      <g key={i} transform={`translate(${i * 38 + 19}, ${h / 2})`} fill="none" stroke="url(#kg)" strokeWidth={2.2}>
        <path d="M-16 0 C-10 -14, 10 -14, 16 0 C10 14, -10 14, -16 0Z" />
        <circle r={4} fill="url(#kg)" />
        <path d="M-19 -10 Q0 -2 19 -10 M-19 10 Q0 2 19 10" strokeWidth={1.2} />
      </g>
    ))}
  </svg>
);

const Face: React.FC<{
  w: number;
  h: number;
  transform: string;
  shade: number; // 0 = lit, 1 = dark
  door?: boolean;
}> = ({w, h, transform, shade, door}) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: w,
      height: h,
      marginLeft: -w / 2,
      marginTop: -h / 2,
      transform,
      backfaceVisibility: 'hidden',
      background: `linear-gradient(180deg, rgba(255,255,255,${0.06 - shade * 0.04}) 0%, rgba(0,0,0,0) 40%),
        repeating-linear-gradient(90deg, #15130F 0px, #1C1914 3px, #111 6px),
        #121010`,
      boxShadow: `inset 0 0 0 9999px rgba(0,0,0,${shade * 0.45})`,
      overflow: 'hidden',
    }}
  >
    {/* hizam (gold belt) */}
    <div style={{position: 'absolute', top: h * 0.2, left: 0, width: w, height: 46}}>
      <Ornament w={w} h={46} />
    </div>
    {/* small gold panels under the belt */}
    {[0.22, 0.5, 0.78].map((p, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          top: h * 0.2 + 64,
          left: w * p - 22,
          width: 44,
          height: 36,
          border: '2px solid rgba(213,174,94,0.85)',
          borderRadius: 3,
          background: 'radial-gradient(circle, rgba(213,174,94,0.5) 0%, rgba(0,0,0,0) 70%)',
        }}
      />
    ))}
    {door && (
      <div
        style={{
          position: 'absolute',
          right: w * 0.12,
          bottom: h * 0.12,
          width: 92,
          height: 170,
          borderRadius: '6px 6px 2px 2px',
          background: 'linear-gradient(135deg,#FFF0C4 0%,#D5AE5E 35%,#8E6A2C 65%,#E9C982 100%)',
          boxShadow: '0 0 30px rgba(255,210,120,0.45)',
          padding: 8,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid rgba(90,60,20,0.6)',
            borderRadius: 4,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(90,60,20,0.35) 0 2px, transparent 2px 22px)',
          }}
        />
      </div>
    )}
    {/* lower kiswa edge (shadharwan) */}
    <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, background: 'linear-gradient(180deg,#3A352C,#D9D2C4)'}} />
  </div>
);

/** CSS-3D Kaaba. Rotate the parent to move the camera around it. */
export const Kaaba3D: React.FC<{rotateY?: number; rotateX?: number; scale?: number; y?: number}> = ({
  rotateY = -32,
  rotateX = -14,
  scale = 1,
  y = 0,
}) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 0,
      height: 0,
      transformStyle: 'preserve-3d',
      transform: `translateY(${y}px) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    }}
  >
    <Face w={KW} h={KH} transform={`translateZ(${KW / 2}px)`} shade={0.05} door />
    <Face w={KW} h={KH} transform={`rotateY(90deg) translateZ(${KW / 2}px)`} shade={0.55} />
    <Face w={KW} h={KH} transform={`rotateY(180deg) translateZ(${KW / 2}px)`} shade={0.7} />
    <Face w={KW} h={KH} transform={`rotateY(-90deg) translateZ(${KW / 2}px)`} shade={0.3} />
    {/* roof */}
    <div
      style={{
        position: 'absolute',
        left: -KW / 2,
        top: -KW / 2,
        width: KW,
        height: KW,
        transform: `rotateX(90deg) translateZ(${KH / 2}px)`,
        background: 'linear-gradient(135deg,#2A2620,#0E0D0B)',
        boxShadow: 'inset 0 0 0 6px #3A352C',
      }}
    />
  </div>
);
