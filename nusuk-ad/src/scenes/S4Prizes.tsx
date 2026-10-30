import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, pop, rise} from '../anim';
import {AnimatedText} from '../components/AnimatedText';
import {GeoPattern, GoldDust, LightRays} from '../components/Backdrop';
import {GiftBox3D} from '../components/GiftBox3D';
import {IconKaaba} from '../components/Icons';
import {Sfx} from '../components/Sfx';
import {ZamzamCarton} from '../components/Zamzam';
import {C, FONT_BODY, FONT_HEAD} from '../theme';

const OPEN = 52; // lid starts opening
const SHIFT = 104; // box moves up, stats come in
const STAT1 = 116;
const STAT2 = 160;
const HEAD = 236;

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** Sparks that burst out of the box when the lid opens. */
const Burst: React.FC<{f: number}> = ({f}) => {
  const t = f - OPEN - 6;
  if (t < 0 || t > 70) return null;
  return (
    <>
      {new Array(46).fill(0).map((_, i) => {
        const a = -Math.PI / 2 + (random(`ba${i}`) - 0.5) * 2.4;
        const v = 14 + random(`bv${i}`) * 22;
        const x = Math.cos(a) * v * t;
        const y = Math.sin(a) * v * t + 0.35 * t * t;
        const sz = 6 + random(`bs${i}`) * 12;
        const o = interpolate(t, [0, 8, 70], [0, 1, 0], clamp);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: sz,
              height: sz,
              transform: `translate(${x}px, ${y - 120}px) rotate(45deg)`,
              background: i % 3 === 0 ? '#FFFFFF' : 'linear-gradient(135deg,#FFF3D0,#E3B65E)',
              boxShadow: '0 0 16px rgba(255,214,130,0.9)',
              opacity: o,
            }}
          />
        );
      })}
    </>
  );
};

const StatCard: React.FC<{
  f: number;
  start: number;
  value: number;
  label: string;
  visual: React.ReactNode;
}> = ({f, start, value, label, visual}) => {
  const p = pop(f, start, 13, 0.8);
  const count = interpolate(f, [start + 4, start + 40], [0, value], {...clamp, easing: easeOut});
  const done = f > start + 40;
  const flash = interpolate(f, [start + 40, start + 48], [1, 0], clamp);
  return (
    <div
      style={{
        width: 470,
        height: 560,
        borderRadius: 48,
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,247,229,0.88) 100%)',
        border: '2px solid rgba(255,255,255,0.9)',
        boxShadow: '0 40px 80px rgba(110,70,10,0.3), inset 0 0 0 1px rgba(200,163,90,0.35)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 46,
        transform: `translateY(${(1 - p) * 160}px) scale(${0.8 + p * 0.2 + (done ? flash * 0.04 : 0)})`,
        opacity: Math.min(1, p * 1.4),
        overflow: 'visible',
      }}
    >
      <div style={{position: 'absolute', top: 30, left: 0, right: 0, height: 270, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        {visual}
      </div>
      <div
        style={{
          fontFamily: FONT_HEAD,
          fontWeight: 700,
          fontSize: value >= 1000 ? 124 : 150,
          lineHeight: 1.1,
          backgroundImage: 'linear-gradient(180deg,#D9AF5C 0%,#9A7533 55%,#6E4F1D 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          direction: 'ltr',
          filter: `drop-shadow(0 0 ${flash * 24}px rgba(255,210,120,0.9))`,
        }}
      >
        {fmt(count)}
      </div>
      <div dir="rtl" style={{fontFamily: FONT_HEAD, fontSize: 40, fontWeight: 700, color: C.ink, textAlign: 'center', lineHeight: 1.3}}>
        {label}
      </div>
    </div>
  );
};

