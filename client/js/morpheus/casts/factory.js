import React from 'react';
import {
  head,
  tail,
  reverse,
} from 'lodash';
import { createSelector } from 'reselect';
import {
  selectors as sceneSelectors,
  getSceneType,
} from 'morpheus/scene';

import { decorate as faderDecorator } from './components/Fader';
import Special from './components/Special';
import Pano from './components/Pano';
import Sound from './components/Sound';

function createSceneMapper(map) {
  return sceneData => map[getSceneType(sceneData)];
}

export const createLiveSceneSelector = createSceneMapper({
  panorama: Pano,
  special: Special,
});

export const createEnteringSceneSelector = createSceneMapper({
  panorama: Pano,
});

export const createExitingSceneSelector = createSceneMapper({
  panorama: Pano,
  special: Special,
});

export default createSelector(
  sceneSelectors.currentScenesData,
  sceneSelectors.isEntering,
  sceneSelectors.isLive,
  sceneSelectors.isExiting,
  sceneSelectors.dissolve,
  (currentScenes, _isEntering, _isLive, _isExiting, dissolve) => {
    let scenes = [];
    const current = head(currentScenes);
    const previouses = reverse(tail(currentScenes));
    const CurrentScene = createLiveSceneSelector(current);
    const EnteringScene = createEnteringSceneSelector(current);
    const CurrentExitingScene = createExitingSceneSelector(current);
    const PreviousScenes = previouses.map(createExitingSceneSelector);
    let previousScene;
    if (PreviousScenes.length) {
      previousScene = PreviousScenes.map((PreviousScene, index) => (
        <PreviousScene key={`scene${previouses[index].sceneId}`} scene={previouses[index]} />
      ));
      scenes = scenes.concat(previousScene);
    }
    if (_isLive && CurrentScene) {
      if (previousScene && dissolve) {
        const Fader = faderDecorator(<CurrentScene scene={current} />);
        scenes.push(<Fader key={`scene${current.sceneId}`} />);
      } else {
        scenes.push(<CurrentScene key={`scene${current.sceneId}`} scene={current} />);
      }
    }
    if (_isEntering && EnteringScene) {
      scenes.push(<EnteringScene key={`scene${current.sceneId}`} scene={current} />);
    }
    if (_isExiting && CurrentExitingScene) {
      scenes.push(<CurrentExitingScene key={`scene${current.sceneId}`} scene={current} />);
    }
    scenes.push(<Sound key="sound" scene={current} />);
    console.log(current && current.sceneId, scenes);
    return scenes;
  },
);
