import {
  BackSide,
  BufferGeometry,
  Object3D,
  BufferAttribute,
  Uint16BufferAttribute,
  MeshBasicMaterial,
  Mesh,
  Scene,
  TextureLoader,
} from 'three';

import { range, get } from 'lodash';
import { createSelector } from 'reselect';
import {
  defer,
} from 'utils/promise';

import {
  getAssetUrl,
} from 'service/gamedb';
import {
  pad,
} from 'utils/string';
import {
  createCamera,
  positionCamera,
  createRenderer,
} from 'utils/three';
import renderEvents from 'utils/render';
import {
  actions as gameActions,
} from 'morpheus/game';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  selectors as hotspotSelectors,
} from './hotspot';

const selectPano = state => get(state, 'casts.pano');
const panoScene3D = state => get(state, 'casts.pano.scene3D');
const selectPanoObject3D = state => get(state, 'casts.pano.object3D');
const selectRenderElements = createSelector(
  selectPano,
  pano => ({
    camera: pano.camera,
    renderer: pano.renderer,
  }),
);

const twentyFourthRad = Math.PI / 12;
const sliceWidth = 0.1325;
const sliceHeight = 0.55;
const sliceDepth = 1.0;

function createGeometries(fileNames) {
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

    const indices = new Uint16BufferAttribute([
      0, 1, 2,
      0, 2, 3,
    ], 1);

    // itemSize = 3 because there are 3 values (components) per vertex
    geometry.setIndex(indices);
    geometry.addAttribute('uv', uvs);
    geometry.addAttribute('position', positions);

    return geometry;
  });

  return geometries;
}

function createObject3D({ theta = 0, geometries, materials, startAngle = 0 }) {
  const meshes = geometries.map((g, i) => {
    const m = materials[i];
    const mesh = new Mesh(g, m);
    mesh.rotation.y = -(i * twentyFourthRad) + theta;
    return mesh;
  });

  const object3D = new Object3D();
  meshes.forEach(m => object3D.add(m));
  object3D.rotation.y += startAngle;

  return object3D;
}

function createMaterials(fileNames) {
  const loader = new TextureLoader();
  const materials = [];
  return {
    materials,
    promise: Promise.all(fileNames
      .map(f => new Promise(
        (resolve, reject) => materials.push(new MeshBasicMaterial({
          side: BackSide,
          map: loader.load(
            f,
            resolve,
            undefined,
            reject,
          ),
        }),
      ))))
      .then(() => materials),
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

export function rotate({ x, y }) {
  return (dispatch, getState) => {
    const hitObject3D = hotspotSelectors.hitObject3D(getState());
    const visibleObject3D = hotspotSelectors.visibleObject3D(getState());
    const panoObject3D = panoScene3D(getState());
    const panoRot = clamp({
      x,
      y,
    });

    const hotRot = clamp({
      x,
      y,
    });
    Object.assign(hitObject3D.rotation, hotRot);
    Object.assign(visibleObject3D.rotation, hotRot);
    Object.assign(panoObject3D.rotation, panoRot);
  };
}

function rotateBy({ x: deltaX, y: deltaY }) {
  return (dispatch, getState) => {
    const panoObject3D = panoScene3D(getState());
    let {
      x,
      y,
    } = panoObject3D.rotation;

    x += deltaX;
    y += deltaY;

    dispatch(rotate({ x, y }));
  };
}

// function buildScene({ hotspot, pano }) {
//   let objects = [];
//   objects.push(pano.object3D);
//   if (hotspot.visible) {
//     objects = objects.concat(hotspot.visibleObject3D);
//   }
//   createScene(objects);
// }

function createScene(...objects) {
  const scene = new Scene();
  objects.forEach(o => scene.add(o));
  return scene;
}

function startRenderLoop({ scene3D, camera, renderer }) {
  const render = () => {
    //orientation.update();
    renderer.render(scene3D, camera);
  };
  renderEvents.onRender(render);
}

let canvasDefer;

function doEnter(scene) {
  return () => {
    const panoCastData = sceneSelectors.forScene().panoCasts(scene);
    const { fileName } = panoCastData;
    const fileNames = generateFileNames(fileName);
    const geometries = createGeometries(fileNames);
    const { materials, promise: promiseMaterials } = createMaterials(fileNames);
    const object3D = createObject3D({
      materials,
      geometries,
    });
    const scene3D = createScene(object3D);
    canvasDefer = defer();
    return promiseMaterials
      .then(() => ({
        object3D,
        scene3D,
      }));
  };
}

function canvasRef(canvas) {
  return () => {
    if (!canvasDefer && canvas) {
      throw new Error('Creating a canvas reference before we are ready');
    }

    if (canvas) {
      return canvasDefer.resolve(canvas);
    }

    canvasDefer = null;
    return canvasDefer;
  };
}

function onStage() {
  return (dispatch, getState) => {
    const scene3D = panoScene3D(getState());
    const { width, height } = gameSelectors.dimensions(getState());
    return canvasDefer.promise.then((canvas) => {
      const camera = createCamera({ width, height });
      const renderer = createRenderer({ canvas, width, height });
      positionCamera({
        camera,
        vector3: { z: -0.325 },
      });
      startRenderLoop({
        scene3D,
        camera,
        renderer,
      });
      return {
        camera,
        renderer,
      };
    });
  };
}

export const actions = {
  rotateBy,
  rotate,
  doEnter,
  onStage,
  canvasRef,
};

export const selectors = {
  panoScene3D,
  renderElements: selectRenderElements,
};
