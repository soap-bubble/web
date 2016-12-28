import {
  BackSide,
  BufferGeometry,
  Object3D,
  BufferAttribute,
  ImageUtils,
  Uint16Attribute,
  MeshBasicMaterial,
  Mesh,
  Scene,
} from 'three';
import { range } from 'lodash';
import { createHotspots } from './hotspots';
import {
  createCameraForType,
  createRendererForType,
  positionCameraForType,
  addToRenderLoop,
} from './common/three';
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
  PANO_RENDERER_CREATE,
  PANO_RENDER_LOOP,
} from './types';

const twentyFourthRad = (15 / 180) * Math.PI;
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
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
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

export function createObject3D({ theta = 0, geometries, materials }) {
  const meshes = geometries.map((g, i) => {
    const m = materials[i];
    const mesh = new Mesh(g, m);
    mesh.rotation.y = (i * twentyFourthRad) + theta;
    return mesh;
  });

  const object3D = new Object3D();
  meshes.forEach(m => object3D.add(m));

  return {
    type: PANO_OBJECT_CREATE,
    payload: object3D,
  };
}

export function createMaterials(fileNames) {
  const materials = fileNames.map(f => new MeshBasicMaterial({
    side: BackSide,
    map: ImageUtils.loadTexture(f),
  }));

  return {
    type: PANO_MATERIALS_CREATE,
    payload: materials,
  };
}

function pad(value, length) {
  return (value.toString().length < length) ? pad(`0${value}`, length) : value;
}

function generateFileNames(fileName) {
  return range(1, 25)
    .map(digit => `${fileName}.${pad(digit, 2)}.png`);
}

export function createPano() {
  return (dispatch, getState) => {
    const { casts } = getState().scene.data;
    // eslint-disable-next-line no-underscore-dangle
    const panoCastData = casts.find(c => c.__t === 'PanoCast');
    const { fileName } = panoCastData;
    const fileNames = generateFileNames(fileName);

    dispatch(createGeometries(fileNames));
    dispatch(createMaterials(fileNames));
    dispatch(createObject3D(getState().pano));
  };
}

const UP_DOWN_LIMIT = 8.5 * Math.PI / 180;

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
      x: panoX,
      y: panoY,
    } = pano.object3D.rotation;
    let {
      x: hotspotsX,
      y: hotspotsY,
    } = hotspots.visibleObject3D.rotation;

    panoX += deltaX;
    panoY += deltaY;
    hotspotsX += deltaX;
    hotspotsY += deltaY;

    const panoRot = clamp({
      x: panoX,
      y: panoY,
    });

    const hotspotsRot = clamp({
      x: hotspotsX,
      y: hotspotsY,
    });

    Object.assign(hotspots.hitObject3D.rotation, hotspotsRot);
    Object.assign(hotspots.visibleObject3D.rotation, hotspotsRot);
    Object.assign(pano.object3D.rotation, panoRot);

    dispatch(rotate(pano.object3D.rotation));
  }

}

export function rotate({ x, y }) {
  return {
    type: PANO_ROTATION,
    payload: { x, y },
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
    dispatch(createPano());
    dispatch(createHotspots());
    const objects = [];
    objects.push(getState().pano.object3D);
    objects.push(getState().hotspots.visibleObject3D);
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

export function createCamera({ width, height }) {
  return createCameraForType({
    type: PANO_CAMERA_CREATE,
    width,
    height,
  });
}

export function positionCamera(vector3) {
  return (dispatch, getState) => {
    const { camera } = getState().pano;
    dispatch(positionCameraForType({
      type: PANO_CAMERA_POSITION,
      vector3,
      camera,
    }));
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
    const { scene3D, camera, renderer } = pano;
    dispatch({
      type: PANO_RENDER_LOOP,
      payload: addToRenderLoop(() => renderer.render(scene3D, camera)),
    });
  };
}
