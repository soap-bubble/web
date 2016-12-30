import React from 'react';
import Scene from './Scene';
import Hotspots from './HotspotsHitDetector';
import Tools from './Tools';
import Mouse from './Mouse';

const World = () => {
  return (
    <div>
      <Hotspots />
      <Scene />
      <Mouse />
      <Tools />
    </div>
  );
};

export default World;
