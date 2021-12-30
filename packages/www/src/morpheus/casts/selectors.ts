import { flow, partialRight, filter, entries, map } from 'lodash';
import cache from './cache';
import { Scene } from './types';
import {
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  PRELOAD,
  UNLOADING,
} from './actionTypes';

function allSceneIdsForStatus(status: string) {
  return flow(
    () => cache,
    entries,
    partialRight(
      filter,
      ([sceneId, cacheEntry]: [string, any]) =>
        sceneId && cacheEntry.status === status
    ),
    partialRight(map, ([sceneId]: [string]) => Number(sceneId))
  );
}

export const preloadedSceneIds = allSceneIdsForStatus(PRELOAD);

export function forScene(scene: Scene) {
  const selectCastCacheForThisScene = () =>
    (scene && cache[scene.sceneId]) || {};

  const forStatus = (status: String) =>
    selectCastCacheForThisScene().status === status;

  const castSelectors = {
    cache: selectCastCacheForThisScene,
    isLoading: forStatus(LOADING),
    isEntering: forStatus(ENTERING),
    isOnStage: forStatus(ON_STAGE),
    isExiting: forStatus(EXITING),
    isUnloading: forStatus(UNLOADING),
    isPreloading: forStatus(PRELOAD),
  };

  return castSelectors;
}
