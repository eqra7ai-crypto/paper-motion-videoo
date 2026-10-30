import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {adSchema, NusukAd} from './NusukAd';
import {FPS, H, TOTAL, W} from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NusukAd"
    component={NusukAd}
    durationInFrames={TOTAL}
    fps={FPS}
    width={W}
    height={H}
    schema={adSchema}
    defaultProps={{music: true, musicVolume: 0.8, voiceover: false}}
  />
);
