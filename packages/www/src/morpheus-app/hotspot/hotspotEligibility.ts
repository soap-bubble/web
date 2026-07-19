import { isActive } from '@soapbubble/morpheus-client';
import { isHotspot } from 'morpheus/casts/matchers';
import type { Hotspot, Scene } from 'morpheus/casts/types';

import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { HotspotActionResult } from './handleHotspotAction';

export function getHotspotCandidates(
  scene: Pick<Scene, 'casts'>,
): Hotspot[] {
  return scene.casts.filter(isHotspot) as Hotspot[];
}

export function getActiveHotspots(
  hotspots: Hotspot[],
  gamestates: GamestatesAccessor,
): Hotspot[] {
  return hotspots.filter((cast) => isActive({ cast, gamestates }));
}

export function withGamestateUpdates(
  gamestates: GamestatesAccessor,
  updates: HotspotActionResult['gamestateUpdates'],
): GamestatesAccessor {
  if (updates.length === 0) {
    return gamestates;
  }

  const valuesByState = new Map(
    updates.map(({ stateId, value }) => [stateId, value]),
  );

  return {
    byId(stateId) {
      const gamestate = gamestates.byId(stateId);
      const value = valuesByState.get(stateId);
      return value === undefined ? gamestate : { ...gamestate, value };
    },
  };
}
