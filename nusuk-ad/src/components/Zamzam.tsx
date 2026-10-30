import React from 'react';
import {FONT_HEAD} from '../theme';

/** Single Zamzam water bottle (2.5D, vector). */
export const Bottle: React.FC<{h?: number}> = ({h = 220}) => {
  const w = h * 0.34;
  return (
    <svg width={w} height={h} viewBox="0 0 68 220">
      <defs>
        <linearGradient id="btl" x1="0" x2="1">
          <stop offset="0" stopColor="#CFE3EE" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#D6E8F1" stopOpacity="0.85" />
          <stop offset="1" stopColor="#9FC0D2" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="cap" x1="0" x2="1">
          <stop offset="0" stopColor="#8E6A2C" />
          <stop offset="0.5" stopColor="#F3DCA2" />
          <stop offset="1" stopColor="#9A7533" />
        </linearGradient>
      </defs>
      <rect x="22" y="2" width="24" height="16" rx="3" fill="url(#cap)" />
      <path d="M24 18h20v10c0 6 18 14 18 30v150c0 6-4 10-10 10H16c-6 0-10-4-10-10V58c0-16 18-24 18-30Z" fill="url(#btl)" />
      <rect x="6" y="96" width="56" height="58" fill="#FBF3E2" />
      <rect x="6" y="96" width="56" height="5" fill="url(#cap)" />
      <rect x="6" y="149" width="56" height="5" fill="url(#cap)" />
      <text x="34" y="132" textAnchor="middle" fontFamily={FONT_HEAD} fontSize="17" fontWeight="700" fill="#7A5A22">
        زمزم
      </text>
      <path d="M14 64v130" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
};

/** Carton of Zamzam water with bottles rising out of it. */
export const ZamzamCarton: React.FC<{rise?: number; w?: number}> = ({rise = 1, w = 520}) => {
  const h = w * 0.52;
  return (
    <div style={{position: 'relative', width: w, height: h + 220}}>
      {/* bottles behind the front panel */}
      <div style={{position: 'absolute', bottom: h - 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6}}>
        {[0, 1, 2, 3, 4].map((i) => {
          const r = Math.max(0, Math.min(1, rise * 1.6 - Math.abs(i - 2) * 0.22));
          return (
            <div key={i} style={{transform: `translateY(${(1 - r) * 200}px)`, opacity: Math.min(1, r * 2)}}>
              <Bottle h={200 - Math.abs(i - 2) * 10} />
            </div>
          );
        })}
      </div>
      {/* carton */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: w,
          height: h,
          borderRadius: 14,
          background: 'linear-gradient(160deg,#E8CF9A 0%,#C9A45C 45%,#A97C33 100%)',
          boxShadow: '0 30px 60px rgba(90,60,15,0.35), inset 0 2px 0 rgba(255,255,255,0.5)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 22, background: 'rgba(80,50,10,0.18)'}} />
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontSize: w * 0.2,
            fontWeight: 700,
            color: '#3E2A0E',
            lineHeight: 1,
            textShadow: '0 2px 0 rgba(255,240,200,0.5)',
          }}
        >
          زمزم
        </div>
        <div style={{fontFamily: FONT_HEAD, fontSize: w * 0.05, color: '#3E2A0E', opacity: 0.75, marginTop: 8, direction: 'rtl'}}>
          24 عبوة
        </div>
      </div>
    </div>
  );
};
