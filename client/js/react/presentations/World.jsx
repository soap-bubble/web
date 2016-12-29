import React from 'react';
import Scene from '../containers/Scene';
import Hotspots from '../containers/HotspotsHitDetector';
import Tools from '../containers/Tools';
import Mouse from '../containers/Mouse';

const World = () => {
  return (
    <div>
      <Scene />
      <Hotspots />
      <Mouse />
      <Tools />
    </div>
  );
};

export default World;
