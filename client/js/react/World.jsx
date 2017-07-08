import { connect } from 'react-redux';
import React from 'react';
import Special from 'react/Special';
import Scene3D from 'react/Scene3D';
import Transition from 'react/Transition';
import { createSelector } from 'reselect';
import {
  selectors as sceneSelectors,
  getSceneType,
} from 'morpheus/scene';
// import Tools from './Tools';
import Mouse from './Mouse';

const {
  currentSceneData,
  previousSceneData,
  isEntering,
  isLive,
  isExiting,
} = sceneSelectors;

function createSceneMapper(map) {
  return sceneData => map[getSceneType(sceneData)];
}
export const createLiveSceneSelector = createSceneMapper({
  panorama: [<Scene3D key="scene:pano" />],
  special: [<Special key="scene:special" />],
  transition: [<Transition key="scene:video" />],
});

export const createEnteringSceneSelector = createSceneMapper({
  special: [<Special key="scene:special" />],
  // transition: [<Transition key="scene:video" />],
});

export const createExitingSceneSelector = createSceneMapper({
  panorama: [<Scene3D key="scene:pano" />],
  special: [<Special key="scene:special" />],
  transition: [<Transition key="scene:video" />],
});


export const _currentScenes = createSelector(
  currentSceneData,
  previousSceneData,
  isEntering,
  isLive,
  isExiting,
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

function mapStateToProps(state) {
  return {
    currentScenes: _currentScenes(state),
  };
}

const World = ({
  currentScenes,
}) => {
  return (
    <div>
      {currentScenes}
      <Mouse />
      { /* process.env.NODE_ENV !== 'production' ? <Tools /> : null */ }
    </div>
  );
};

World.displayName = 'World';

export default connect(
  mapStateToProps,
)(World);
