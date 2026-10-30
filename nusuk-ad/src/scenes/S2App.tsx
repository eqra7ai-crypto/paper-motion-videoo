import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, pop, rise} from '../anim';
import {AnimatedText} from '../components/AnimatedText';
import {HomeScreen, SplashScreen} from '../components/AppScreens';
import {GeoPattern, GoldDust, GoldSweep, WarmBackground} from '../components/Backdrop';
import {IconCheck, IconKaaba} from '../components/Icons';
import {Phone, Stage3D} from '../components/Phone';
import {Sfx} from '../components/Sfx';
import {C, FONT_BODY, TRANSITION} from '../theme';

const Floating: React.FC<{x: number; y: number; z: number; start: number; children: React.ReactNode}> = ({
  x,
  y,
  z,
  start,
  children,
}) => {
  const f = useCurrentFrame();
  const p = pop(f, start, 13);
  const bob = Math.sin((f + start) / 18) * 10;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate3d(${x}px, ${y + bob}px, ${z}px) scale(${p})`,
        opacity: Math.min(1, p * 1.5),
      }}
    >
      {children}
    </div>
  );
};

/** Scene 2 (5–12 s): gold lines sweep in, the phone arrives, Nusuk launches. */
export const S2App: React.FC = () => {
  const f = useCurrentFrame();
  const enter = rise(f, 4, 40, easeOut);
  const settle = interpolate(f, [0, 220], [0, 1], {...clamp, easing: easeInOut});
  const toHome = rise(f, 84, 18);

  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity: rise(f, 0, TRANSITION)}}>
      <WarmBackground />
      <GeoPattern id="p2" opacity={0.14} drift={80} />
      <Stage3D perspective={2000}>
        <Phone
          y={interpolate(enter, [0, 1], [1300, 200])}
          rotateY={interpolate(enter, [0, 1], [38, 0]) + interpolate(settle, [0, 1], [-4, -14])}
          rotateX={interpolate(enter, [0, 1], [24, 6])}
          rotateZ={interpolate(enter, [0, 1], [-8, 0])}
          scale={0.86}
          glare={interpolate(f, [20, 200], [0.05, 0.95])}
        >
          <SplashScreen f={f - 20} />
          <div style={{position: 'absolute', inset: 0, opacity: toHome, transform: `translateY(${(1 - toHome) * 60}px)`}}>
            <HomeScreen f={f - 90} highlight={f > 150 ? 0 : -1} />
          </div>
        </Phone>
        {/* 2.5D cards floating off the screen for depth */}
        <Floating x={130} y={-60} z={160} start={120}>
          <div
            dir="rtl"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '18px 26px',
              borderRadius: 28,
              background: '#fff',
              boxShadow: '0 24px 50px rgba(80,55,15,0.22)',
              fontFamily: FONT_BODY,
              fontSize: 28,
              fontWeight: 700,
              color: C.ink,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{width: 44, height: 44, borderRadius: 22, background: '#E5F2EB', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <IconCheck size={26} color={C.green} stroke={3} />
            </span>
            تصريح العمرة جاهز
          </div>
        </Floating>
        <Floating x={-420} y={330} z={220} start={134}>
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: 36,
              background: 'linear-gradient(145deg,#FFF6E0,#E9C982 60%,#B88A3E)',
              boxShadow: '0 24px 50px rgba(80,55,15,0.3), inset 0 2px 0 #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconKaaba size={70} color={C.ink} stroke={1.6} />
          </div>
        </Floating>
      </Stage3D>
      <GoldDust seed="s2" count={40} opacity={0.7} />
      <div style={{position: 'absolute', left: 70, right: 70, top: 170}}>
        <AnimatedText text="مع نسك،" start={96} size={86} gold stagger={4} />
        <AnimatedText text="رحلتك الإيمانية أصبحت أسهل" start={106} size={70} color={C.ink} stagger={4} />
      </div>
      <GoldSweep start={0} lines={10} />
      <Sfx at={0} name="whoosh" volume={0.6} />
      <Sfx at={22} name="whoosh-soft" volume={0.4} />
      <Sfx at={96} name="pop" volume={0.35} />
      <Sfx at={120} name="pop" volume={0.3} />
      <Sfx at={134} name="pop" volume={0.3} />
    </AbsoluteFill>
  );
};
