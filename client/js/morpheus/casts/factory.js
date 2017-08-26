import React from 'react';
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
  sceneSelectors.currentSceneData,
  sceneSelectors.previousSceneData,
  sceneSelectors.isEntering,
  sceneSelectors.isLive,
  sceneSelectors.isExiting,
  (current, previous, _isEntering, _isLive, _isExiting) => {
    const scenes = [];
    // console.log(getSceneType(current));
    const CurrentScene = createLiveSceneSelector(current);
    const EnteringScene = createEnteringSceneSelector(current);
    const CurrentExitingScene = createExitingSceneSelector(current);
    const PreviousScene = createExitingSceneSelector(previous);
    if (_isLive && CurrentScene) {
      if (PreviousScene) {
        const Fader = faderDecorator(
          <PreviousScene scene={previous} />, <CurrentScene scene={current} />,
        );
        scenes.push(<Fader />);
      } else {
        scenes.push(<CurrentScene scene={current} />);
      }
    }
    if (_isEntering && EnteringScene) {
      scenes.push(<EnteringScene scene={current} />);
    }
    if (_isEntering && PreviousScene) {
      scenes.push(<PreviousScene scene={previous} />);
    }
    if (_isExiting && CurrentExitingScene) {
      scenes.push(<CurrentExitingScene scene={current} />);
    }
    scenes.push(<Sound key="sound" scene={current} />);
    return scenes;
  },
);
