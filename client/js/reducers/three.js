import createReducer from './createReducer';
import {
  THREE_SCENE_CREATE,
  THREE_CAMERA_CREATE,
  THREE_RENDERER_CREATE,
  THREE_CAMERA_TRANSLATE,
} from '../actions/types';

const reducer = createReducer({
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
  [THREE_CAMERA_TRANSLATE](three, { payload: camera }) {
    
  },
  [THREE_RENDERER_CREATE](three, { payload: renderer }) {
    return {
      ...three,
      renderer,
    };
  },
  // [THREE_SCENE_CREATE](state, payload, { scene }) {
  //   let three = state;
  //   const { canvas, data } = scene;
  //   if (canvas && data) {
  //     three = createScene({
  //       canvas,
  //       data,
  //     });
  //
  //     const { camera, hotspots, pano } = three;
  //
  //     camera.position.z = -0.20;
  //     renderer(() => {
  //       hotspots.object3D.rotation.y += 0.005;
  //       pano.object3D.rotation.y += 0.005;
  //       three.render();
  //     });
  //   }
  //   return three;
  // },
});

export default reducer;
