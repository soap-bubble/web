import {
  PerspectiveCamera,
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
import {
  Tween,
  Easing,
} from 'tween';
import { get, memoize, pick } from 'lodash';
import { createSelector } from 'reselect';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  createCamera,
  positionCamera,
  createRenderer,
} from 'utils/three';
import renderEvents from 'utils/render';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import createCanvas from 'utils/canvas';
import {
  selectors as hotspotSelectors,
} from './hotspot';

const twentyFourthRad = Math.PI / 12;
const sliceWidth = 0.1325;
const sliceHeight = 0.56;
const sliceDepth = 1.0;
const X_ROTATION_OFFSET = 0 * (Math.PI / 180);

function createGeometries() {
  const geometries = [];
  for (let i = 0; i < 24; i++) {
    const geometry = new BufferGeometry();

    const positions = new BufferAttribute(new Float32Array([
      -sliceWidth, -sliceHeight, sliceDepth,
      sliceWidth, -sliceHeight, sliceDepth,
      sliceWidth, sliceHeight, sliceDepth,
      -sliceWidth, sliceHeight, sliceDepth,
    ]), 3);

    const left = (i % 16) / 16;
    const right = left + 0.0625;
    const top = Math.floor(i / 16) === 0 ? 0.5 : 0.0;
    const bottom = top + 0.5;


    const uvs = new BufferAttribute(new Float32Array([
      right, top,
      left, top,
      left, bottom,
      right, bottom,
    ]), 2);

    const indices = new Uint16BufferAttribute([
      0, 1, 2,
      0, 2, 3,
    ], 1);

    // itemSize = 3 because there are 3 values (components) per vertex
    geometry.setIndex(indices);
    geometry.addAttribute('uv', uvs);
    geometry.addAttribute('position', positions);
    geometries.push(geometry);
  }
  return geometries;
}

function createObject3D({ theta = 0, geometries, material, startAngle = 0 }) {
  const meshes = geometries.map((g, i) => {
    const mesh = new Mesh(g, material);
    mesh.rotation.y = -(i * twentyFourthRad) + theta;
    return mesh;
  });

  const object3D = new Object3D();
  meshes.forEach(m => object3D.add(m));
  object3D.rotation.y += startAngle;

  return object3D;
}

function createMaterial(asset) {
  const loader = new TextureLoader();
  loader.crossOrigin = 'anonymous';
  let material;
  const promise = new Promise(
    (resolve, reject) => {
      material = new MeshBasicMaterial({
        side: BackSide,
        map: loader.load(
         asset,
         resolve,
         undefined,
         reject,
       ),
      });
    },
  )
    .then(() => material);
  return {
    material,
    promise,
  };
}

const UP_DOWN_LIMIT = 5 * (Math.PI / 180);

function clamp({ x, y }) {
  if (x > UP_DOWN_LIMIT + X_ROTATION_OFFSET) {
    x = UP_DOWN_LIMIT + X_ROTATION_OFFSET;
  } else if (x < -UP_DOWN_LIMIT + X_ROTATION_OFFSET) {
    x = -UP_DOWN_LIMIT + X_ROTATION_OFFSET;
  }
  if (y > 2 * Math.PI) {
    y -= 2 * Math.PI;
  } else if (y < 0) {
    y += 2 * Math.PI;
  }
  return { x, y };
}

function createScene(...objects) {
  const scene = new Scene();
  objects.forEach(o => scene.add(o));
  return scene;
}

function startRenderLoop({ scene3D, camera, renderer }) {
  window.camera = camera;
  window.PerspectiveCamera = PerspectiveCamera;
  const render = () => {
    // orientation.update();
    renderer.render(scene3D, window.camera);
  };
  renderEvents.onRender(render);
  renderEvents.onDestroy(() => {
    renderer.dispose();
  });
}

export const selectors = memoize((scene) => {
  const selectSceneCache = castSelectors.forScene(scene).cache;

  const selectPanoCastData = createSelector(
    () => scene,
    s => get(s, 'casts', []).find(c => c.__t === 'PanoCast'),
  );
  const selectPano = createSelector(
    selectSceneCache,
    castCache => get(castCache, 'pano'),
  );
  const selectPanoScene3D = createSelector(
    selectPano,
    pano => get(pano, 'scene3D'),
  );
  const selectPanoObject3D = createSelector(
    selectPano,
    pano => get(pano, 'object3D'),
  );
  const selectCanvas = createSelector(
    selectPano,
    pano => get(pano, 'canvas'),
  );
  const selectRenderElements = createSelector(
    selectPano,
    pano => pick(pano, ['camera', 'renderer']),
  );
  const selectRotation = createSelector(
    selectPanoObject3D,
    panoObject3D => get(panoObject3D, 'rotation'),
  );
  return {
    panoCastData: selectPanoCastData,
    panoScene3D: selectPanoScene3D,
    panoObject3D: selectPanoObject3D,
    renderElements: selectRenderElements,
    rotation: selectRotation,
    canvas: selectCanvas,
  };
});

