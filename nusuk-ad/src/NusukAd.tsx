import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile} from 'remotion';
import {z} from 'zod';
import {S1Intro} from './scenes/S1Intro';
import {S2App} from './scenes/S2App';
import {S3Services} from './scenes/S3Services';
import {S4Prizes} from './scenes/S4Prizes';
import {S5Cta} from './scenes/S5Cta';
import {SCENES, TOTAL} from './theme';

export const adSchema = z.object({
  music: z.boolean(),
  musicVolume: z.number(),
  // set true once public/audio/voiceover.wav exists (see VOICEOVER.md)
  voiceover: z.boolean(),
});

export const NusukAd: React.FC<z.infer<typeof adSchema>> = ({music, musicVolume, voiceover}) => (
  <AbsoluteFill style={{background: '#F4ECDD'}}>
    <Sequence {...SCENES.intro} name="1 · Intro – Kaaba">
      <S1Intro />
    </Sequence>
    <Sequence {...SCENES.app} name="2 · App reveal">
      <S2App />
    </Sequence>
    <Sequence {...SCENES.services} name="3 · Services">
      <S3Services />
    </Sequence>
    <Sequence {...SCENES.prizes} name="4 · Prizes">
      <S4Prizes />
    </Sequence>
    <Sequence {...SCENES.cta} name="5 · CTA">
      <S5Cta />
    </Sequence>

    {music && (
      <Audio
        src={staticFile('audio/music.wav')}
        // duck the bed slightly when a voiceover is present, fade out at the end
        volume={(f) =>
          musicVolume *
          (voiceover ? 0.55 : 1) *
          interpolate(f, [0, 10, TOTAL - 45, TOTAL], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
        }
      />
    )}
    {voiceover && <Audio src={staticFile('audio/voiceover.wav')} volume={1} />}
  </AbsoluteFill>
);
