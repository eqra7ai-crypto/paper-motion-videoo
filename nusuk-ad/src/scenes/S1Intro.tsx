import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, rise} from '../anim';
import {AnimatedText} from '../components/AnimatedText';
import {GeoPattern, GoldDust, LightRays, WarmBackground} from '../components/Backdrop';
import {Kaaba3D} from '../components/Kaaba3D';
import {Sfx} from '../components/Sfx';
import {C, FONT_BODY} from '../theme';

/** Scene 1 (0–5 s): the Kaaba emerges from golden light; slow cinematic push-in. */
export const S1Intro: React.FC = () => {
  const f = useCurrentFrame();
  const reveal = rise(f, 6, 46, easeOut);
  const push = interpolate(f, [0, 160], [0, 1], {...clamp, easing: easeInOut});
  const flash = interpolate(f, [0, 30], [1, 0], {...clamp, easing: easeOut});
  const draw = rise(f, 10, 70);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <WarmBackground glow={1} />
      <GeoPattern id="p1" draw={draw} opacity={0.2} drift={60} />
      <AbsoluteFill style={{transform: `translateY(-120px) scale(${1 + push * 0.12})`}}>
        <LightRays opacity={0.55 * reveal} size={1700} />
        {/* halo */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 900,
            height: 900,
            margin: '-450px 0 0 -450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,240,200,0.95) 0%, rgba(255,226,160,0.35) 40%, rgba(255,226,160,0) 70%)',
          }}
        />
        {/* marble floor + shadow */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 980,
            height: 300,
            margin: '200px 0 0 -490px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(250,244,232,0.6) 55%, rgba(250,244,232,0) 72%)',
            opacity: reveal,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 620,
            height: 120,
            margin: '250px 0 0 -310px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(40,25,5,0.45) 0%, rgba(40,25,5,0) 70%)',
            opacity: reveal,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            perspective: 1800,
            transformStyle: 'preserve-3d',
            opacity: reveal,
            filter: `brightness(${1 + (1 - reveal) * 2.2}) blur(${(1 - reveal) * 14}px)`,
          }}
        >
          <Kaaba3D
            rotateY={interpolate(push, [0, 1], [-52, -30])}
            rotateX={-12}
            scale={interpolate(reveal, [0, 1], [0.78, 0.98]) + push * 0.08}
            y={interpolate(reveal, [0, 1], [60, 0])}
          />
        </div>
      </AbsoluteFill>
      <GoldDust seed="s1" count={60} opacity={0.9} />
      {/* golden light bloom the Kaaba emerges from */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 42%, #FFFDF5 0%, #FFE9B8 40%, rgba(233,201,130,0.6) 100%)',
          opacity: flash,
        }}
      />
      <div style={{position: 'absolute', left: 80, right: 80, top: 1390}}>
        <div
          style={{
            textAlign: 'center',
            fontFamily: FONT_BODY,
            fontSize: 26,
            letterSpacing: 8,
            color: C.goldDeep,
            opacity: rise(f, 36, 20),
            marginBottom: 18,
          }}
        >
          ✦ ✦ ✦
        </div>
        <AnimatedText text="هناك رحلات لا تشبه أي رحلة أخرى..." start={44} end={146} size={78} stagger={5} color={C.ink} />
      </div>
      <Sfx at={0} name="swell" volume={0.55} />
      <Sfx at={44} name="chime" volume={0.35} />
    </AbsoluteFill>
  );
};
