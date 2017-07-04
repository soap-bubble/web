import React from 'react';
import { createSelector } from 'reselect';
import {
  selectors as sceneSelectors,
  getSceneType,
} from 'morpheus/scene';

import Special from './components/Special';
import Pano from './components/Pano';
import Transition from './components/Transition';

function createSceneMapper(map) {
  return sceneData => map[getSceneType(sceneData)];
}
export const createLiveSceneSelector = createSceneMapper({
  panorama: [<Pano key="scene:pano" />],
  special: [<Special key="scene:special" />],
  transition: [<Transition key="scene:video" />],
});

export const createEnteringSceneSelector = createSceneMapper({
  panorama: [<Pano key="scene:pano" />],
  // special: [<Special key="scene:special" />],
  // transition: [<Transition key="scene:video" />],
});

export const createExitingSceneSelector = createSceneMapper({
  panorama: [<Pano key="scene:pano" />],
  // special: [<Special key="scene:special" />],
  transition: [<Transition key="scene:video" />],
});

export default createSelector(
  sceneSelectors.currentSceneData,
  sceneSelectors.previousSceneData,
  sceneSelectors.isEntering,
  sceneSelectors.isLive,
  sceneSelectors.isExiting,
  (current, previous, _isEntering, _isLive, _isExiting) => {
    const scenes = [];
    // console.log(getSceneType(current));
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
    return scenes;
  },
);
