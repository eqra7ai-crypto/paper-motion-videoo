import React, {useMemo} from 'react';
import QRCode from 'qrcode';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, pop, rise} from '../anim';
import {AnimatedText} from '../components/AnimatedText';
import {SplashScreen} from '../components/AppScreens';
import {GeoPattern, GoldDust, GoldSweep, LightRays, WarmBackground} from '../components/Backdrop';
import {AppleGlyph, PlayGlyph} from '../components/Icons';
import {NusukLogo} from '../components/NusukLogo';
import {Phone, Stage3D} from '../components/Phone';
import {Sfx} from '../components/Sfx';
import {C, FONT_BODY, TRANSITION} from '../theme';

export const LINK = 'https://nusuk.go.link/5kbeD';

const Qr: React.FC<{text: string; size: number}> = ({text, size}) => {
  const {modules} = useMemo(() => QRCode.create(text, {errorCorrectionLevel: 'M'}), [text]);
  const n = modules.size;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (modules.get(x, y)) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} />);
  return (
    <svg width={size} height={size} viewBox={`-2 -2 ${n + 4} ${n + 4}`} style={{background: '#fff', borderRadius: 14}}>
      <g fill={C.ink}>{cells}</g>
    </svg>
  );
};

const Badge: React.FC<{store: 'apple' | 'google'; f: number; start: number}> = ({store, f, start}) => {
  const p = pop(f, start, 13);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        direction: 'ltr',
        height: 104,
        padding: '0 30px',
        borderRadius: 26,
        background: C.ink,
        color: '#fff',
        boxShadow: '0 18px 40px rgba(20,14,5,0.3)',
        transform: `translateY(${(1 - p) * 60}px) scale(${0.85 + p * 0.15})`,
        opacity: Math.min(1, p * 1.5),
      }}
    >
      {store === 'apple' ? <AppleGlyph size={52} /> : <PlayGlyph size={50} />}
      <div style={{fontFamily: FONT_BODY, lineHeight: 1.1}}>
        <div style={{fontSize: 18, opacity: 0.85}}>{store === 'apple' ? 'Download on the' : 'GET IT ON'}</div>
        <div style={{fontSize: 34, fontWeight: 600}}>{store === 'apple' ? 'App Store' : 'Google Play'}</div>
      </div>
    </div>
  );
};

/** Scene 5 (33–42 s): phone returns centre stage, logo, stores, link, CTA. */
export const S5Cta: React.FC = () => {
  const f = useCurrentFrame();
  const enter = rise(f, 0, 36, easeOut);
  const float = Math.sin(f / 20) * 10;
  const logo = rise(f, 30, 26);

  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity: rise(f, 0, TRANSITION)}}>
      <WarmBackground />
      <GeoPattern id="p5" opacity={0.16} draw={rise(f, 0, 60)} />
      <AbsoluteFill style={{transform: 'translateY(-160px)'}}>
        <LightRays opacity={0.4} size={1500} speed={0.1} />
      </AbsoluteFill>
      <Stage3D perspective={2000}>
        <Phone
          y={interpolate(enter, [0, 1], [700, -150]) + float}
          rotateY={interpolate(f, [0, 270], [18, -8], {...clamp, easing: easeInOut})}
          rotateX={interpolate(enter, [0, 1], [20, 4])}
          scale={interpolate(enter, [0, 1], [0.5, 0.6])}
          glare={interpolate(f, [0, 270], [0.1, 0.9])}
        >
          <SplashScreen f={f - 8} />
        </Phone>
      </Stage3D>
      <GoldDust seed="s5" count={40} opacity={0.6} />

      <div style={{position: 'absolute', top: 150, left: 60, right: 60}}>
        <AnimatedText text="لا تنتظر الفرصة..." start={14} size={66} color={C.goldDeep} stagger={4} />
        <AnimatedText text="ابدأ رحلتك مع نسك الآن" start={34} size={82} color={C.ink} stagger={4} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1170,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: logo,
          transform: `translateY(${(1 - logo) * 30}px)`,
        }}
      >
        <NusukLogo size={104} draw={logo} />
      </div>

      <div style={{position: 'absolute', top: 1340, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26}}>
        <Badge store="apple" f={f} start={58} />
        <Badge store="google" f={f} start={66} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1510,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: rise(f, 82, 18),
          transform: `translateY(${(1 - rise(f, 82, 18)) * 30}px)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: 14,
            paddingLeft: 32,
            borderRadius: 30,
            background: 'rgba(255,255,255,0.85)',
            boxShadow: '0 14px 36px rgba(110,70,10,0.18)',
            direction: 'ltr',
          }}
        >
          <div style={{fontFamily: FONT_BODY, fontSize: 34, fontWeight: 600, color: C.ink}}>nusuk.go.link/5kbeD</div>
          <Qr text={LINK} size={150} />
        </div>
      </div>

      <div
        dir="rtl"
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT_BODY,
          fontSize: 26,
          color: C.muted,
          opacity: rise(f, 96, 16),
        }}
      >
        *تطبق الشروط والأحكام
      </div>

      {/* final fade to warm white */}
      <AbsoluteFill style={{background: C.cream, opacity: interpolate(f, [252, 270], [0, 1], clamp)}} />
      <GoldSweep start={0} lines={7} dur={30} />

      <Sfx at={0} name="whoosh" volume={0.5} />
      <Sfx at={30} name="chime" volume={0.4} />
      <Sfx at={58} name="pop" volume={0.35} />
      <Sfx at={66} name="pop" volume={0.35} />
      <Sfx at={82} name="tick" volume={0.25} />
    </AbsoluteFill>
  );
};
