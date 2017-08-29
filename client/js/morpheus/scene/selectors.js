import {
  get,
  values,
} from 'lodash';
import { createSelector } from 'reselect';

export const backgroundSceneData = state => state.scene.backgroundScene;
export const currentSceneData = state => state.scene.currentScene;
export const previousSceneData = state => state.scene.previousScene;
export const isEntering = state => state.scene.status === 'entering';
export const isExiting = state => state.scene.status === 'exiting';
export const isLive = state => state.scene.status === 'live';
export const loadingScenes = state => values(state.scene.cache)
  .filter(scene => scene.status === 'loading');
export const loadedScenes = state => values(state.scene.cache)
  .filter(scene => !(scene.status === 'loading' || scene.status === 'unloaded'));
export const currentSceneId = createSelector(
  currentSceneData,
  cs => get(cs, 'sceneId'),
);
export const currentSceneType = createSelector(
  currentSceneData,
  cs => get(cs, 'sceneType'),
);
export const previousSceneType = createSelector(
  previousSceneData,
  ps => get(ps, 'sceneType'),
);
export const previousSceneId = createSelector(
  previousSceneData,
  cs => get(cs, 'sceneId'),
);
export const nextSceneStartAngle = state => state.scene.nextStartAngle;
export const dissolve = state => state.scene.dissolve;
