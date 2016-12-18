import THREE, {
  BufferAttribute,
  Uint16Attribute,
  MeshBasicMaterial,
  BufferGeometry,
  Mesh
} from 'three'

import createHotspot from './hotspot';
import loggerFactory from '../utils/logger';
import { singleton } from '../utils/object';

const log = loggerFactory('THREE:hotspots');

const HOTSPOT_VERTEX_SIZE = 4;

export function createPositions(hotspots) {
  log.info('Creating positions for hotspots');
  const positions = new BufferAttribute( new Float32Array( hotspots.length * 12 ), 3 );

  hotspots.forEach(({ cylinderVector3Ds }, index) => {
    const [ bottomLeft, bottomRight, topRight, topLeft ] = cylinderVector3Ds;
    const offset = index * HOTSPOT_VERTEX_SIZE;
    positions.setXYZ(offset, bottomLeft.x, bottomLeft.y, bottomLeft.z);
    positions.setXYZ(offset + 1, bottomRight.x, bottomRight.y, bottomRight.z)
    positions.setXYZ(offset + 2, topRight.x, topRight.y, topRight.z);
    positions.setXYZ(offset + 3, topLeft.x, topLeft.y, topLeft.z);
  });
  return positions;
}

export function createUvs(count) {
  log.info('Creating texture mapping for hotspots');
  var uvs = new BufferAttribute( new Float32Array( count * 8 ), 2 );
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
  log.info('Generating buffer index for hotspots');
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
  log.info('Creating hotspots geometry');
  var geometry = new BufferGeometry();;
  geometry.setIndex(index);
  geometry.addAttribute('position', positions);
  // geometry.addAttribute('uv', uvs);
  return geometry;
}

export function createMaterial() {
  log.info('Creating hotspots material');
  return new MeshBasicMaterial({
    transparent: true,
    opacity: 0.3,
    color: 0x00ff00,
    side: THREE.DoubleSide
  });
}

export function createMesh({ geometry, material }) {
  log.info('Creating hotspots mesh');
  return new Mesh(geometry, material);
}

export default function createHotspots(hotspotsData) {
  const positionsFactory = singleton(() => createPositions(selfie.hotspots));
  const uvsFactory = singleton(() => createUvs(selfie.hotspots.length));
  const indexFactory = singleton(() => createIndex(selfie.hotspots.length));
  const geometryFactory = singleton(() => createGeometry(selfie));
  const meshFactory = singleton(() => createMesh(selfie));
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
    get material() { return createMaterial(); },
    get mesh() { return meshFactory(); },
    get object3D() { return selfie.mesh; },
  };

  return selfie;
}
