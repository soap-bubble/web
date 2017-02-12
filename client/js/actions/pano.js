import {
  DeviceOrientationControls,
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
import { range } from 'lodash';

import {
  getAssetUrl,
} from '../service/gamedb';
import {
  pad,
} from '../utils/string';
import DeviceOrientation from './common/DeviceOrientation'
import {
  resize,
} from './dimensions';
import {
  load as loadHotspots,
  hotspotsLoaded,
  positionCamera as positionHotspotCamera,
  startRenderLoop as startHotspotRenderLoop,
 } from './hotspots';
import {
  load as loadPanoAnim,
} from './panoAnim';
import {
  createCameraForType,
  createRendererForType,
  positionCameraForType,
} from './common/three';
import renderEvents from '../utils/render';
import {
  PANO_CANVAS_CREATED,
  PANO_GEOMETRIES_CREATE,
  PANO_OBJECT_CREATE,
  PANO_MATERIALS_CREATE,
  PANO_ROTATION,
  PANO_SET_SENSITIVITY,
  PANO_CAMERA_CREATE,
  PANO_SCENE_CREATE,
  PANO_SCENE_UPDATE,
  PANO_CAMERA_POSITION,
  PANO_RENDERER_CREATE,
  PANO_RENDER_LOOP,
  PANO_TEXTURES_LOAD_SUCCESS,
  PANO_TEXTURES_LOAD_FAILURE,
} from './types';

const twentyFourthRad = Math.PI / 12;
const sliceWidth = 0.1325;
const sliceHeight = 0.55;
const sliceDepth = 1.0;

export function canvasCreated(canvas) {
  return {
    type: PANO_CANVAS_CREATED,
    payload: canvas,
  };
}

export function createGeometries(fileNames) {
  const geometries = fileNames.map(() => {
    const geometry = new BufferGeometry();

    const positions = new BufferAttribute(new Float32Array([
      -sliceWidth, -sliceHeight, sliceDepth,
      sliceWidth, -sliceHeight, sliceDepth,
      sliceWidth, sliceHeight, sliceDepth,
      -sliceWidth, sliceHeight, sliceDepth,
    ]), 3);
    const uvs = new BufferAttribute(new Float32Array([
      1.0, 0.0,
      0.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,
    ]), 2);

    const indices = new Uint16Attribute([
      0, 1, 2,
      0, 2, 3,
    ], 1);

    // itemSize = 3 because there are 3 values (components) per vertex
    geometry.setIndex(indices);
    geometry.addAttribute('uv', uvs);
    geometry.addAttribute('position', positions);

    return geometry;
  });

  return {
    type: PANO_GEOMETRIES_CREATE,
    payload: geometries,
  };
}

export function createObject3D({ theta = 0, geometries, materials, startAngle }) {
  const meshes = geometries.map((g, i) => {
    const m = materials[i];
    const mesh = new Mesh(g, m);
    mesh.rotation.y = -(i * twentyFourthRad) + theta;
    return mesh;
  });

  const object3D = new Object3D();
  meshes.forEach(m => object3D.add(m));
  object3D.rotation.y += startAngle;
  //const orientation = new DeviceOrientation(object3D);

  return {
    type: PANO_OBJECT_CREATE,
    payload: object3D,
    meta: null,
  };
}

export function createMaterials(fileNames) {
  return (dispatch) => {
    const loader = new TextureLoader();
    const materials = [];
    Promise.all(fileNames
      .map(f => new Promise(
        (resolve, reject) => materials.push(new MeshBasicMaterial({
          side: BackSide,
          map: loader.load(
            f,
            resolve,
            undefined,
            reject,
          ),
        })
      ))))
      .then(() => dispatch({
        type: PANO_TEXTURES_LOAD_SUCCESS,
        payload: fileNames
      }))
      .catch((err) => {
        debugger;
        dispatch({
          type: PANO_TEXTURES_LOAD_FAILURE,
          payload: err,
        })
      });

    dispatch({
      type: PANO_MATERIALS_CREATE,
      payload: materials,
    });
  };
}

function generateFileNames(fileName) {
  return range(1, 25)
    .map(digit => getAssetUrl(`${fileName}.${pad(digit, 2)}.png`));
}

const UP_DOWN_LIMIT = 7.5 * (Math.PI / 180);

function clamp({ x, y }) {
  if (x > UP_DOWN_LIMIT) {
    x = UP_DOWN_LIMIT;
  }
  if (x < -UP_DOWN_LIMIT) {
    x = -UP_DOWN_LIMIT;
  }
  return { x, y };
}

export function rotateBy({ x: deltaX, y: deltaY }) {

  return (dispatch, getState) => {
    const { hotspots, pano } = getState();
    let {
      x,
      y,
    } = pano.object3D.rotation;

    x += deltaX;
    y += deltaY;

    dispatch(rotate({ x, y }));
  }

}

export function rotate({ x, y }) {
  return (dispatch, getState) => {
    const { hotspots, pano } = getState();
    const { theta } = hotspots;

    const panoRot = clamp({
      x,
      y,
    });

    const hotRot = clamp({
      x,
      y: y + theta,
    });

    Object.assign(hotspots.hitObject3D.rotation, hotRot);
    Object.assign(hotspots.visibleObject3D.rotation, hotRot);
    Object.assign(pano.object3D.rotation, panoRot);

    dispatch({
      type: PANO_ROTATION,
      payload: { x, y },
    });
  };
}

export function setSensitivity(sensitivity) {
  return {
    type: PANO_SET_SENSITIVITY,
    payload: sensitivity,
  };
}


export function buildScene() {
  return (dispatch, getState) => {
    const { hotspots } = getState();

    let objects = [];
    objects.push(getState().pano.object3D);
    if (hotspots.visible) {
      objects = objects.concat(getState().hotspots.visibleObject3D);
    }
    dispatch(createScene(objects));
  }
}

export function buildRig() {
  return (dispatch, getState) => {
    const { width, height } = getState().dimensions;
    const { canvas } = getState().pano;
    dispatch(createCamera({ width, height }));
    dispatch(createRenderer({ canvas, width, height }));
  };
}

export function createScene(objects) {
  const scene = new Scene();
  objects.forEach(o => scene.add(o));
  return {
    type: PANO_SCENE_CREATE,
    payload: scene,
  };
}

export function addToPanoScene(...rest) {
  return (dispatch, getState) => {
    const { object3D, startAngle } = getState().pano;
    rest.forEach((o) => {
      object3D.add(o)
    });
    return {
      type: PANO_SCENE_UPDATE,
      payload: object3D,
    };
  }
}

export function createCamera({ width, height }) {
  return (dispatch, getState) => {
    const { hotspots } = getState();
    const { cameraPosition: position } = hotspots;

    dispatch(createCameraForType({
      type: PANO_CAMERA_CREATE,
      width,
      height,
      position,
    }));
  };
}

export function positionCamera(vector3) {
  return (dispatch, getState) => {
    const { camera } = getState().pano;
    dispatch(positionCameraForType({
      type: PANO_CAMERA_POSITION,
      vector3,
      camera,
    }));
    dispatch(positionHotspotCamera(vector3));
  };
}

export function createRenderer({ canvas, width, height }) {
  return createRendererForType({
    type: PANO_RENDERER_CREATE,
    canvas,
    width,
    height,
  });
}

export function startRenderLoop() {
  return (dispatch, getState) => {
    const { pano } = getState();
    const { scene3D, camera, renderer, orientation } = pano;
    const render = () => {
      //orientation.update();
      renderer.render(scene3D, camera);
    };
    renderEvents.on('render', render);
    dispatch({
      type: PANO_RENDER_LOOP,
      payload: () => renderEvents.off('render', render),
    });
    dispatch(startHotspotRenderLoop());
  };
}

export function load() {
  return (dispatch, getState) => {
    const { cache, loaded } = getState().scene;
    const { casts } = cache[loaded];
    // eslint-disable-next-line no-underscore-dangle
    const panoCastData = casts.find(c => c.__t === 'PanoCast');
    const { fileName } = panoCastData;
    const fileNames = generateFileNames(fileName);

    dispatch(createGeometries(fileNames));
    dispatch(createMaterials(fileNames));
    dispatch(createObject3D(getState().pano));
    dispatch(loadHotspots());
    dispatch(loadPanoAnim());
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
