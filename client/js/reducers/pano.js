import {
  PANO_CANVAS_CREATED,
  PANO_GEOMETRIES_CREATE,
  PANO_OBJECT_CREATE,
  PANO_MATERIALS_CREATE,
  PANO_ROTATION,
  PANO_SET_SENSITIVITY,
  PANO_CAMERA_CREATE,
  PANO_SCENE_CREATE,
  PANO_CAMERA_POSITION,
  PANO_RENDER_LOOP,
  PANO_RENDERER_CREATE,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  sensitivity: 50,
  controlType: 'touch',
  rotation: {
    x: 0,
    y: 0,
  },
  interactionDebounce: 5,
}, {
  [PANO_CANVAS_CREATED](scene, { payload: canvas }) {
    return {
      ...scene,
      canvas,
    };
  },
  [PANO_GEOMETRIES_CREATE](pano, { payload: geometries }) {
    return {
      ...pano,
      geometries,
    };
  },
  [PANO_OBJECT_CREATE](pano, { payload: object3D }) {
    return {
      ...pano,
      object3D,
    };
  },
  [PANO_MATERIALS_CREATE](pano, { payload: materials }) {
    return {
      ...pano,
      materials,
    };
  },
  [PANO_ROTATION](pano, { payload: rotation }) {
    return {
      ...pano,
      rotation,
    };
  },
  [PANO_SET_SENSITIVITY](pano, { payload: sensitivity }) {
    return {
      ...pano,
      sensitivity
    };
  },
  [PANO_SCENE_CREATE](pano, { payload: scene3D }) {
    return {
      ...pano,
      scene3D,
    };
  },
  [PANO_CAMERA_CREATE](pano, { payload: camera }) {
    return {
      ...pano,
      camera,
    };
  },
  [PANO_CAMERA_POSITION](pano, { payload: vector3 }) {
    const { cameraPosition } = pano;
    return {
      ...pano,
      cameraPosition: {
        ...cameraPosition,
        vector3,
      },
    };
  },
  [PANO_RENDERER_CREATE](pano, { payload: renderer }) {
    return {
      ...pano,
      renderer,
    };
  },
  [PANO_RENDER_LOOP](pano, { payload: renderLoop }) {
    return {
      ...pano,
      renderLoop,
    };
  },
});

export default reducer;
