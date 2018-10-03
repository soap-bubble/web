import {
  get,
} from 'lodash';
import { createSelector } from 'reselect';

export const backgroundSceneData = state => state.scene.get('backgroundScene');
export const currentScenesData = state => state.scene.get('currentScenes');
export const currentSceneData = state => state.scene.get('currentScene');
export const previousSceneData = state => state.scene.get('previousScene');
export const isEntering = state => state.scene.get('status') === 'entering';
export const isExiting = state => state.scene.get('status') === 'exiting';
export const isLive = state => state.scene.get('status') === 'live';
export const sceneFromCache = (sceneIdMixed) => {
  const sceneId = Number(sceneIdMixed);
  return state => get(state.scene.get('cache').toIndexedSeq()
      .find(scene => get(scene, 'data.sceneId') === sceneId), 'data');
};
export const loadingScenes = state => state.scene.get('cache').toIndexedSeq()
  .filter(scene => scene.status === 'loading');
export const loadedScenes = state => state.scene.get('loadedScenes').toJS();
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
export const nextSceneStartAngle = state => state.scene.get('nextStartAngle');
export const dissolve = state => state.scene.get('dissolve');
