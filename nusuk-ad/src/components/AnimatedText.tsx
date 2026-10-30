import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeOut, fall} from '../anim';
import {C, FONT_HEAD} from '../theme';

type Props = {
  text: string;
  start: number;
  /** Frame (relative to the sequence) at which the line leaves. */
  end?: number;
  size?: number;
  color?: string;
  stagger?: number;
  weight?: number;
  font?: string;
  gold?: boolean;
  style?: React.CSSProperties;
  lineHeight?: number;
};

/**
 * Arabic headline revealed word by word. Words are never split into letters,
 * so Arabic letter joining stays intact; direction is always RTL.
 */
export const AnimatedText: React.FC<Props> = ({
  text,
  start,
  end,
  size = 64,
  color = C.ink,
  stagger = 4,
  weight = 700,
  font = FONT_HEAD,
  gold = false,
  style,
  lineHeight = 1.45,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  const out = end === undefined ? 1 : fall(frame, end, 14);
  const outY = end === undefined ? 0 : interpolate(frame, [end, end + 14], [0, -24], clamp);

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: size * 0.28,
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        lineHeight,
        color,
        opacity: out,
        transform: `translateY(${outY}px)`,
        textAlign: 'center',
        ...style,
      }}
    >
      {words.map((w, i) => {
        const s = start + i * stagger;
        const t = interpolate(frame, [s, s + 18], [0, 1], {...clamp, easing: easeOut});
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: t,
              transform: `translateY(${(1 - t) * 34}px) scale(${0.94 + t * 0.06})`,
              filter: `blur(${(1 - t) * 10}px)`,
              ...(gold
                ? {
                    backgroundImage:
                      'linear-gradient(180deg, #FFF3D6 0%, #E9C982 45%, #B88A3E 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }
                : {}),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
