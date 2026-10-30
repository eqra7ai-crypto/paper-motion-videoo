import React from 'react';

type FaceName = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

/** Generic CSS-3D cuboid centred on its parent's origin. */
export const Box3D: React.FC<{
  w: number;
  h: number;
  d: number;
  face: (name: FaceName, fw: number, fh: number) => React.ReactNode;
  shade?: Partial<Record<FaceName, number>>;
  style?: React.CSSProperties;
}> = ({w, h, d, face, shade = {}, style}) => {
  const faces: {name: FaceName; fw: number; fh: number; t: string}[] = [
    {name: 'front', fw: w, fh: h, t: `translateZ(${d / 2}px)`},
    {name: 'back', fw: w, fh: h, t: `rotateY(180deg) translateZ(${d / 2}px)`},
    {name: 'right', fw: d, fh: h, t: `rotateY(90deg) translateZ(${w / 2}px)`},
    {name: 'left', fw: d, fh: h, t: `rotateY(-90deg) translateZ(${w / 2}px)`},
    {name: 'top', fw: w, fh: d, t: `rotateX(90deg) translateZ(${h / 2}px)`},
    {name: 'bottom', fw: w, fh: d, t: `rotateX(-90deg) translateZ(${h / 2}px)`},
  ];
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d', ...style}}>
      {faces.map((f) => (
        <div
          key={f.name}
          style={{
            position: 'absolute',
            left: -f.fw / 2,
            top: -f.fh / 2,
            width: f.fw,
            height: f.fh,
            transform: f.t,
            backfaceVisibility: 'hidden',
            overflow: 'hidden',
          }}
        >
          {face(f.name, f.fw, f.fh)}
          {shade[f.name] ? (
            <div style={{position: 'absolute', inset: 0, background: `rgba(40,25,5,${shade[f.name]})`}} />
          ) : null}
        </div>
      ))}
    </div>
  );
};
