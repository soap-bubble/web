import { isActive } from '@soapbubble/morpheus-client';
import type { Hotspot } from 'morpheus/casts/types';

import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { HotspotActionResult } from './handleHotspotAction';
import { withGamestateUpdates } from './hotspotEligibility';
import { gesture } from './matchers';

export function resolveAlwaysHotspotActions(params: {
  hotspots: Hotspot[];
  gamestates: GamestatesAccessor;
  execute: (
    hotspot: Hotspot,
    gamestates: GamestatesAccessor,
  ) => HotspotActionResult;
}): HotspotActionResult[] {
  const { hotspots, execute } = params;
  let currentGamestates = params.gamestates;
  const results: HotspotActionResult[] = [];

  for (const hotspot of hotspots) {
    if (
      hotspot.castId !== 0 ||
      !gesture.isAlways(hotspot) ||
      !isActive({ cast: hotspot, gamestates: currentGamestates })
    ) {
      continue;
    }

    const result = execute(hotspot, currentGamestates);
    results.push(result);
    currentGamestates = withGamestateUpdates(
      currentGamestates,
      result.gamestateUpdates,
    );

    if (result.allDone) {
      break;
    }
  }

  return results;
}

export function resolveSceneEntryHotspotActions(params: {
  hotspots: Hotspot[];
  gamestates: GamestatesAccessor;
  skipSceneEnter: boolean;
  execute: (
    hotspot: Hotspot,
    gamestates: GamestatesAccessor,
  ) => HotspotActionResult;
}): HotspotActionResult[] {
  const { hotspots, execute } = params;
  let currentGamestates = params.gamestates;
  const results: HotspotActionResult[] = [];

  if (!params.skipSceneEnter) {
    for (const hotspot of hotspots) {
      if (
        !gesture.isSceneEnter(hotspot) ||
        !isActive({ cast: hotspot, gamestates: currentGamestates })
      ) {
        continue;
      }

      const result = execute(hotspot, currentGamestates);
      results.push(result);
      currentGamestates = withGamestateUpdates(
        currentGamestates,
        result.gamestateUpdates,
      );
    }
  }

  return results.concat(
    resolveAlwaysHotspotActions({
      hotspots,
      gamestates: currentGamestates,
      execute,
    }),
  );
}
