import THREE, {
  BufferAttribute,
  Uint16Attribute,
  MeshBasicMaterial,
  BufferGeometry,
  Mesh,
} from 'three';

import {
  HOTSPOTS_INDEX_CREATE,
  HOTSPOTS_POSITIONS_CREATE,
  HOTSPOTS_UVS_CREATE,
  HOTSPOTS_GEOMETRY_CREATE,
  HOTSPOTS_MATERIAL_CREATE,
  HOTSPOTS_OBJECT_CREATE,
} from './types';

const HOTSPOT_VERTEX_SIZE = 4;
const SCALE_FACTOR = 1.0;
const HOTSPOT_X_OFFSET = Math.PI / 3;
const HOTSPOT_X_COORD_FACTOR = Math.PI / -1800;
const HOTSPOT_Y_COORD_FACTOR = 0.004 * SCALE_FACTOR;
const SIZE = 0.99 * SCALE_FACTOR;

function cylinderMap(y, x) {
  return {
    x: SIZE * Math.sin(x),
    y,
    z: SIZE * Math.cos(x),
  };
}

export function createPositions(hotspotsData) {
  const positions = new BufferAttribute(
    new Float32Array(hotspotsData.length * 12), 3,
  );

  hotspotsData.map((hotspotData) => {
    let {
      rectTop: top,
      rectRight: right,
      rectBottom: bottom,
      rectLeft: left,
    } = hotspotData;

    top *= HOTSPOT_Y_COORD_FACTOR;
    bottom *= HOTSPOT_Y_COORD_FACTOR;
    right = (HOTSPOT_X_COORD_FACTOR * right) + HOTSPOT_X_OFFSET;
    left = (HOTSPOT_X_COORD_FACTOR * left) + HOTSPOT_X_OFFSET;

    return [
      cylinderMap(bottom, left),
      cylinderMap(bottom, right),
      cylinderMap(top, right),
      cylinderMap(top, left),
    ];
  }).forEach(([bottomLeft, bottomRight, topRight, topLeft], index) => {
    const offset = index * HOTSPOT_VERTEX_SIZE;
    positions.setXYZ(offset, bottomLeft.x, bottomLeft.y, bottomLeft.z);
    positions.setXYZ(offset + 1, bottomRight.x, bottomRight.y, bottomRight.z);
    positions.setXYZ(offset + 2, topRight.x, topRight.y, topRight.z);
    positions.setXYZ(offset + 3, topLeft.x, topLeft.y, topLeft.z);
  });
  return {
    type: HOTSPOTS_POSITIONS_CREATE,
    payload: positions,
  };
}

export function createUvs(count) {
  const uvs = new BufferAttribute(new Float32Array(count * 8), 2);
  for (let i = 0; i < count; i += 1) {
    const offset = i * HOTSPOT_VERTEX_SIZE;
    uvs.setXY(offset, 0.0, 0.0);
    uvs.setXY(offset + 1, 1.0, 0.0);
    uvs.setXY(offset + 2, 1.0, 1.0);
    uvs.setXY(offset + 3, 0.0, 1.0);
  }
  return {
    type: HOTSPOTS_UVS_CREATE,
    payload: uvs,
  };
}

export function createIndex(count) {
  const indices = [];
  for (let i = 0; i < count; i += 1) {
    const offset = i * HOTSPOT_VERTEX_SIZE;
    indices.push(
      offset, offset + 1, offset + 2,
      offset, offset + 2, offset + 3,
    );
  }
  return {
    type: HOTSPOTS_INDEX_CREATE,
    payload: new Uint16Attribute(indices, 1),
  };
}

export function createGeometry({ index, uvs, positions }) {
  const geometry = new BufferGeometry();
  geometry.setIndex(index);
  geometry.addAttribute('position', positions);
  geometry.addAttribute('uv', uvs);
  return {
    type: HOTSPOTS_GEOMETRY_CREATE,
    payload: geometry,
  };
}

export function createMaterial() {
  return {
    type: HOTSPOTS_MATERIAL_CREATE,
    payload: new MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0x00ff00,
      side: THREE.DoubleSide,
    }),
  };
}

export function createObject3D({ geometry, material }) {
  return {
    type: HOTSPOTS_OBJECT_CREATE,
    payload: new Mesh(geometry, material),
  };
}
export function createHotspots() {
  return (dispatch, getState) => {
    const { casts } = getState().scene.data;
    const hotspotsData = casts.filter(c => c.castId === 0);

    dispatch(createPositions(hotspotsData));
    dispatch(createUvs(hotspotsData.length));
    dispatch(createIndex(hotspotsData.length));
    dispatch(createMaterial());
    dispatch(createGeometry(getState()));
    dispatch(createObject3D(getState()));
  }
}
