import { describe, expect, it } from 'vitest';

import {
  createGamestatesAccessor,
  createHotspot,
} from './harnessClick.fixtures';
import { handleHotspotAction } from './handleHotspotAction';
import { resolveAlwaysHotspotActions } from './alwaysHotspots';

describe('Always hotspot sequencing', () => {
  it('re-evaluates each authored rule against preceding gamestate updates', () => {
    const gamestates = createGamestatesAccessor({
      800: { value: 1, maxValue: 2 },
      1010: { value: 5, maxValue: 5 },
      1014: { value: 0, maxValue: 5 },
    });
    const hotspots = [
      createHotspot({
        castId: 0,
        gesture: 6,
        type: 9,
        param1: 800,
        param2: 0,
        defaultPass: true,
        comparators: [{ gameStateId: 1014, testType: 0, value: 0 }],
      }),
      createHotspot({
        castId: 0,
        gesture: 6,
        type: 9,
        param1: 800,
        param2: 1,
        defaultPass: true,
        comparators: [{ gameStateId: 1010, testType: 2, value: 4 }],
      }),
      createHotspot({
        castId: 0,
        gesture: 6,
        type: 9,
        param1: 1010,
        param2: 0,
        defaultPass: true,
        comparators: [{ gameStateId: 800, testType: 0, value: 1 }],
      }),
      createHotspot({
        castId: 0,
        gesture: 6,
        type: 0,
        param1: 201014,
        param2: 201014,
        defaultPass: true,
        comparators: [{ gameStateId: 800, testType: 0, value: 1 }],
      }),
    ];

    const results = resolveAlwaysHotspotActions({
      hotspots,
      gamestates,
      execute: (hotspot, currentGamestates) =>
        handleHotspotAction({
          hotspot,
          gamestates: currentGamestates,
          currentPosition: { top: 0, left: 0 },
          startingPosition: { top: 0, left: 0 },
          isPanoScene: false,
        }),
    });

    expect(results.flatMap((result) => result.gamestateUpdates)).toEqual([
      { stateId: 800, value: 0 },
      { stateId: 800, value: 1 },
      { stateId: 1010, value: 0 },
    ]);
    expect(results.at(-1)?.sceneTransition).toEqual({
      sceneId: 201014,
      dissolve: false,
    });
  });
});
