import createReducer from './createReducer';
import {
  THREE_SCENE_CREATE,
  THREE_CAMERA_CREATE,
  THREE_RENDERER_CREATE,
  THREE_CAMERA_TRANSLATE,
} from '../actions/types';

const reducer = createReducer({
  cameraPosition: { x: 0, y: 0, z: 0 },
}, {
  [THREE_SCENE_CREATE](three, { payload: scene }) {
    return {
      ...three,
      scene,
    };
  },
  [THREE_CAMERA_CREATE](three, { payload: camera }) {
    return {
      ...three,
      camera,
    };
  },
  [THREE_CAMERA_TRANSLATE](three, { payload: vector3 }) {
    const { cameraPosition } = three;
    return {
      ...three,
      cameraPosition: {
        ...cameraPosition,
        vector3,
      },
    };
  },
  [THREE_RENDERER_CREATE](three, { payload: renderer }) {
    return {
      ...three,
      renderer,
    };
  },
});

export default reducer;
