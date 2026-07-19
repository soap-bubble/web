import { describe, expect, it } from 'vitest';

import {
  createGamestatesAccessor,
  createHotspot,
} from './harnessClick.fixtures';
import { handleHotspotAction } from './handleHotspotAction';
import { handleSliderDrag } from './handleSliderDrag';

describe('slider hotspot actions', () => {
  it('maps a full horizontal drag across the full gamestate range', () => {
    const result = handleHotspotAction({
      hotspot: createHotspot({
        type: 6,
        param1: 10,
        param2: 0,
        rectLeft: 0,
        rectRight: 100,
      }),
      gamestates: createGamestatesAccessor({
        10: { value: 3, maxValue: 7 },
      }),
      currentPosition: { top: 0, left: 100 },
      startingPosition: { top: 0, left: 50 },
      isPanoScene: false,
      oldValue: 3,
    });

    expect(result.gamestateUpdates).toEqual([{ stateId: 10, value: 7 }]);
  });

  it('maps vertical distance symmetrically without over-driving the range', () => {
    const result = handleHotspotAction({
      hotspot: createHotspot({
        type: 7,
        param1: 11,
        param2: 0,
        rectTop: 0,
        rectBottom: 100,
      }),
      gamestates: createGamestatesAccessor({
        11: { value: 4, maxValue: 10 },
      }),
      currentPosition: { top: 75, left: 0 },
      startingPosition: { top: 50, left: 0 },
      isPanoScene: false,
      oldValue: 4,
    });

    expect(result.gamestateUpdates).toEqual([{ stateId: 11, value: 7 }]);
  });

  it('combines the two axis states using the Morpheus-C++ value layout', () => {
    const result = handleHotspotAction({
      hotspot: createHotspot({
        type: 8,
        param1: 12,
        param2: 13,
        param3: 14,
        rectLeft: 0,
        rectRight: 100,
        rectTop: 0,
        rectBottom: 100,
      }),
      gamestates: createGamestatesAccessor({
        12: { value: 0, maxValue: 63 },
        13: { value: 3, maxValue: 7 },
        14: { value: 4, maxValue: 7 },
      }),
      currentPosition: { top: 100, left: 100 },
      startingPosition: { top: 0, left: 0 },
      isPanoScene: false,
    });

    expect(result.gamestateUpdates).toEqual([{ stateId: 12, value: 35 }]);
  });

  it('changes Y without rotating through X frames', () => {
    const gamestates = createGamestatesAccessor({
      20: { value: 2, maxValue: 7 },
      21: { value: 3, maxValue: 7 },
      22: { value: 26, maxValue: 63 },
    });
    const sharedBounds = {
      castId: 0,
      rectLeft: 0,
      rectRight: 100,
      rectTop: 0,
      rectBottom: 100,
    };
    const hotspots = [
      createHotspot({ ...sharedBounds, type: 6, param1: 20 }),
      createHotspot({ ...sharedBounds, type: 7, param1: 21 }),
      createHotspot({
        ...sharedBounds,
        type: 8,
        param1: 22,
        param2: 20,
        param3: 21,
      }),
    ];

    const result = handleSliderDrag({
      hotspots,
      gamestates,
      currentPosition: { top: 90, left: 50 },
      startingPosition: { top: 50, left: 50 },
      oldValues: new Map([
        [20, 2],
        [21, 3],
        [22, 26],
      ]),
      isPanoScene: false,
    });

    expect(result).toEqual([
      { stateId: 21, value: 6 },
      { stateId: 22, value: 50 },
    ]);
  });
});

describe('panorama scene transitions', () => {
  it('centers the renderer on the authored hotspot before changing scenes', () => {
    const result = handleHotspotAction({
      hotspot: createHotspot({
        type: 0,
        param1: 203403,
        rectLeft: 3339,
        rectRight: 3517,
      }),
      gamestates: createGamestatesAccessor({}),
      currentPosition: { top: 0, left: 3428 },
      startingPosition: { top: 0, left: 3428 },
      isPanoScene: true,
    });

    expect(result.preTransitionRotation).toEqual({
      yaw3600: 3300,
      pitch: 0,
    });
  });

  it('centers wrapped hotspots without taking the long way around', () => {
    const result = handleHotspotAction({
      hotspot: createHotspot({
        type: 0,
        param1: 203403,
        rectLeft: 3500,
        rectRight: 100,
      }),
      gamestates: createGamestatesAccessor({}),
      currentPosition: { top: 0, left: 0 },
      startingPosition: { top: 0, left: 0 },
      isPanoScene: true,
    });

    expect(result.preTransitionRotation).toEqual({
      yaw3600: 3472,
      pitch: 0,
    });
  });

  it('does not treat equal bounds as a full panorama revolution', () => {
    const result = handleHotspotAction({
      hotspot: createHotspot({
        type: 0,
        param1: 807003,
        rectLeft: 0,
        rectRight: 0,
      }),
      gamestates: createGamestatesAccessor({}),
      currentPosition: { top: 0, left: 0 },
      startingPosition: { top: 0, left: 0 },
      isPanoScene: true,
    });

    expect(result.preTransitionRotation).toEqual({
      yaw3600: 3472,
      pitch: 0,
    });
  });
});
