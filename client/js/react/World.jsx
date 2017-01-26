import { values } from 'lodash';
import { connect } from 'react-redux';
import React from 'react';

import {
  SCENE_TYPE_LIST,
} from '../morpheus/scene';
import Pano from './Pano';
import Hotspots3D from './Hotspots3D';
import Tools from './Tools';
import Mouse from './Mouse';
import Transition from './Transition';
import loggerFactory from '../utils/logger';

const logger = loggerFactory('World');

function mapStateToProps({ scene, transition }) {
  const { data: isTransitionLoading } = transition;
  const { cache, current } = scene;
  const sceneData = cache[current];
  const sceneType = sceneData ? SCENE_TYPE_LIST[sceneData.sceneType] : 'none';
  return {
    sceneType,
    isTransitionLoading,
  };
}

const World = ({
  sceneType,
  isTransitionLoading,
}) => {
  let actors = [];

  logger.info(`World render ${sceneType}`);

  const sceneActorMap = {
    panorama: [<Hotspots3D key="scene:hotspots" />, <Pano key="scene" />],
    transition: [<Transition key="scene:video" />],
  };

  if (sceneActorMap[sceneType]) {
    actors = actors.concat(sceneActorMap[sceneType]);
  }

  if (sceneType !== 'transition' && isTransitionLoading) {
    logger.info('Offscreen video loading');
    actors = actors.concat(<Transition key="scene:video" />);
  }

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
