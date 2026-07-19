import { describe, expect, it } from 'vitest';
import type { Gamestates } from 'morpheus/gamestate/isActive';
import type { Gamestate, PanoAnim } from 'morpheus/casts/types';
import {
  getActivePanoAnimations,
  getPanoAnimationFrameSignature,
  getPanoAnimationPlacements,
} from 'morpheus/casts/panoAnimation';

function makePanoAnimation(overrides: Partial<PanoAnim> = {}): PanoAnim {
  return {
    __t: 'PanoAnim',
    actionAtEnd: 0,
    audioOnly: false,
    castId: 200051,
    comparators: [],
    dissolveToNextScene: false,
    fileName: 'GameDB/Deck2Bth/dckair13ANI',
    frame: 12,
    height: 72,
    initiallyEnabled: true,
    location: { x: 45, y: 269 },
    looping: false,
    nextSceneId: 0,
    url: '',
    width: 84,
    ...overrides,
  };
}

function makeGamestates(value: number): Gamestates {
  const state: Gamestate = {
    stateId: 552,
    initialValue: 1,
    minValue: 0,
    maxValue: 1,
    stateWraps: 0,
    value,
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

describe('PanoAnim compositing', () => {
  it('places the scene 2000 hatch patch in panorama source pixels', () => {
    const placements = getPanoAnimationPlacements({
      cast: makePanoAnimation(),
      offsetX: 1128,
    });

    expect(placements).toEqual([
      {
        destinationX: 453,
        destinationY: 269,
        height: 72,
        width: 84,
      },
    ]);
  });

  it('wraps patches across the panorama seam', () => {
    const placements = getPanoAnimationPlacements({
      cast: makePanoAnimation({
        frame: 0,
        location: { x: 0, y: 12 },
        width: 80,
        height: 40,
      }),
      offsetX: 3000,
    });

    expect(placements).toEqual([
      {
        destinationX: 72,
        destinationY: 12,
        height: 40,
        width: 80,
      },
    ]);
  });

  it('omits patches outside the current panorama chunk', () => {
    expect(
      getPanoAnimationPlacements({
        cast: makePanoAnimation(),
        offsetX: 0,
      }),
    ).toEqual([]);
  });

  it('uses authored gamestate comparators to activate scene patches', () => {
    const hatchPatch = makePanoAnimation({
      comparators: [{ gameStateId: 552, testType: 0, value: 0 }],
    });

    expect(getActivePanoAnimations([hatchPatch], makeGamestates(1))).toEqual(
      [],
    );
    expect(getActivePanoAnimations([hatchPatch], makeGamestates(0))).toEqual([
      hatchPatch,
    ]);
  });

  it('renders a multiply referenced cast only once', () => {
    const animation = makePanoAnimation();

    expect(
      getActivePanoAnimations([animation, animation], makeGamestates(0)),
    ).toEqual([animation]);
  });

  it('changes the frame signature when media becomes drawable or advances', () => {
    const cast = makePanoAnimation();
    const pending = getPanoAnimationFrameSignature([
      {
        cast,
        media: {
          currentTime: 0,
          readyState: 1,
          videoHeight: 0,
          videoWidth: 0,
        },
      },
    ]);
    const ready = getPanoAnimationFrameSignature([
      {
        cast,
        media: {
          currentTime: 0,
          readyState: 2,
          videoHeight: 72,
          videoWidth: 84,
        },
      },
    ]);
    const advanced = getPanoAnimationFrameSignature([
      {
        cast,
        media: {
          currentTime: 0.1,
          readyState: 2,
          videoHeight: 72,
          videoWidth: 84,
        },
      },
    ]);

    expect(ready).not.toBe(pending);
    expect(advanced).not.toBe(ready);
  });
});
