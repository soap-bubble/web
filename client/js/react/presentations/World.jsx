import React from 'react';
import Scene from '../containers/Scene';
import Hotspots from '../containers/HotspotsHitDetector';
import Tools from '../containers/Tools';

const World = () => {
  return (
    <div>
      <Hotspots />
      <Scene />
      <Tools />
    </div>
  );
};

export default World;
