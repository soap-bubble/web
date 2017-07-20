import React from 'react';
import { decorate as faderDecorator } from './components/Fader';
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
  panorama: Pano,
  special: Special,
  transition: Transition,
});

export const createEnteringSceneSelector = createSceneMapper({
  panorama: Pano,
  // special: Special,
  // transition: Transition,
});

export const createExitingSceneSelector = createSceneMapper({
  panorama: Pano,
  special: Special,
  transition: Transition,
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
        const Fader = faderDecorator(<PreviousScene scene={previous} />, <CurrentScene scene={current} />);
        scenes.push(<Fader />);
      } else {
        scenes.push(<CurrentScene fading={'out'} scene={current} fading={'in'}/>);
      }
    }
    if (_isEntering && EnteringScene) {
      scenes.push(<EnteringScene scene={current}/>);
    }
    if (_isEntering && PreviousScene) {
      scenes.push(<PreviousScene scene={previous}/>);
    }
    if (_isExiting && CurrentExitingScene) {
      scenes.push(<CurrentExitingScene scene={current}/>);
    }
    return scenes;
  },
);
