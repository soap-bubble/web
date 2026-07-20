import { describe, expect, it } from 'vitest';
import type { Gamestates } from 'morpheus/gamestate/isActive';
import type { Gamestate, Scene, SoundCast } from 'morpheus/casts/types';
import {
  getStageSoundCasts,
  isLoopingAudioCast,
} from 'morpheus/casts/soundPolicy';

function makeSoundCast(overrides: Partial<SoundCast> = {}): SoundCast {
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

function makeScene(sceneId: number, casts: Scene['casts'] = []): Scene {
  return {
    casts,
    cdFlags: 0,
    palette: 0,
    sceneId,
    sceneType: 1,
  };
}

function makeGamestates(): Gamestates {
  const state: Gamestate = {
    stateId: 1,
    initialValue: 0,
    maxValue: 1,
    minValue: 0,
    stateWraps: 0,
    value: 0,
  };

  return {
    byId(id) {
      if (id !== state.stateId) {
        throw new Error(`Unexpected gamestate ${id}`);
      }
      return state;
    },
  };
}

describe('background sound policy', () => {
  it('treats every SoundCast as looping, including legacy records without the field', () => {
    expect(isLoopingAudioCast(makeSoundCast())).toBe(true);
    expect(isLoopingAudioCast(makeSoundCast({ looping: false }))).toBe(true);
  });

  it('keeps an active background SoundCast from a previous scene on stage', () => {
    const backgroundSound = makeSoundCast();
    const previousScene = makeScene(1000, [backgroundSound]);
    const nextScene = makeScene(1001);

    expect(
      getStageSoundCasts({
        activeScene: nextScene,
        gamestates: makeGamestates(),
        stageScenes: [nextScene, previousScene],
      }),
    ).toEqual([backgroundSound]);
  });
});
