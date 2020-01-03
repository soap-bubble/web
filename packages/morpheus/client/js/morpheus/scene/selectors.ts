import {
  get,
} from 'lodash';
import { createSelector } from 'reselect';

export const backgroundSceneData = (state: any) => state.scene.get('backgroundScene');
export const currentScenesData = (state: any) => state.scene.get('currentScenes');
export const currentSceneData = (state: any) => state.scene.get('currentScene');
export const previousSceneData = (state: any) => state.scene.get('previousScene');
export const isEntering = (state: any) => state.scene.get('status') === 'entering';
export const isExiting = (state: any) => state.scene.get('status') === 'exiting';
export const isLive = (state: any) => state.scene.get('status') === 'live';
export const sceneFromCache = (sceneIdMixed: number|string) => {
  const sceneId = Number(sceneIdMixed);
  return (state: any) => get(state.scene.get('cache').toIndexedSeq()
      .find((scene: any) => get(scene, 'data.sceneId') === sceneId), 'data');
};
export const loadingScenes = (state: any) => state.scene.get('cache').toIndexedSeq()
  .filter((scene: any) => scene.status === 'loading');
export const loadedScenes = (state: any) => state.scene.get('loadedScenes').toJS();
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
export const nextSceneStartAngle = (state: any) => state.scene.get('nextStartAngle');
export const dissolve = (state: any) => state.scene.get('dissolve');
