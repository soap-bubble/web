import {
  PANO_GEOMETRIES_CREATE,
  PANO_OBJECT_CREATE,
  PANO_MATERIALS_CREATE,
  PANO_ROTATION,
  PANO_SET_SENSITIVITY,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  sensitivity: 100,
  controlType: 'touch',
  rotation: {
    x: 0,
    y: 0,
  },
  interactionDebounce: 5,
}, {
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
  [PANO_ROTATION](scene, { payload: rotation }) {
    return {
      ...scene,
      rotation,
    };
  },
  [PANO_SET_SENSITIVITY](scene, { payload: sensitivity }) {
    return {
      ...scene,
      sensitivity
    };
  },
});

export default reducer;
