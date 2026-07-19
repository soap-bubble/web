import { ACTION_TYPES, GESTURES } from 'morpheus/constants';
import { isActive } from 'morpheus/gamestate/isActive';
import type { Hotspot, Scene } from 'morpheus/casts/types';

import { handleHotspotAction, type HotspotActionResult } from './handleHotspotAction';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { ClickHotspotMatchedHotspot } from '@/lib/game-control-protocol';
import { isHotspotCandidate } from './hotspotEligibility';

type Position = { top: number; left: number };

export type HarnessClickAppliedResult = {
  outcome: 'applied';
  sceneId: number;
  castId: number;
  clickPosition: Position;
  matchedHotspot: ClickHotspotMatchedHotspot;
  actionResult: HotspotActionResult;
};

export type HarnessClickRejectedResult = {
  outcome: 'no_matching_hotspot' | 'hotspot_inactive' | 'unsupported_gesture';
  sceneId: number;
  castId: number;
  matchedHotspot?: ClickHotspotMatchedHotspot;
  message: string;
};

export type HarnessClickResult =
  | HarnessClickAppliedResult
  | HarnessClickRejectedResult;

function normalizeHorizontalPosition(left: number): number {
  let next = left;
  while (next < 0) {
    next += 3600;
  }
  while (next >= 3600) {
    next -= 3600;
  }
  return next;
}

export function getHotspotClickPosition(hotspot: Hotspot): Position {
  if (
    hotspot.rectTop === 0 &&
    hotspot.rectBottom === 0 &&
    hotspot.rectLeft === 0 &&
    hotspot.rectRight === 0
  ) {
    return { top: 0, left: 0 };
  }

  const right =
    hotspot.rectRight > hotspot.rectLeft
      ? hotspot.rectRight
      : hotspot.rectRight + 3600;
  return {
    top: (hotspot.rectTop + hotspot.rectBottom) / 2,
    left: normalizeHorizontalPosition(hotspot.rectLeft + (right - hotspot.rectLeft) / 2),
  };
}

export function summarizeHotspot(hotspot: Hotspot): ClickHotspotMatchedHotspot {
  const actionType = ACTION_TYPES[hotspot.type] ?? `Unknown(${hotspot.type})`;
  const gesture = GESTURES[hotspot.gesture] ?? `Unknown(${hotspot.gesture})`;
  const targetSceneId =
    actionType === 'ChangeScene' || actionType === 'DissolveTo'
      ? hotspot.param1
      : null;

  return {
    castId: hotspot.castId,
    bounds: {
      left: hotspot.rectLeft,
      right: hotspot.rectRight,
      top: hotspot.rectTop,
      bottom: hotspot.rectBottom,
    },
    actionType,
    gesture,
    targetSceneId,
  };
}

function matchesRequestedHotspot(params: {
  hotspot: Hotspot;
  requestHotspot: ClickHotspotMatchedHotspot;
}): boolean {
  const { hotspot, requestHotspot } = params;
  const summary = summarizeHotspot(hotspot);
  return (
    summary.castId === requestHotspot.castId &&
    summary.bounds.left === requestHotspot.bounds.left &&
    summary.bounds.right === requestHotspot.bounds.right &&
    summary.bounds.top === requestHotspot.bounds.top &&
    summary.bounds.bottom === requestHotspot.bounds.bottom &&
    summary.actionType === requestHotspot.actionType &&
    summary.gesture === requestHotspot.gesture &&
    summary.targetSceneId === requestHotspot.targetSceneId
  );
}

export function executeHarnessHotspotClick(params: {
  scene: Scene;
  gamestates: GamestatesAccessor;
  hotspot: ClickHotspotMatchedHotspot;
  previousSceneId?: number;
  isPanoScene: boolean;
}): HarnessClickResult {
  const {
    scene,
    gamestates,
    hotspot: requestHotspot,
    previousSceneId,
    isPanoScene,
  } = params;
  const castId = requestHotspot.castId;
  const hotspot = scene.casts
    .filter(isHotspotCandidate)
    .find((cast) => matchesRequestedHotspot({ hotspot: cast, requestHotspot }));

  if (!hotspot) {
    return {
      outcome: 'no_matching_hotspot',
      sceneId: scene.sceneId,
      castId,
      message: `No exact hotspot match for castId ${castId} exists in active scene ${scene.sceneId}.`,
    };
  }

  const matchedHotspot = summarizeHotspot(hotspot);
  if (matchedHotspot.gesture !== 'MouseClick') {
    return {
      outcome: 'unsupported_gesture',
      sceneId: scene.sceneId,
      castId,
      matchedHotspot,
      message: `Hotspot ${castId} uses ${matchedHotspot.gesture}; harness clicks currently support MouseClick hotspots only.`,
    };
  }

  if (!isActive({ cast: hotspot, gamestates })) {
    return {
      outcome: 'hotspot_inactive',
      sceneId: scene.sceneId,
      castId,
      matchedHotspot,
      message: `Hotspot ${castId} is inactive in active scene ${scene.sceneId}.`,
    };
  }

  const clickPosition = getHotspotClickPosition(hotspot);
  const actionResult = handleHotspotAction({
    hotspot,
    gamestates,
    currentPosition: clickPosition,
    startingPosition: clickPosition,
    previousSceneId,
    isPanoScene,
  });

  return {
    outcome: 'applied',
    sceneId: scene.sceneId,
    castId,
    clickPosition,
    matchedHotspot,
    actionResult,
  };
}
