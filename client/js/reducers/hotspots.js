import {
  HOTSPOTS_CANVAS_CREATED,
  HOTSPOTS_VISIBLE_POSITIONS_CREATE,
  HOTSPOTS_VISIBLE_UVS_CREATE,
  HOTSPOTS_VISIBLE_INDEX_CREATE,
  HOTSPOTS_VISIBLE_GEOMETRY_CREATE,
  HOTSPOTS_HIT_POSITIONS_CREATE,
  HOTSPOTS_HIT_UVS_CREATE,
  HOTSPOTS_HIT_INDEX_CREATE,
  HOTSPOTS_HIT_GEOMETRY_CREATE,
  HOTSPOTS_HIT_MATERIAL_CREATE,
  HOTSPOTS_VISIBLE_MATERIAL_CREATE,
  HOTSPOTS_HIT_OBJECT_CREATE,
  HOTSPOTS_VISIBLE_OBJECT_CREATE,
  HOTSPOTS_THETA,
  HOTSPOTS_SET_VISIBILITY,
  HOTSPOTS_SCENE_CREATE,
  HOTSPOTS_CAMERA_CREATE,
  HOTSPOTS_CAMERA_TRANSLATE,
  HOTSPOTS_RENDERER_CREATE,
  HOTSPOTS_RENDER_LOOP,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  theta: -Math.PI / 2,
  visible: false,
}, {
  [HOTSPOTS_CANVAS_CREATED](hotspots, { payload: canvas }) {
    return {
      ...hotspots,
      canvas,
    };
  },
  [HOTSPOTS_VISIBLE_POSITIONS_CREATE](hotspots, { payload: visiblePositions }) {
    return {
      ...hotspots,
      visiblePositions,
    };
  },
  [HOTSPOTS_VISIBLE_UVS_CREATE](hotspots, { payload: visibleUvs }) {
    return {
      ...hotspots,
      visibleUvs,
    };
  },
  [HOTSPOTS_VISIBLE_GEOMETRY_CREATE](hotspots, { payload: visibleGeometry }) {
    return {
      ...hotspots,
      visibleGeometry,
    };
  },
  [HOTSPOTS_VISIBLE_INDEX_CREATE](hotspots, { payload: visibleIndex }) {
    return {
      ...hotspots,
      visibleIndex,
    };
  },
  [HOTSPOTS_HIT_POSITIONS_CREATE](hotspots, { payload: hitPositions }) {
    return {
      ...hotspots,
      hitPositions,
    };
  },
  [HOTSPOTS_HIT_UVS_CREATE](hotspots, { payload: hitUvs }) {
    return {
      ...hotspots,
      hitUvs,
    };
  },
  [HOTSPOTS_HIT_GEOMETRY_CREATE](hotspots, { payload: hitGeometry }) {
    return {
      ...hotspots,
      hitGeometry,
    };
  },
  [HOTSPOTS_HIT_INDEX_CREATE](hotspots, { payload: hitIndex }) {
    return {
      ...hotspots,
      hitIndex,
    };
  },
  [HOTSPOTS_HIT_MATERIAL_CREATE](hotspots, { payload: hitMaterial }) {
    return {
      ...hotspots,
      hitMaterial,
    };
  },
  [HOTSPOTS_VISIBLE_MATERIAL_CREATE](hotspots, { payload: visibleMaterial }) {
    return {
      ...hotspots,
      visibleMaterial,
    };
  },
  [HOTSPOTS_VISIBLE_OBJECT_CREATE](hotspots, { payload: visibleObject3D }) {
    return {
      ...hotspots,
      visibleObject3D,
    };
  },
  [HOTSPOTS_HIT_OBJECT_CREATE](hotspots, { payload: hitObject3D }) {
    return {
      ...hotspots,
      hitObject3D,
    };
  },
  [HOTSPOTS_THETA](hotspots, { payload: theta }) {
    return {
      ...hotspots,
      theta,
    }
  },
  [HOTSPOTS_SET_VISIBILITY](hotspots, { payload: visible }) {
    return {
      ...hotspots,
      visible,
    };
  },
  [HOTSPOTS_SCENE_CREATE](hotspots, { payload: scene3D }) {
    return {
      ...hotspots,
      scene3D,
    };
  },
  [HOTSPOTS_CAMERA_CREATE](hotspots, { payload: camera }) {
    return {
      ...hotspots,
      camera,
    };
  },
  [HOTSPOTS_RENDERER_CREATE](hotspots, { payload: renderer }) {
    return {
      ...hotspots,
      renderer,
    };
  },
  [HOTSPOTS_RENDER_LOOP](hotspots, { payload: renderLoop }) {
    return {
      ...hotspots,
      renderLoop,
    };
  },
});

export default reducer;
