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

import { get } from 'lodash';
import { singleton } from '../utils/object';

const twentyFourthRad = 15 / 180 * Math.PI;
const sliceWidth = 0.1325;
const sliceHeight = 0.55;
const sliceDepth = 1.0;

export function createGeometries(fileNames) {
  return fileNames.map((f, index) => {
      var geometry = new BufferGeometry();
      // create a simple square shape. We duplicate the top left and bottom right
      // vertices because each vertex needs to appear once per triangle.
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

export default function createPano(panoCast) {
  const geometriesFactory = singleton(() => createGeometries(panoCast.fileNames));
  const meshesFactory = (function() {
    let lastMeshes;
    return () => {
      const newMeshes = selfie.geometries.map((g, i) => {
        const m = selfie.materials[i];
        const mesh = new Mesh(g, m);
        if (lastMeshes) {
          Object.assign(mesh.rotation, lastMeshes[i].rotation);
        } else {
          mesh.rotation.y = i * twentyFourthRad + panoCast.theta;
        }
        return mesh;
      });
      lastMeshes = newMeshes;
      return newMeshes;
    }
  }())
  const matieralsFactory = singleton(() => {
    return panoCast.fileNames.map(f => new MeshBasicMaterial({
      side: BackSide,
      map: ImageUtils.loadTexture(f)
    }));
  });
  const selfie = {
    get geometries() { return geometriesFactory(); },
    get meshes() { return meshesFactory(); },
    get materials() { return matieralsFactory(); },
    get object3D() {
      // No caching here, this will make sure new materials are picked up
      const object3D = new Object3D;
      selfie.meshes.forEach(m => object3D.add(m));
      return object3D;
    }
  };
  return selfie;
}
