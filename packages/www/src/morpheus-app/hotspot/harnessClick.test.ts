import { describe, expect, it } from 'vitest';

import {
  createGamestatesAccessor,
  createHotspot,
  createScene,
} from './harnessClick.fixtures';
import {
  executeHarnessHotspotClick,
  getHotspotClickPosition,
  summarizeHotspot,
} from './harnessClick';

describe('executeHarnessHotspotClick', () => {
  it('applies an active navigation hotspot by cast id', () => {
    const hotspot = createHotspot({ castId: 10, type: 0, param1: 105001 });
    const scene = createScene([hotspot]);

    const result = executeHarnessHotspotClick({
      scene,
      gamestates: createGamestatesAccessor({}),
      hotspot: summarizeHotspot(hotspot),
      isPanoScene: false,
    });

    expect(result.outcome).toBe('applied');
    if (result.outcome !== 'applied') {
      throw new Error('Expected applied result');
    }
    expect(result.actionResult.sceneTransition).toEqual({
      sceneId: 105001,
      dissolve: false,
      startAngle: undefined,
    });
    expect(result.matchedHotspot.targetSceneId).toBe(105001);
  });

  it('applies an active non-navigation gamestate hotspot', () => {
    const hotspot = createHotspot({ castId: 11, type: 2, param1: 7 });
    const scene = createScene([hotspot]);

    const result = executeHarnessHotspotClick({
      scene,
      gamestates: createGamestatesAccessor({
        7: { stateId: 7, value: 2, maxValue: 3 },
      }),
      hotspot: summarizeHotspot(hotspot),
      isPanoScene: false,
    });

    expect(result.outcome).toBe('applied');
    if (result.outcome !== 'applied') {
      throw new Error('Expected applied result');
    }
    expect(result.actionResult.gamestateUpdates).toEqual([
      { stateId: 7, value: 3 },
    ]);
    expect(result.matchedHotspot.targetSceneId).toBeNull();
  });

  it('rejects a missing hotspot without running an action', () => {
    const scene = createScene([createHotspot({ castId: 12 })]);

    const result = executeHarnessHotspotClick({
      scene,
      gamestates: createGamestatesAccessor({}),
      hotspot: {
        ...summarizeHotspot(createHotspot({ castId: 99 })),
        bounds: { left: 900, right: 950, top: 100, bottom: 140 },
      },
      isPanoScene: false,
    });

    expect(result).toMatchObject({
      outcome: 'no_matching_hotspot',
      sceneId: 1050,
      castId: 99,
    });
  });

  it('rejects an inactive hotspot without running an action', () => {
    const hotspot = createHotspot({
      castId: 13,
      type: 2,
      param1: 7,
      comparators: [{ gameStateId: 7, testType: 0, value: 1 }],
    });
    const scene = createScene([hotspot]);

    const result = executeHarnessHotspotClick({
      scene,
      gamestates: createGamestatesAccessor({
        7: { stateId: 7, value: 0 },
      }),
      hotspot: summarizeHotspot(hotspot),
      isPanoScene: false,
    });

    expect(result).toMatchObject({
      outcome: 'hotspot_inactive',
      sceneId: 1050,
      castId: 13,
    });
  });

  it('derives a click position inside a wraparound hotspot', () => {
    const hotspot = createHotspot({
      rectLeft: 3500,
      rectRight: 100,
      rectTop: 20,
      rectBottom: 60,
    });

    expect(getHotspotClickPosition(hotspot)).toEqual({
      top: 40,
      left: 0,
    });
  });

  it('matches duplicate cast ids by exact hotspot selector', () => {
    const wrongHotspot = createHotspot({
      castId: 0,
      type: 0,
      param1: 105001,
      rectLeft: 20,
      rectRight: 60,
    });
    const targetHotspot = createHotspot({
      castId: 0,
      type: 0,
      param1: 105002,
      rectLeft: 120,
      rectRight: 180,
    });
    const scene = createScene([wrongHotspot, targetHotspot]);

    const result = executeHarnessHotspotClick({
      scene,
      gamestates: createGamestatesAccessor({}),
      hotspot: summarizeHotspot(targetHotspot),
      isPanoScene: false,
    });

    expect(result.outcome).toBe('applied');
    if (result.outcome !== 'applied') {
      throw new Error('Expected applied result');
    }
    expect(result.actionResult.sceneTransition?.sceneId).toBe(105002);
    expect(result.matchedHotspot.bounds.left).toBe(120);
  });

  it('rejects non-click gestures without running an action', () => {
    const hotspot = createHotspot({
      castId: 14,
      gesture: 3,
      type: 0,
      param1: 105001,
    });
    const scene = createScene([hotspot]);

    const result = executeHarnessHotspotClick({
      scene,
      gamestates: createGamestatesAccessor({}),
      hotspot: summarizeHotspot(hotspot),
      isPanoScene: false,
    });

    expect(result).toMatchObject({
      outcome: 'unsupported_gesture',
      sceneId: 1050,
      castId: 14,
    });
  });
});
