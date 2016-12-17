import THREE, {
  BufferAttribute,
  Uint16Attribute,
  MeshBasicMaterial,
  BufferGeometry,
  Mesh
} from 'three'

import createHotspot from './hotspot';
import { singleton } from '../utils/object';

const HOTSPOT_VERTEX_SIZE = 4;

export function createPositions(hotspots) {
  const positions = new BufferAttribute( new Float32Array( hotspots.length * 12 ), 3 );

  hotspots.forEach((hotspot, index) => {
    const { cylinderVector3Ds: vector3s } = hotspot;
    const offset = index * HOTSPOT_VERTEX_SIZE;
    positions.setXYZ(offset, vector3s[0], vector3s[1], vector3s[2]);
    positions.setXYZ(offset + 1, vector3s[3], vector3s[4], vector3s[5])
    positions.setXYZ(offset + 2, vector3s[6], vector3s[7], vector3s[8]);
    positions.setXYZ(offset + 3, vector3s[9], vector3s[10], vector3s[11]);
  });

  return positions;
}

export function createUvs(count) {
  var uvs = new BufferAttribute( new Float32Array( hotspots.length * 8 ), 2 );

  for (let i = 0; i < count; i++) {
    const offset = i * HOTSPOT_VERTEX_SIZE;
    uvs.setXY(offset, 0.0, 0.0);
    uvs.setXY(offset + 1, 1.0, 0.0);
    uvs.setXY(offset + 2, 1.0, 1.0);
    uvs.setXY(offset + 3, 0.0, 1.0);
  };

  return uvs;
}

export function createIndex(count) {
  const indices = [];
  for (let i = 0; i < count; i++) {
    const offset = i * HOTSPOT_VERTEX_SIZE;
    indices.push(
      offset, offset + 1, offset + 2,
      offset, offset + 2, offset + 3
    );
  }
  return new Uint16Attribute(indices, 1);
}

export function createGeometry({ index, uvs, positions}) {
  var geometry = new BufferGeometry();;
  geometry.setIndex(index);
  geometry.addAttribute('position', positions);
  geometry.addAttribute('uvs', uvs);
}

export function createMaterial() {
  return new MeshBasicMaterial({
    transparent: true,
    opacity: 0.3,
    color: 0x00ff00,
    side: THREE.DoubleSide
  });
}

export function createMesh({ geometry, material }) {
  return new Mesh(geometry, material);
}

export default function createHotspots(hotspotsData) {
  const positionsFactory = singleton(() => createPositions(selfie.hotspots));
  const uvsFactory = singleton(() => createUvs(selfie.hotspots.length));
  const indexFactory = singleton(() => createIndex(selfie.hotspots.length));
  const geometryFactory = singleton(() => createGeometry(selfie));
  let theta = 0;

  const selfie = {
    get data() {
      return hotspotsData;
    },
    // Y rotation amount of the hotspots
    get theta() {
      return theta;
    },
    set theta(_theta) {
      theta = _theta;
    },
    get hotspots() {
      return selfie.data.map(createHotspot);
    },
    get positions() { return positionsFactory(); },
    get uvs() { return uvsFactory(); },
    get index() { return indexFactory(); },
    get geometry() { return geometryFactory(); },
    get matieral() { return createMaterial(); },
    get mesh() { return createMesh(self); },
    get object3D() { return selfie.mesh; },
  };

  return selfie;
}
