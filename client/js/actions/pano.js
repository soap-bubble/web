import {
  BackSide,
  BufferGeometry,
  Object3D,
  BufferAttribute,
  ImageUtils,
  Uint16Attribute,
  MeshBasicMaterial,
  Mesh,
} from 'three';
import { range } from 'lodash';

import {
  PANO_GEOMETRIES_CREATE,
  PANO_OBJECT_CREATE,
  PANO_MATERIALS_CREATE,
  PANO_ROTATION,
  PANO_SET_SENSITIVITY,
} from './types';

const twentyFourthRad = (15 / 180) * Math.PI;
const sliceWidth = 0.1325;
const sliceHeight = 0.55;
const sliceDepth = 1.0;

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
    } = hotspots.object3D.rotation;

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

    Object.assign(hotspots.object3D.rotation, hotspotsRot);
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
