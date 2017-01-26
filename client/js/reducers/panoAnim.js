import {
  isUndefined,
} from 'lodash';
import {
  PANOANIM_CANVAS_CREATED,
  PANOANIM_GEOMETRIES_CREATE,
  PANOANIM_OBJECT_CREATE,
  PANOANIM_MATERIALS_CREATE,
  PANOANIM_ROTATION,
  PANOANIM_SET_SENSITIVITY,
  PANOANIM_CAMERA_CREATE,
  PANOANIM_SCENE_CREATE,
  PANOANIM_CAMERA_POSITION,
  PANOANIM_RENDER_LOOP,
  PANOANIM_RENDERER_CREATE,
  TRANSITION_END,
} from '../actions/types';
import createReducer from './createReducer';

const sliceHeight = 0.55;
const sliceDepth = 1.0;

const reducer = createReducer({
  sensitivity: 50,
  controlType: 'touch',
  rotation: {
    x: 0,
    y: 0,
  },
  startAngle: 0,
  interactionDebounce: 5,
}, {
  [PANOANIM_CANVAS_CREATED](panoAnim, { payload: canvas }) {
    return {
      ...panoAnim,
      canvas,
    };
  },
  [PANOANIM_GEOMETRIES_CREATE](panoAnim, { payload: geometries }) {
    return {
      ...panoAnim,
      geometries,
    };
  },
  [PANOANIM_OBJECT_CREATE](panoAnim, { payload: object3D, meta: orientation }) {
    return {
      ...panoAnim,
      object3D,
      orientation,
    };
  },
  [PANOANIM_MATERIALS_CREATE](panoAnim, { payload: materials }) {
    return {
      ...panoAnim,
      materials,
    };
  },
  [PANOANIM_ROTATION](panoAnim, { payload: rotation }) {
    return {
      ...panoAnim,
      rotation,
    };
  },
  [PANOANIM_SET_SENSITIVITY](panoAnim, { payload: sensitivity }) {
    return {
      ...panoAnim,
      sensitivity,
    };
  },
  [PANOANIM_SCENE_CREATE](panoAnim, { payload: scene3D }) {
    return {
      ...panoAnim,
      scene3D,
    };
  },
  [PANOANIM_CAMERA_CREATE](panoAnim, { payload: camera }) {
    return {
      ...panoAnim,
      camera,
    };
  },
  [PANOANIM_CAMERA_POSITION](panoAnim, { payload: vector3 }) {
    const { cameraPosition } = pano;
    return {
      ...panoAnim,
      cameraPosition: {
        ...cameraPosition,
        vector3,
      },
    };
  },
  [PANOANIM_RENDERER_CREATE](panoAnim, { payload: renderer }) {
    return {
      ...panoAnim,
      renderer,
    };
  },
  [PANOANIM_RENDER_LOOP](panoAnim, { payload: renderLoop }) {
    return {
      ...panoAnim,
      renderLoop,
    };
  },
  [TRANSITION_END](panoAnim, { payload: transition }) {
    const { angleAtEnd } = transition;
    const { rotation } = pano;
    let startAngle = 0;
    if (!isUndefined(angleAtEnd) && angleAtEnd !== -1) {
      startAngle = (angleAtEnd * Math.PI) / 1800;
      startAngle -= Math.PI - (Math.PI / 6);
    }
    return {
      ...panoAnim,
      startAngle,
      rotation: {
        ...rotation,
        y: startAngle,
      },
    };
  },
});

export default reducer;
