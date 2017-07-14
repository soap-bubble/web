import {
  get,
} from 'lodash';
import { createSelector } from 'reselect';

export const backgroundSceneData = state => state.scene.backgroundScene;
export const currentSceneData = state => state.scene.currentScene;
export const previousSceneData = state => state.scene.previousScene;
export const isEntering = state => state.scene.status === 'entering';
export const isExiting = state => state.scene.status === 'exiting';
export const isLive = state => state.scene.status === 'live';
export const loadedScenes = state => state.scene.loadedScenes;
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
export const nextSceneStartAngle = state => state.scene.nextStartAngle;
