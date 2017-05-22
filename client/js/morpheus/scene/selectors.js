import React from 'react';
import { createSelector } from 'reselect';
import Special from 'react/Special';
import Scene3D from 'react/Scene3D';
import Transition from 'react/Transition';
import {
  getSceneType,
} from 'morpheus/scene';

export const backgroundSceneData = createSelector(state => state.scene.backgroundScene);
export const currentSceneData = createSelector(state => state.scene.currentScene);
export const previousSceneData = createSelector(state => state.scene.previousScene);
export const isEntering = createSelector(state => state.scene.status === 'entering');
export const isExiting = createSelector(state => state.scene.status === 'exiting');
export const isLive = createSelector(state => state.scene.status === 'live');
export const currentSceneId = createSelector(
  currentSceneData,
  cs => cs.sceneId,
);
function createSceneMapper(map) {
  return createSelector(sceneData => map[getSceneType(sceneData)]);
}
export const createLiveSceneSelector = createSceneMapper({
  panorama: [<Scene3D key="scene:pano" />],
  special: [<Special key="scene:special" />],
  transition: [<Transition key="scene:video" />],
});

export const createEnteringSceneSelector = createSceneMapper({
  special: [<Special key="scene:special" />],
  transition: [<Transition key="scene:video" />],
});

export const createExitingSceneSelector = createSceneMapper({
  panorama: [<Scene3D key="scene:pano" />],
  special: [<Special key="scene:special" />],
  transition: [<Transition key="scene:video" />],
});

export const currentScenes = createSelector(
  currentSceneData,
  previousSceneData,
  isEntering,
  isLive,
  isExiting,
  (current, previous, _isEntering, _isLive, _isExiting) => {
    const scenes = [];
    const currentLiveScene = createLiveSceneSelector(current);
    const previousExitingScene = createExitingSceneSelector(previous);
    const currentEnteringScene = createEnteringSceneSelector(current);
    if (_isEntering && currentEnteringScene) {
      scenes.push(currentEnteringScene);
      if (previousExitingScene) {
        scenes.push(previousExitingScene);
      }
    }
    if (_isLive && currentLiveScene) {
      scenes.push(currentLiveScene);
    }
    if (_isExiting && previousExitingScene) {
      scenes.push(previousExitingScene);
    }
  },
);
