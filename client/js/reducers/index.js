import scene from './scene';
import dimensions from './dimensions';
import pano from './pano';
import hotspots from './hotspots';

const initialState = {
};

export default function (state = initialState, action) {
  return {
    scene: scene(state, 'scene', action),
    dimensions: dimensions(state, 'dimensions', action),
    pano: pano(state, 'pano', action),
    hotspots: hotspots(state, 'hotspots', action),
  };
}
