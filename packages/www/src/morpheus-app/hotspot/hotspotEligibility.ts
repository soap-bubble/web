import { isActive } from '@soapbubble/morpheus-client';
import type { Hotspot, Scene, SceneCasts } from 'morpheus/casts/types';

import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { HotspotActionResult } from './handleHotspotAction';

const HOTSPOT_NUMBER_FIELDS = [
  'rectLeft',
  'rectRight',
  'rectTop',
  'rectBottom',
  'gesture',
  'type',
] as const;

function hasNumericOwnProperty(value: object, key: string): boolean {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return typeof descriptor?.value === 'number';
}

export function isHotspotCandidate(cast: SceneCasts): cast is Hotspot {
  return (
    cast.__t === 'Hotspot' ||
    HOTSPOT_NUMBER_FIELDS.every((field) =>
      hasNumericOwnProperty(cast, field),
    )
  );
}

export function getHotspotCandidates(
  scene: Pick<Scene, 'casts'>,
): Hotspot[] {
  return scene.casts.filter(isHotspotCandidate);
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
