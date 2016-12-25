import {
  HOTSPOTS_POSITIONS_CREATE,
  HOTSPOTS_UVS_CREATE,
  HOTSPOTS_INDEX_CREATE,
  HOTSPOTS_GEOMETRY_CREATE,
  HOTSPOTS_MATERIAL_CREATE,
  HOTSPOTS_OBJECT_CREATE,
  HOTSPOTS_THETA,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  theta: -Math.PI / 2,
}, {
  [HOTSPOTS_POSITIONS_CREATE](hotspots, { payload: positions }) {
    return {
      ...hotspots,
      positions,
    };
  },
  [HOTSPOTS_UVS_CREATE](hotspots, { payload: uvs }) {
    return {
      ...hotspots,
      uvs,
    };
  },
  [HOTSPOTS_GEOMETRY_CREATE](hotspots, { payload: geometry }) {
    return {
      ...hotspots,
      geometry,
    };
  },
  [HOTSPOTS_INDEX_CREATE](hotspots, { payload: index }) {
    return {
      ...hotspots,
      index,
    };
  },
  [HOTSPOTS_MATERIAL_CREATE](hotspots, { payload: material }) {
    return {
      ...hotspots,
      material,
    };
  },
  [HOTSPOTS_OBJECT_CREATE](hotspots, { payload: object3D }) {
    return {
      ...hotspots,
      object3D,
    };
  },
  [HOTSPOTS_THETA](hotspots, { payload: theta }) {
    return {
      ...hotspots,
      theta,
    }
  }
});

export default reducer;
