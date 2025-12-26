import { flow, partialRight, filter, entries, map } from 'lodash'
import cache from './cache'
// @ts-ignore
import modules from './modules'
import { Scene } from './types'
import {
  LOADING,
  ENTERING,
  EXITING,
  ON_STAGE,
  PRELOAD,
  UNLOADING,
} from './actionTypes'
import { createSelector } from 'reselect'

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
  )
}

export const preloadedSceneIds = allSceneIdsForStatus(PRELOAD)

export function forScene(scene: Scene) {
  const selectCastCacheForThisScene = () =>
    (scene && cache[scene.sceneId]) || {}

  const forStatus = (status: String) =>
    selectCastCacheForThisScene().status === status

  const moduleSelectorKeys = Object.keys(modules) as (keyof typeof modules)[]
  const castSelectors = {
    cache: selectCastCacheForThisScene,
    isLoading: forStatus(LOADING),
    isEntering: forStatus(ENTERING),
    isOnStage: forStatus(ON_STAGE),
    isExiting: forStatus(EXITING),
    isUnloading: forStatus(UNLOADING),
    isPreloading: forStatus(PRELOAD),
    ...moduleSelectorKeys.reduce((memo, name) => {
      if ('selectors' in modules[name] && modules[name].selectors) {
        memo[name] = modules[name].selectors
      }
      return memo
    }, {} as Record<keyof typeof modules, any>),
  }

  return castSelectors
}
