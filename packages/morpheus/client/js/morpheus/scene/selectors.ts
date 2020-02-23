import { get } from 'lodash'
import { createSelector } from 'reselect'

export const backgroundSceneData = (state: any) => state.scene.backgroundScene
export const currentScenesData = (state: any) => state.scene.currentScenes
export const currentSceneData = (state: any) => state.scene.currentScene
export const previousSceneData = (state: any) => state.scene.previousScene
export const isEntering = (state: any) => state.scene.status === 'entering'
export const isExiting = (state: any) => state.scene.status === 'exiting'
export const isLive = (state: any) => state.scene.status === 'live'
export const loadedScenes = (state: any) => state.scene.loadedScenes
export const currentSceneId = createSelector(currentSceneData, cs =>
  get(cs, 'sceneId')
)
export const currentSceneType = createSelector(currentSceneData, cs =>
  get(cs, 'sceneType')
)
export const previousSceneType = createSelector(previousSceneData, ps =>
  get(ps, 'sceneType')
)
export const previousSceneId = createSelector(previousSceneData, cs =>
  get(cs, 'sceneId')
)
export const nextSceneStartAngle = (state: any) => state.scene.nextStartAngle
export const dissolve = (state: any) => state.scene.dissolve