export const actions = memoize((scene) => {
  const panoSelectors = selectors(scene);

  function rotate({ x, y }) {
    return (dispatch, getState) => {
      const scene3D = hotspotSelectors(scene).scene3D(getState());
      const panoObject3D = panoSelectors.panoObject3D(getState());
      const rot = clamp({
        x,
        y,
      });
      Object.assign(scene3D.rotation, rot);
      Object.assign(panoObject3D.rotation, rot);
    };
  }

  function rotateBy({ x: deltaX, y: deltaY }) {
    return (dispatch, getState) => {
      const panoObject3D = panoSelectors.panoObject3D(getState());
      let {
        x,
        y,
      } = panoObject3D.rotation;

      x += deltaX;
      y += deltaY;

      dispatch(rotate({ x, y }));
    };
  }

  function sweepTo(hotspot, callback) {
    return (dispatch, getState) => {
      const left = hotspot.rectLeft;
      const right = hotspot.rectRight > hotspot.rectLeft
        ? hotspot.rectRight : hotspot.rectRight + 3600;

      const angleAtEnd = left + ((right - left) / 2);
      const startAngle = ((angleAtEnd * Math.PI) / 1800) - (Math.PI - (Math.PI / 6));
      // const startAngle = ((angleAtEnd * Math.PI) / -1800) + (Math.PI / 3);
      const y = startAngle;
      const x = 0;
      const panoObject3D = panoSelectors.panoObject3D(getState());
      const v = {
        x: panoObject3D.rotation.x,
        y: panoObject3D.rotation.y,
      };
      if (Math.abs(v.y - y) > Math.PI) {
                // Travelling more than half way around the axis, so instead let's go the other way
        if (v.y > y) {
          v.y -= 2 * Math.PI;
          panoObject3D.rotation.y -= 2 * Math.PI;
        } else {
          v.y += 2 * Math.PI;
          panoObject3D.rotation.y += 2 * Math.PI;
        }
      }
      const distance = Math.sqrt(
        ((x - panoObject3D.rotation.x) ** 2) + ((y - panoObject3D.rotation.y) ** 2),
      );
      const tween = new Tween(v)
        .to({
          x,
          y,
        }, Math.sqrt(distance) * 1000)
        .easing(Easing.Quadratic.Out);
      tween.onUpdate(() => {
        dispatch(rotate(v));
      });
      tween.onComplete(callback);
      tween.start();
    };
  }

  return {
    rotate,
    rotateBy,
    sweepTo,
  };
});

export const delegate = memoize((scene) => {
  const panoSelectors = selectors(scene);

  function doEnter() {
    return (dispatch, getState) => {
      const panoCastData = panoSelectors.panoCastData(getState());
      if (panoCastData) {
        const { width, height } = gameSelectors.dimensions(getState());
        const nextStartAngle = sceneSelectors.nextSceneStartAngle(getState());
        const { fileName } = panoCastData;
        const asset = getAssetUrl(`${fileName}.png`);
        const geometries = createGeometries();
        const { material, promise: promiseMaterial } = createMaterial(asset);
        const object3D = createObject3D({
          material,
          geometries,
          startAngle: nextStartAngle,
        });
        const scene3D = createScene(object3D);
        return promiseMaterial
          .then(() => ({
            object3D,
            scene3D,
            canvas: createCanvas({ width, height }),
          }));
      }
      return Promise.resolve();
    };
  }

  function applies(state) {
    return panoSelectors.panoCastData(state);
  }

  function onStage() {
    return (dispatch, getState) => {
      const scene3D = panoSelectors.panoScene3D(getState());
      const canvas = panoSelectors.canvas(getState());
      const { width, height } = gameSelectors.dimensions(getState());
      const camera = createCamera({ width, height });
      const renderer = createRenderer({ canvas, width, height });
      positionCamera({
        camera,
        vector3: { z: -0.09 },
      });
      startRenderLoop({
        scene3D,
        camera,
        renderer,
      });
      return Promise.resolve({
        camera,
        renderer,
      });
    };
  }

  function doUnload() {
    return (dispatch, getState) => {
      const scene3D = panoSelectors.panoScene3D(getState());
      const { renderer, camera } = panoSelectors.renderElements(getState());

      scene3D.children.forEach((child) => {
        scene3D.remove(child);
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          child.material.dispose();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.context = null;
      renderer.domElement = null;

      return Promise.resolve({
        scene3D: null,
        object3D: null,
        renderer: null,
        camera: null,
        canvas: null,
      });
    };
  }

  return {
    applies,
    doEnter,
    onStage,
    doUnload,
  };
});
