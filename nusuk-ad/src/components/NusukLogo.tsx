import React from 'react';
import {FONT_BODY, FONT_HEAD} from '../theme';

/*
 * TEMPORARY LOGO — a clean vector stand-in drawn after the mark in the
 * client's reference poster (layered isometric Kaaba). Replace with the
 * official Nusuk vector before publishing: drop the file in public/brand/
 * and swap <NusukMark/> for <Img src={staticFile('brand/nusuk-logo.svg')}/>.
 */
export const NusukMark: React.FC<{size?: number; color?: string; draw?: number}> = ({
  size = 120,
  color = '#141210',
  draw = 1,
}) => {
  const rh = (cy: number, hw: number, hh: number) =>
    `${50 - hw},${cy} 50,${cy - hh} ${50 + hw},${cy} 50,${cy + hh}`;
  const dash = 260;
  const off = dash * (1 - draw);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <g fill="none" stroke={color} strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={off}>
        {[22, 26.5, 31, 35.5].map((y, i) => (
          <polygon key={i} points={rh(y, 33 - i * 0.6, 16.5 - i * 0.3)} strokeWidth={2.1} />
        ))}
        <polyline points="16.5,36 16.5,64 50,81 83.5,64 83.5,36" strokeWidth={3.2} />
        <polyline points="16.5,47 50,63.5 83.5,47" strokeWidth={6.2} />
        <polyline points="16.5,56.5 50,73 83.5,56.5" strokeWidth={6.2} />
      </g>
      <polygon points={rh(41.5, 13, 6.5)} fill={color} opacity={draw} />
    </svg>
  );
};

export const NusukLogo: React.FC<{
  size?: number;
  color?: string;
  draw?: number;
  wordOpacity?: number;
}> = ({size = 120, color = '#141210', draw = 1, wordOpacity = 1}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.18, direction: 'ltr'}}>
    <NusukMark size={size} color={color} draw={draw} />
    <div style={{display: 'flex', flexDirection: 'column', lineHeight: 1, opacity: wordOpacity, color}}>
      <span style={{fontFamily: FONT_HEAD, fontSize: size * 0.46, fontWeight: 700, textAlign: 'left'}}>
        نُسك
      </span>
      <span style={{fontFamily: FONT_BODY, fontSize: size * 0.34, fontWeight: 600, marginTop: size * 0.06}}>
        Nusuk
      </span>
    </div>
  </div>
);

/** App icon tile, styled like the one in the reference poster. */
export const NusukAppIcon: React.FC<{size?: number}> = ({size = 160}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.23,
      background: 'linear-gradient(145deg, #FFF8EA 0%, #F2DFB8 40%, #E7C78C 100%)',
      boxShadow: '0 20px 50px rgba(120,85,30,0.35), inset 0 2px 0 rgba(255,255,255,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <NusukMark size={size * 0.68} />
  </div>
);
