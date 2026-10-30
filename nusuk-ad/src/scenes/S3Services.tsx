import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, pop, rise} from '../anim';
import {AnimatedText} from '../components/AnimatedText';
import {BookingScreen, StayScreen, TripScreen} from '../components/AppScreens';
import {GeoPattern, GoldDust, WarmBackground} from '../components/Backdrop';
import {IconBed, IconCalendar, IconKaaba} from '../components/Icons';
import {Phone, Stage3D} from '../components/Phone';
import {Sfx} from '../components/Sfx';
import {C, FONT_BODY, FONT_HEAD, TRANSITION} from '../theme';

const BEAT = 100;
const beats = [
  {n: '01', title: 'حجز رحلة العمرة', icon: IconKaaba},
  {n: '02', title: 'اختيار مكان الإقامة', icon: IconBed},
  {n: '03', title: 'تنظيم تفاصيل الرحلة', icon: IconCalendar},
];

/** Gold glossy 3D icon tile that flies in beside the phone. */
const IconTile: React.FC<{Icon: React.FC<{size?: number; color?: string; stroke?: number}>; f: number; side: number}> = ({
  Icon,
  f,
  side,
}) => {
  const p = pop(f, 6, 12);
  const out = interpolate(f, [BEAT - 14, BEAT], [1, 0], clamp);
  const bob = Math.sin(f / 16) * 12;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate3d(${side * 330 - 85}px, ${-260 + bob}px, 260px) rotateY(${side * -18 + (1 - p) * 90}deg) rotateX(10deg) scale(${p})`,
        opacity: out * Math.min(1, p * 1.5),
        width: 170,
        height: 170,
        borderRadius: 46,
        background: 'linear-gradient(145deg,#FFF7E3 0%,#EBCB86 45%,#B88A3E 100%)',
        boxShadow: '0 30px 60px rgba(80,55,15,0.35), inset 0 3px 0 rgba(255,255,255,0.9), inset 0 -6px 12px rgba(120,80,20,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={92} color={C.ink} stroke={1.6} />
    </div>
  );
};

/** Scene 3 (12–22 s): three fast, elegant beats on Nusuk's core services. */
export const S3Services: React.FC = () => {
  const f = useCurrentFrame();
  const beat = Math.min(2, Math.floor(f / BEAT));
  const local = f - beat * BEAT;
  const enter = rise(f, 0, 26);
  const headlineStart = 214;

  // phone sways between beats for a parallax feel
  const sway = interpolate(f, [0, 100, 200, 310], [-16, 12, -10, -2], {...clamp, easing: easeInOut});

  const screens = [
    <BookingScreen key="b" f={f - 4} />,
    <StayScreen key="s" f={f - BEAT + 10} />,
    <TripScreen key="t" f={f - 2 * BEAT + 10} />,
  ];

  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity: rise(f, 0, TRANSITION)}}>
      <WarmBackground />
      <GeoPattern id="p3" opacity={0.12} drift={120} />
      <Stage3D perspective={2000}>
        <Phone
          y={interpolate(enter, [0, 1], [260, 150])}
          rotateY={sway}
          rotateX={6}
          scale={0.8}
          glare={(f % BEAT) / BEAT}
        >
          {screens.map((s, i) => {
            // RTL-friendly slide: the next screen enters from the left
            const inT = i === 0 ? 1 : interpolate(f, [i * BEAT - 6, i * BEAT + 12], [0, 1], {...clamp, easing: easeOut});
            const outT = i === 2 ? 0 : interpolate(f, [(i + 1) * BEAT - 6, (i + 1) * BEAT + 12], [0, 1], {...clamp, easing: easeOut});
            if (inT === 0 || outT === 1) return null;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `translateX(${(1 - inT) * -100 + outT * 40}%)`,
                  opacity: 1 - outT,
                }}
              >
                {s}
              </div>
            );
          })}
        </Phone>
        <IconTile key={beat} Icon={beats[beat].icon} f={local} side={beat % 2 === 0 ? 1 : -1} />
      </Stage3D>
      <GoldDust seed="s3" count={36} opacity={0.6} />

      {/* beat label */}
      <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}} dir="rtl">
        <div style={{display: 'flex', gap: 12, marginBottom: 26}}>
          {beats.map((_, i) => (
            <div key={i} style={{width: 90, height: 8, borderRadius: 4, background: '#E3D5BB', overflow: 'hidden'}}>
              <div
                style={{
                  height: '100%',
                  width: `${interpolate(f, [i * BEAT, (i + 1) * BEAT], [0, 100], clamp)}%`,
                  background: `linear-gradient(90deg, ${C.goldDeep}, ${C.goldLight})`,
                  marginRight: 0,
                  marginLeft: 'auto',
                }}
              />
            </div>
          ))}
        </div>
        {beats.map((b, i) => {
          const s = i * BEAT;
          const t = rise(f, s + 2, 16);
          const o = i === 2 ? 1 : interpolate(f, [s + BEAT - 10, s + BEAT], [1, 0], clamp);
          if (f < s - 2 || f > s + BEAT + 2) return null;
          return (
            <div key={i} style={{position: 'absolute', top: 40, display: 'flex', alignItems: 'baseline', gap: 22, opacity: t * o, transform: `translateY(${(1 - t) * 30}px)`}}>
              <span style={{fontFamily: FONT_BODY, fontSize: 40, fontWeight: 700, color: C.gold}}>{b.n}</span>
              <span style={{fontFamily: FONT_HEAD, fontSize: 72, fontWeight: 700, color: C.ink}}>{b.title}</span>
            </div>
          );
        })}
      </div>

      {/* closing line of the scene */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 460,
          background: `linear-gradient(180deg, rgba(234,219,194,0) 0%, ${C.beige2} 55%)`,
          opacity: rise(f, headlineStart - 10, 16),
        }}
      />
      <div style={{position: 'absolute', left: 60, right: 60, top: 1600}}>
        <AnimatedText text="خطط، احجز، واستعد لرحلتك بكل سهولة" start={headlineStart} size={66} stagger={4} />
      </div>

      {[0, BEAT, 2 * BEAT].map((at) => (
        <React.Fragment key={at}>
          <Sfx at={Math.max(0, at - 6)} name="whoosh" volume={0.45} />
          <Sfx at={at + 8} name="pop" volume={0.35} />
        </React.Fragment>
      ))}
      <Sfx at={146} name="tick" volume={0.4} />
      <Sfx at={headlineStart} name="chime" volume={0.25} />
    </AbsoluteFill>
  );
};
