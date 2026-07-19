import type { Hotspot } from 'morpheus/casts/types';

import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import {
  handleHotspotAction,
  type HotspotActionResult,
} from './handleHotspotAction';

type Position = { top: number; left: number };

export function handleSliderDrag(params: {
  hotspots: Hotspot[];
  gamestates: GamestatesAccessor;
  currentPosition: Position;
  startingPosition: Position;
  oldValues: ReadonlyMap<number, number>;
  isPanoScene: boolean;
}): HotspotActionResult['gamestateUpdates'] {
  const {
    hotspots,
    gamestates,
    currentPosition,
    startingPosition,
    oldValues,
    isPanoScene,
  } = params;
  const updatesByState = new Map<number, number>();
  const transientGamestates: GamestatesAccessor = {
    byId(stateId) {
      const gamestate = gamestates.byId(stateId);
      const transientValue = updatesByState.get(stateId);
      return transientValue === undefined
        ? gamestate
        : { ...gamestate, value: transientValue };
    },
  };

  for (const hotspot of hotspots) {
    const result = handleHotspotAction({
      hotspot,
      gamestates: transientGamestates,
      currentPosition,
      startingPosition,
      isPanoScene,
      oldValue: oldValues.get(hotspot.param1),
    });

    for (const update of result.gamestateUpdates) {
      updatesByState.set(update.stateId, update.value);
    }
  }

  return Array.from(updatesByState, ([stateId, value]) => ({ stateId, value }));
}
