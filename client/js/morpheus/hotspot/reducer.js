import createReducer from 'utils/createReducer';
import {
  HOTSPOTS_LOADED,
  HOTSPOTS_ACTIVATED,
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
  HOTSPOTS_SET_HIT_COLORS,
  HOTSPOTS_HOVER_INDEX,
  HOTSPOTS_SCENE_CREATE,
  HOTSPOTS_CAMERA_CREATE,
  HOTSPOTS_CAMERA_TRANSLATE,
  HOTSPOTS_RENDERER_CREATE,
  HOTSPOTS_RENDER_LOOP,
  HOTSPOTS_ENTER,
} from './actionTypes';

const reducer = createReducer('hotspot', {
  theta: 0,
  visible: false,
  hoverIndex: null,
  hitColorList: [],
}, {
  [HOTSPOTS_LOADED](hotspots, { payload: data }) {
    return {
      ...hotspots,
      data,
    };
  },
  [HOTSPOTS_ACTIVATED](hotspots, { payload: activated }) {
    return {
      ...hotspots,
      activated,
    };
  },
  [HOTSPOTS_CANVAS_CREATED](hotspots, { payload: canvas }) {
    return {
      ...hotspots,
      canvas,
    };
  },
  [HOTSPOTS_VISIBLE_POSITIONS_CREATE](hotspots, { payload: visiblePositionsList }) {
    return {
      ...hotspots,
      visiblePositionsList,
    };
  },
  [HOTSPOTS_VISIBLE_UVS_CREATE](hotspots, { payload: visibleUvsList }) {
    return {
      ...hotspots,
      visibleUvsList,
    };
  },
  [HOTSPOTS_VISIBLE_GEOMETRY_CREATE](hotspots, { payload: visibleGeometryList }) {
    return {
      ...hotspots,
      visibleGeometryList,
    };
  },
  [HOTSPOTS_VISIBLE_INDEX_CREATE](hotspots, { payload: visibleIndexList }) {
    return {
      ...hotspots,
      visibleIndexList,
    };
  },
  [HOTSPOTS_HIT_POSITIONS_CREATE](hotspots, { payload: hitPositionsList }) {
    return {
      ...hotspots,
      hitPositionsList,
    };
  },
  [HOTSPOTS_HIT_UVS_CREATE](hotspots, { payload: hitUvsList }) {
    return {
      ...hotspots,
      hitUvsList,
    };
  },
  [HOTSPOTS_HIT_GEOMETRY_CREATE](hotspots, { payload: hitGeometryList }) {
    return {
      ...hotspots,
      hitGeometryList,
    };
  },
  [HOTSPOTS_HIT_INDEX_CREATE](hotspots, { payload: hitIndexList }) {
    return {
      ...hotspots,
      hitIndexList,
    };
  },
  [HOTSPOTS_HIT_MATERIAL_CREATE](hotspots, { payload: hitMaterialList }) {
    return {
      ...hotspots,
      hitMaterialList,
    };
  },
  [HOTSPOTS_VISIBLE_MATERIAL_CREATE](hotspots, { payload: visibleMaterialList }) {
    return {
      ...hotspots,
      visibleMaterialList,
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
    };
  },
  [HOTSPOTS_SET_VISIBILITY](hotspots, { payload: visible }) {
    return {
      ...hotspots,
      visible,
    };
  },
  [HOTSPOTS_SET_HIT_COLORS](hotspots, { payload: hitColorList }) {
    return {
      ...hotspots,
      hitColorList,
    };
  },
  [HOTSPOTS_HOVER_INDEX](hotspots, { payload: hoverIndex }) {
    return {
      ...hotspots,
      hoverIndex,
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
  [HOTSPOTS_CAMERA_TRANSLATE](hotspots, { payload: vector3 }) {
    const { cameraPosition } = hotspots;
    return {
      ...hotspots,
      cameraPosition: {
        ...cameraPosition,
        vector3,
      },
    };
  },
  [HOTSPOTS_RENDER_LOOP](hotspots, { payload: renderLoop }) {
    return {
      ...hotspots,
      renderLoop,
    };
  },
  [HOTSPOTS_ENTER](hotspots, { payload: sceneData }) {
    const { casts } = sceneData;
    const data = casts.filter(c => c.castId === 0);
    const isPano = !!(casts.find(c => c.__t === 'PanoCast'));
    return {
      ...hotspots,
      data,
      isPano,
    };
  },
});

export default reducer;
