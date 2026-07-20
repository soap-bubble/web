import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SoundCast } from 'morpheus/casts/types';
import Sounds from 'morpheus/casts/components/Sounds';

function makeBackgroundSound(overrides: Partial<SoundCast> = {}): SoundCast {
  return {
    __t: 'SoundCast',
    audioOnly: true,
    castId: 710001,
    comparators: [],
    fileName: 'GameDB/OAsounds/MBmusicMSC',
    height: 0,
    initiallyEnabled: true,
    location: { x: 0, y: 0 },
    url: '',
    width: 0,
    ...overrides,
  };
}

describe('background audio', () => {
  it('loops legacy SoundCasts when the serialized looping field is absent', () => {
    const markup = renderToStaticMarkup(
      <Sounds
        soundCasts={[makeBackgroundSound()]}
        volume={0.5}
        onAudioCastCanPlaythrough={() => undefined}
        onAudioCastEnded={() => undefined}
        onAudioCastRef={() => undefined}
      />,
    );

    expect(markup).toMatch(/<audio[^>]*\bloop(?:=""|="true")?/);
  });
});
