import { describe, expect, it } from 'vitest';

import {
  createGamestatesAccessor,
  createHotspot,
  createScene,
} from './harnessClick.fixtures';
import {
  getActiveHotspots,
  getHotspotCandidates,
  withGamestateUpdates,
} from './hotspotEligibility';

describe('hotspot eligibility during pointer events', () => {
  it('recognizes authored hotspots that omit the runtime discriminator', () => {
    const authoredHotspot = createHotspot({ castId: 42 });
    Object.defineProperty(authoredHotspot, '__t', {
      value: undefined,
      configurable: true,
    });

    expect(getHotspotCandidates(createScene([authoredHotspot]))).toEqual([
      authoredHotspot,
    ]);
  });

  it('keeps inactive Always hotspots eligible for later gamestate updates', () => {
    const launchHotspot = createHotspot({
      castId: 0,
      gesture: 6,
      type: 0,
      param1: 105094,
      comparators: [{ gameStateId: 1022, testType: 2, value: 8 }],
    });
    const gamestates = createGamestatesAccessor({
      1022: { value: 7, maxValue: 10 },
    });
    const candidates = getHotspotCandidates(createScene([launchHotspot]));

    expect(candidates).toEqual([launchHotspot]);
    expect(getActiveHotspots(candidates, gamestates)).toEqual([]);

    const updatedGamestates = withGamestateUpdates(gamestates, [
      { stateId: 1022, value: 10 },
    ]);

    expect(getActiveHotspots(candidates, updatedGamestates)).toEqual([
      launchHotspot,
    ]);
  });
});
