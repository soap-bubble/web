import { flow, partialRight, filter, entries, map } from 'lodash'
import cache from './cache'
// @ts-ignore
import * as modules from './modules'
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

  const castSelectors = {
    cache: selectCastCacheForThisScene,
    isLoading: forStatus(LOADING),
    isEntering: forStatus(ENTERING),
    isOnStage: forStatus(ON_STAGE),
    isExiting: forStatus(EXITING),
    isUnloading: forStatus(UNLOADING),
    isPreloading: forStatus(PRELOAD),
  }
  const moduleSelectors = Object.keys(modules).reduce((memo, name) => {
    if (modules[name].selectors) {
      memo[name] = modules[name].selectors
    }
    return memo
  }, {} as { [key: string]: any })
  Object.defineProperties(
    castSelectors,
    Object.keys(moduleSelectors).reduce(
      (memo, name) =>
        Object.assign(memo, {
          [name]: {
            get() {
              return moduleSelectors[name](scene)
            },
          },
        }),
      {}
    )
  )

  return castSelectors
}
