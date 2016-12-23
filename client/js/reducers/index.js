import scene from './scene';
import three from './three';
import dimensions from './dimensions';

const initialState = {
};

export default function (state = initialState, action) {
  return {
    scene: scene(state, 'scene', action),
    three: three(state, 'three', action),
    dimensions: dimensions(state, 'dimensions', action),
  };
}
