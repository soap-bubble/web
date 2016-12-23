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

import loggerFactory from '../utils/logger';
import { singleton } from '../utils/object';

const log = loggerFactory('THREE:pano');

const twentyFourthRad = (15 / 180) * Math.PI;
const sliceWidth = 0.1325;
const sliceHeight = 0.55;
const sliceDepth = 1.0;

export function createGeometries(fileNames) {
  log.info(`Creating geometries for ${fileNames.length} frames`);

  return fileNames.map((f) => {
      var geometry = new BufferGeometry();

      var positions = new BufferAttribute(new Float32Array( [
        -sliceWidth, -sliceHeight,  sliceDepth,
        sliceWidth, -sliceHeight,  sliceDepth,
        sliceWidth,  sliceHeight,  sliceDepth,
        -sliceWidth,  sliceHeight,  sliceDepth
      ]), 3);
      var uvs = new BufferAttribute(new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
      ]), 2);

      var indices = new Uint16Attribute([
        0, 1, 2,
        0, 2, 3,
      ], 1);

      // itemSize = 3 because there are 3 values (components) per vertex
      geometry.setIndex(indices);
      geometry.addAttribute('uv', uvs);
      geometry.addAttribute('position', positions);
      return geometry;
    });
}


// Removed to reduce complexity here temporarily
// const meshesFactory = (function() {
//   let lastMeshes;
//   return () => {
//     log.info('Getting new pano meshes');
//     const newMeshes = selfie.geometries.map((g, i) => {
//       const m = selfie.materials[i];
//       const mesh = new Mesh(g, m);
//       if (lastMeshes) {
//         Object.assign(mesh.rotation, lastMeshes[i].rotation);
//       } else {
//         mesh.rotation.y = i * twentyFourthRad + panoCast.theta;
//       }
//       return mesh;
//     });
//     lastMeshes = newMeshes;
//     return newMeshes;
//   };
// }());

export default function createPano(panoCast) {
  const geometriesFactory = singleton(() => createGeometries(panoCast.fileNames));
  const meshesFactory = singleton(() => {
    log.info('Getting new pano meshes');
    const newMeshes = selfie.geometries.map((g, i) => {
      const m = selfie.materials[i];
      const mesh = new Mesh(g, m);
      mesh.rotation.y = i * twentyFourthRad + panoCast.theta;
      return mesh;
    });
    return newMeshes;
  });
  const matieralsFactory = singleton(() => {
    log.info('Creating pano materials');
    return selfie.cast.fileNames.map(f => new MeshBasicMaterial({
      side: BackSide,
      map: ImageUtils.loadTexture(f)
    }));
  });
  const object3DFactory = singleton(() => {
    log.info('Creating THREE pano object')
    const object3D = new Object3D;
    selfie.meshes.forEach(m => object3D.add(m));
    return object3D;
  });
  const selfie = {
    get cast() { return panoCast },
    get geometries() { return geometriesFactory(); },
    get meshes() { return meshesFactory(); },
    get materials() { return matieralsFactory(); },
    get object3D() { return object3DFactory(); }
  };
  return selfie;
}
