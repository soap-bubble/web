import { values } from 'lodash';
import { connect } from 'react-redux';
import React from 'react';

import {
  getSceneType,
} from '../morpheus/scene';


import Tools from './Tools';
import Mouse from './Mouse';
import Special from './Special';
import Scene3D from './Scene3D';
import Transition from './Transition';
import loggerFactory from '../utils/logger';

const logger = loggerFactory('World');

function mapStateToProps({ scene, transition }) {
  const { data: isTransitionLoading } = transition;
  const { cache, current, loaded } = scene;
  const currentSceneData = cache[current];
  const loadedSceneData = cache[loaded];
  return {
    currentSceneData,
    loadedSceneData,
    isTransitionLoading,
  };
}

const World = ({
  currentSceneData,
  loadedSceneData,
  isTransitionLoading,
}) => {
  let actors = [];

  const currentSceneActorMap = {
    panorama: [<Scene3D key="scene:pano" />],
    special: [<Special key="scene:special" />],
    transition: [<Transition key="scene:video" />],
  };

  const loadedSceneActorMap = {
    special: [<Special key="scene:special" />],
    transition: [<Transition key="scene:video" />],
  };

  const currentSceneType = getSceneType(currentSceneData);
  const loadedSceneType = getSceneType(loadedSceneData);

  if (currentSceneType) {
    actors = actors.concat(currentSceneActorMap[currentSceneType]);
  }

  if (currentSceneType !== loadedSceneType && loadedSceneActorMap[loadedSceneType]) {
    actors = actors.concat(loadedSceneActorMap[loadedSceneType]);
  }

  // if (sceneType !== 'transition' && isTransitionLoading) {
  //   logger.info('Offscreen video loading');
  //   actors = actors.concat(<Transition key="scene:video" />);
  // }

  return (
    <div>
      {actors}
      <Mouse />
      <Tools />
    </div>
  );
};

World.displayName = 'World';

export default connect(
  mapStateToProps,
)(World);
