import React from 'react';

export const PHONE_W = 540;
export const PHONE_H = 1110;
export const SCREEN_W = PHONE_W - 36;
export const SCREEN_H = PHONE_H - 36;

/** Titanium-style smartphone with real 3D tilt, edge thickness and screen glare. */
export const Phone: React.FC<{
  rotateY?: number;
  rotateX?: number;
  rotateZ?: number;
  scale?: number;
  x?: number;
  y?: number;
  glare?: number; // 0..1 moving reflection position
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({rotateY = 0, rotateX = 0, rotateZ = 0, scale = 1, x = 0, y = 0, glare = 0.3, children, style}) => {
  const depth = 26;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: PHONE_W,
        height: PHONE_H,
        marginLeft: -PHONE_W / 2,
        marginTop: -PHONE_H / 2,
        transformStyle: 'preserve-3d',
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        ...style,
      }}
    >
      {/* edge thickness: stacked slices behind the front face */}
      {new Array(8).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 86,
            background: i === 7 ? '#2B2722' : 'linear-gradient(90deg,#6E665C,#D9D2C6 30%,#8B8378 60%,#E6DFD3 85%,#6E665C)',
            transform: `translateZ(${-(i + 1) * (depth / 8)}px)`,
          }}
        />
      ))}
      {/* front bezel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 86,
          background: 'linear-gradient(145deg,#E8E2D8 0%,#9C9488 25%,#F4EFE6 50%,#8A8277 75%,#D7D0C4 100%)',
          padding: 8,
          boxShadow: '0 60px 120px rgba(60,40,10,0.35), 0 20px 40px rgba(60,40,10,0.25)',
        }}
      >
        <div style={{width: '100%', height: '100%', borderRadius: 78, background: '#0A0908', padding: 10}}>
          <div
            style={{
              position: 'relative',
              width: SCREEN_W,
              height: SCREEN_H,
              borderRadius: 68,
              overflow: 'hidden',
              background: '#FBF7F0',
            }}
          >
            {children}
            {/* dynamic island */}
            <div
              style={{
                position: 'absolute',
                top: 18,
                left: '50%',
                width: 150,
                height: 42,
                marginLeft: -75,
                borderRadius: 22,
                background: '#050505',
                zIndex: 20,
              }}
            />
            {/* moving glass reflection */}
            <div
              style={{
                position: 'absolute',
                inset: -200,
                background: `linear-gradient(115deg, rgba(255,255,255,0) ${glare * 100 - 12}%, rgba(255,255,255,0.22) ${glare * 100}%, rgba(255,255,255,0) ${glare * 100 + 10}%)`,
                zIndex: 30,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
      {/* side buttons */}
      <div style={{position: 'absolute', right: -5, top: 260, width: 6, height: 120, borderRadius: 3, background: '#A9A194'}} />
      <div style={{position: 'absolute', left: -5, top: 220, width: 6, height: 70, borderRadius: 3, background: '#A9A194'}} />
      <div style={{position: 'absolute', left: -5, top: 310, width: 6, height: 70, borderRadius: 3, background: '#A9A194'}} />
    </div>
  );
};

/** Wrapper that gives children a camera with perspective. */
export const Stage3D: React.FC<{perspective?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  perspective = 2200,
  children,
  style,
}) => (
  <div style={{position: 'absolute', inset: 0, perspective, transformStyle: 'preserve-3d', ...style}}>{children}</div>
);
