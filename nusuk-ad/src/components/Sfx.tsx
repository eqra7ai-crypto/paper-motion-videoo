import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';

export type SfxName =
  | 'whoosh'
  | 'whoosh-soft'
  | 'pop'
  | 'chime'
  | 'shimmer'
  | 'impact'
  | 'riser'
  | 'sparkle'
  | 'tick'
  | 'swell';

/** Place a sound effect at a frame relative to the current sequence. */
export const Sfx: React.FC<{at: number; name: SfxName; volume?: number}> = ({at, name, volume = 0.6}) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);
