import {
  PANO_GEOMETRY_CREATE,
  PANO_OBJECT_CREATE,
  PANO_MATERIALS_CREATE,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({}, {
  [PANO_GEOMETRY_CREATE](pano, { payload: geometries }) {
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
});

export default reducer;
