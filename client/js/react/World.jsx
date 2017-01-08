import { connect } from 'react-redux';
import React from 'react';

import {
  SCENE_TYPE_LIST,
} from '../morpheus/scene';
import Pano from './Pano';
import Hotspots3D from './Hotspots3D';
import Tools from './Tools';
import Mouse from './Mouse';
import FullScreenVideo from './FullScreenVideo';

function mapStateToProps({ scene }) {
  const { data: sceneData } = scene;
  const sceneType = sceneData ? SCENE_TYPE_LIST[sceneData.sceneType] : 'none';
  return {
    sceneType,
  };
}

const World = ({
  sceneType,
}) => {
  let actors = [];
  const sceneActorMap = {
    panorama: [<Hotspots3D key='scene:hotspots'/>, <Pano key='scene'/>],
    transition: [<FullScreenVideo key='scene:video' />]
  };

  if (sceneActorMap[sceneType]) {
    actors = actors.concat(sceneActorMap[sceneType]);
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
