import {
  BackSide,
  BufferGeometry,
  Object3D,
  BufferAttribute,
  Uint16Attribute,
  MeshBasicMaterial,
  Mesh,
  Scene,
  TextureLoader,
} from 'three';


import {
  getAssetUrl,
} from '../service/gamedb';
import {
  resize,
} from './dimensions';
import {
  createCameraForType,
  createRendererForType,
  positionCameraForType,
} from './common/three';
import renderEvents from '../utils/render';
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
  PANOANIM_RENDERER_CREATE,
  PANOANIM_RENDER_LOOP,
  PANOANIM_TEXTURES_LOAD_SUCCESS,
  PANOANIM_TEXTURES_LOAD_FAILURE,
} from './types';

export function load() {
  return (dispatch, getState) => {
    const { cache, loaded } = getState().scene;
    const { casts } = cache[loaded];
    // eslint-disable-next-line no-underscore-dangle
    const panoCastsData = casts.filter(c => c.__t === 'PanoAnim');
    const fileNames = panoCastsData.map(({ fileName }) => getAssetUrl(fileName));
    
    const { fileName } = panoCastData;
    const fileNames = generateFileNames(fileName);

    dispatch(createGeometries(fileNames));
    dispatch(createMaterials(fileNames));
    dispatch(createObject3D(getState().pano));
    dispatch(loadHotspots());
    dispatch(buildScene());
  };
}

export function display() {
  return (dispatch) => {
    dispatch(buildRig());
    dispatch(resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    dispatch(positionCamera({ z: -0.325 }));
    dispatch(startRenderLoop());
  };
}