/** Scene 4 (22–33 s): sudden golden reveal, gift box opens, prize typography. */
export const S4Prizes: React.FC = () => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [0, 3, 18], [0, 1, 0], clamp);
  const boxIn = pop(f, 4, 11, 0.9);
  const shake = f > 30 && f < OPEN ? Math.sin(f * 1.9) * interpolate(f, [30, OPEN], [1, 4], clamp) : 0;
  const open = rise(f, OPEN, 34, easeOut);
  const glow = rise(f, OPEN, 30);
  const shift = rise(f, SHIFT, 30, easeInOut);
  const pulse = 1 + Math.sin(f / 7) * 0.02 * glow;

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 60% at 50% ${interpolate(shift, [0, 1], [48, 30])}%, #FFF6DC 0%, #F1D392 35%, #C99A4A 75%, #8A6427 100%)`,
        }}
      />
      <GeoPattern id="p4" color="#FFF3D0" opacity={0.22} drift={100} />
      <AbsoluteFill style={{transform: `translateY(${interpolate(shift, [0, 1], [40, -420])}px) scale(${interpolate(shift, [0, 1], [1, 0.62])})`}}>
        <LightRays opacity={0.25 + glow * 0.6} size={2000} speed={0.25} color="rgba(255,250,225,0.75)" />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 900,
            height: 900,
            margin: '-570px 0 0 -450px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,255,240,${glow}) 0%, rgba(255,230,170,${glow * 0.6}) 35%, rgba(255,230,170,0) 70%)`,
            transform: `scale(${pulse})`,
          }}
        />
        <div style={{position: 'absolute', inset: 0, perspective: 1800, transformStyle: 'preserve-3d'}}>
          <GiftBox3D
            open={open}
            glow={glow}
            scale={0.4 + boxIn * 0.6}
            rotateY={-30 + shake + interpolate(f, [0, 340], [0, 14])}
            rotateX={-20}
            y={(1 - boxIn) * 400 + 80}
          />
        </div>
        <Burst f={f} />
      </AbsoluteFill>
      <GoldDust seed="s4" count={90} opacity={0.6 + glow * 0.4} speed={1.6} />

      {/* kicker */}
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div
          dir="rtl"
          style={{
            fontFamily: FONT_HEAD,
            fontSize: 54,
            fontWeight: 700,
            color: C.ink,
            padding: '14px 46px',
            borderRadius: 60,
            background: 'rgba(255,250,238,0.8)',
            boxShadow: '0 16px 40px rgba(110,70,10,0.25)',
            opacity: rise(f, 10, 16),
            transform: `scale(${0.9 + rise(f, 10, 16) * 0.1})`,
          }}
        >
          مسابقة نسك
        </div>
      </div>

      {/* stats: RTL order → umrah trips on the right */}
      <div dir="rtl" style={{position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40}}>
        <StatCard
          f={f}
          start={STAT1}
          value={100}
          label="رحلة عمرة"
          visual={
            <div
              style={{
                width: 210,
                height: 210,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #2B2620, #0E0D0B)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 0 0 6px #D5AE5E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotate(${interpolate(f, [STAT1, STAT1 + 40], [-30, 0], {...clamp, easing: easeOut})}deg)`,
              }}
            >
              <IconKaaba size={120} color="#E9C982" stroke={1.4} />
            </div>
          }
        />
        <StatCard
          f={f}
          start={STAT2}
          value={10000}
          label="كرتون من ماء زمزم"
          visual={
            <div style={{transform: 'scale(0.62)', transformOrigin: 'bottom center', marginBottom: -10}}>
              <ZamzamCarton w={420} rise={rise(f, STAT2 + 12, 30)} />
            </div>
          }
        />
      </div>

      {/* headline */}
      <div style={{position: 'absolute', left: 50, right: 50, top: 1400}}>
        <div style={{transform: `scale(${interpolate(rise(f, HEAD, 18), [0, 1], [1.25, 1])})`}}>
          <AnimatedText text="أكثر من 10,000 جائزة" start={HEAD} size={98} stagger={3} color={C.ink} />
          <AnimatedText text="بانتظارك!" start={HEAD + 10} size={112} stagger={3} color="#FFFDF6" style={{textShadow: '0 6px 30px rgba(110,70,10,0.55)'}} />
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontFamily: FONT_BODY, fontSize: 24, color: 'rgba(30,22,8,0.7)', opacity: rise(f, HEAD + 20, 14)}} dir="rtl">
        *تطبق الشروط والأحكام
      </div>

      {/* white flash for the sudden cut */}
      <AbsoluteFill style={{background: '#FFFBEF', opacity: flash}} />

      <Sfx at={0} name="impact" volume={0.7} />
      <Sfx at={30} name="riser" volume={0.45} />
      <Sfx at={OPEN} name="sparkle" volume={0.7} />
      <Sfx at={OPEN} name="whoosh" volume={0.5} />
      <Sfx at={SHIFT} name="whoosh-soft" volume={0.4} />
      <Sfx at={STAT1} name="pop" volume={0.45} />
      <Sfx at={STAT1 + 4} name="tick" volume={0.4} />
      <Sfx at={STAT1 + 40} name="chime" volume={0.35} />
      <Sfx at={STAT2} name="pop" volume={0.45} />
      <Sfx at={STAT2 + 4} name="tick" volume={0.4} />
      <Sfx at={STAT2 + 40} name="chime" volume={0.35} />
      <Sfx at={HEAD} name="impact" volume={0.55} />
      <Sfx at={HEAD + 2} name="shimmer" volume={0.5} />
    </AbsoluteFill>
  );
};
