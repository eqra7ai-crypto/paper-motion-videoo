import React from 'react';
import {Box3D} from './Box3D';

const BW = 400;
const BH = 290;
const LH = 70;

const paper = (w: number, h: number, ribbonV: boolean, ribbonH: boolean) => (
  <div
    style={{
      width: w,
      height: h,
      position: 'relative',
      background:
        'linear-gradient(135deg,#B8893A 0%,#F3DCA2 30%,#C99B4B 52%,#FBE9BF 74%,#A97C33 100%)',
    }}
  >
    {/* subtle geometric emboss */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.18,
        backgroundImage:
          'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 26px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 26px)',
      }}
    />
    {ribbonV && (
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: w / 2 - 32,
          width: 64,
          background: 'linear-gradient(90deg,#F8F1E3,#FFFFFF 40%,#E6D7BA 60%,#FFFDF8)',
          boxShadow: '0 0 12px rgba(80,50,10,0.25)',
        }}
      />
    )}
    {ribbonH && (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: h / 2 - 32,
          height: 64,
          background: 'linear-gradient(180deg,#F8F1E3,#FFFFFF 40%,#E6D7BA 60%,#FFFDF8)',
          boxShadow: '0 0 12px rgba(80,50,10,0.25)',
        }}
      />
    )}
  </div>
);

/** Luxury gift box whose lid hinges open (`open` 0..1). */
export const GiftBox3D: React.FC<{
  open: number;
  rotateY?: number;
  rotateX?: number;
  scale?: number;
  y?: number;
  glow?: number;
}> = ({open, rotateY = -28, rotateX = -18, scale = 1, y = 0, glow = 0}) => (
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
    {/* body: open top so the light can escape */}
    <Box3D
      w={BW}
      h={BH}
      d={BW}
      shade={{right: 0.28, back: 0.45, left: 0.1}}
      face={(name, fw, fh) =>
        name === 'top' ? (
          <div
            style={{
              width: fw,
              height: fh,
              background: `radial-gradient(circle, rgba(255,248,220,${0.4 + glow * 0.6}) 0%, rgba(255,214,130,${glow}) 45%, #6B4A1C 100%)`,
            }}
          />
        ) : (
          paper(fw, fh, name === 'front' || name === 'back' || name === 'left' || name === 'right', false)
        )
      }
    />
    {/* lid: lifts off and floats away as the light escapes */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        transformStyle: 'preserve-3d',
        opacity: 1 - Math.max(0, (open - 0.55) / 0.45),
        transform: `translate3d(${open * 160}px, ${-BH / 2 - LH / 2 + 2 - open * 560}px, 0) rotateX(${open * -30}deg) rotateZ(${open * 22}deg)`,
      }}
    >
      <Box3D
        w={BW + 24}
        h={LH}
        d={BW + 24}
        shade={{right: 0.25, back: 0.4, bottom: 0.5}}
        face={(name, fw, fh) => paper(fw, fh, name !== 'top' && name !== 'bottom' ? true : true, name === 'top')}
      />
      {/* bow */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformStyle: 'preserve-3d',
          transform: `translateY(${-LH / 2 - 2}px) rotateX(90deg)`,
        }}
      >
        {[-1, 1].map((s) => (
          <div
            key={s}
            style={{
              position: 'absolute',
              left: s < 0 ? -150 : 10,
              top: -60,
              width: 140,
              height: 120,
              borderRadius: s < 0 ? '70% 30% 30% 70%' : '30% 70% 70% 30%',
              border: '22px solid #FFFDF6',
              boxShadow: '0 6px 18px rgba(80,50,10,0.3)',
              transform: `rotateX(-70deg) translateY(-40px)`,
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>
    </div>
  </div>
);
