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
  PANO_GEOMETRY_CREATE,
  PANO_OBJECT_CREATE,
  PANO_MATERIALS_CREATE,
} from './types';

const twentyFourthRad = (15 / 180) * Math.PI;
const sliceWidth = 0.1325;
const sliceHeight = 0.55;
const sliceDepth = 1.0;

export function createGeometries() {
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

  return {
    type: PANO_GEOMETRY_CREATE,
    payload: geometry,
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

    dispatch(createGeometries());
    dispatch(createMaterials(fileNames));
    dispatch(createObject3D(getState()));
  };
}
