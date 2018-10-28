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
  CanvasTexture,
} from 'three';
import {
  Tween,
  Easing,
} from 'tween';
import { get } from 'lodash';
import memoize from 'utils/memoize';
import { createSelector } from 'reselect';
import {
  positionCamera,
} from 'utils/three';
import renderEvents from 'utils/render';
import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  actions as gameActions,
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  composeMouseTouch,
  touchDisablesMouse,
} from 'morpheus/hotspot/eventInterface';
import {
  isActive,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate';
import createCanvas from 'utils/canvas';
import assetLoader from 'morpheus/render/pano/loader';
import loggerFactory from 'utils/logger';
import {
  momentum as momentumFactory,
  pano as inputHandlerFactory,
} from 'morpheus/hotspot';
import {
  disposeScene,
} from 'utils/three';
import {
  forScene,
} from '../selectors';
import {
  forMorpheusType,
} from '../matchers';

const twentyFourthRad = Math.PI / 12;
const sliceWidth = 0.1325;
const sliceHeight = 0.56;
const sliceDepth = 1.0;
const X_ROTATION_OFFSET = 0 * (Math.PI / 180);
const logger = loggerFactory('casts:module:pano');

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
    mesh.name = 'pano';
    return mesh;
  });

  const object3D = new Object3D();
  meshes.forEach(m => object3D.add(m));
  object3D.rotation.y += startAngle;
  return object3D;
}

function createMaterial(map) {
  let material;
  const promise = new Promise(
    (resolve) => {
      material = new MeshBasicMaterial({
        side: BackSide,
        map,
      });
      resolve();
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

function startRenderLoop({ scene3D, camera, renderer, update }) {
  window.camera = camera;
  window.PerspectiveCamera = PerspectiveCamera;
  const render = () => {
    update();
    renderer.render(scene3D, window.camera);
  };
  renderEvents.onRender(render);
  renderEvents.onDestroy(() => {
    renderer.dispose();
  });
}

const selectors = memoize((scene) => {
  const selectSceneCache = castSelectors.forScene(scene).cache;

  const selectPanoCastData = createSelector(
    () => scene,
    s => get(s, 'casts', []).find(c => c.__t === 'PanoCast'),
  );
  const selectPanoCastAnimData = createSelector(
    () => scene,
    s => get(s, 'casts', []).filter(c => c.__t === 'PanoAnim'),
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
  const selectRenderElements = createSelector(
    selectPano,
    pano => get(pano, 'webgl'),
  );
  const selectCanvas = createSelector(
    selectRenderElements,
    re => get(re, 'canvas'),
  );
  const selectRotation = createSelector(
    selectPanoObject3D,
    object3D => get(object3D, 'rotation'),
  );
  const selectAssets = createSelector(
    selectPano,
    pano => get(pano, 'assets'),
  );
  const selectRenderedCanvas = createSelector(
    selectPano,
    pano => get(pano, 'renderedCanvas'),
  );
  const selectCanvasTexture = createSelector(
    selectPano,
    pano => get(pano, 'canvasTexture'),
  );
  const selectIsLoaded = createSelector(
    selectPano,
    pano => get(pano, 'isLoaded'),
  );
  const selectIsLoading = createSelector(
    selectPano,
    pano => get(pano, 'isLoading'),
  );
  const selectPanoHandler = createSelector(
    selectPano,
    pano => get(pano, 'panoHandler'),
  );
  const selectInputHandler = createSelector(
    selectPano,
    pano => get(pano, 'inputHandler'),
  );
  const selectLoader = createSelector(
    selectPano,
    pano => get(pano, 'loader'),
  );
  return {
    panoCastData: selectPanoCastData,
    panoAnimData: selectPanoCastAnimData,
    panoScene3D: selectPanoScene3D,
    panoObject3D: selectPanoObject3D,
    cache: selectPano,
    renderElements: selectRenderElements,
    rotation: selectRotation,
    canvas: selectCanvas,
    renderedCanvas: selectRenderedCanvas,
    canvasTexture: selectCanvasTexture,
    assets: selectAssets,
    isLoaded: selectIsLoaded,
    isLoading: selectIsLoading,
    panoHandler: selectPanoHandler,
    inputHandler: selectInputHandler,
    loader: selectLoader,
  };
});

export const actions = (scene) => {
  let isSweeping = false;

  function rotate({ x, y }) {
    return () => {
      const {
        hotspot,
        pano,
      } = forScene(scene).cache();
      const scene3D = hotspot.scene3D;
      const object3D = pano.object3D;
      const rot = clamp({
        x,
        y,
      });
      Object.assign(scene3D.rotation, rot);
      Object.assign(object3D.rotation, rot);
    };
  }

  function rotateBy({ x: deltaX, y: deltaY }) {
    return (dispatch) => {
      if (!isSweeping) {
        const object3D = forScene(scene).cache().pano.object3D;
        let {
          x,
          y,
        } = object3D.rotation;

        x += deltaX;
        y += deltaY;

        dispatch(rotate({ x, y }));
      }
    };
  }

  function sweepTo({
    rectLeft,
    rectRight,
  }) {
    return (dispatch) => {
      const left = rectLeft;
      const right = rectRight > rectLeft
        ? rectRight : rectRight + 3600;

      const angleAtEnd = left + ((right - left) / 2);
      const startAngle = ((angleAtEnd * Math.PI) / 1800) - (Math.PI - (Math.PI / 6));
      const y = startAngle;
      const x = 0;
      const object3D = forScene(scene).cache().pano.object3D;
      if (object3D) {
        const v = {
          x: object3D.rotation.x,
          y: object3D.rotation.y,
        };
        if (Math.abs(v.y - y) > Math.PI) {
          // Travelling more than half way around the axis, so instead let's go the other way
          if (v.y > y) {
            v.y -= 2 * Math.PI;
            object3D.rotation.y -= 2 * Math.PI;
          } else {
            v.y += 2 * Math.PI;
            object3D.rotation.y += 2 * Math.PI;
          }
        }
        const distance = Math.sqrt(
          ((x - object3D.rotation.x) ** 2) + ((y - object3D.rotation.y) ** 2),
        );
        return new Promise((resolve) => {
          if (distance === 0) {
            // What do you know... already there
            resolve();
          } else {
            isSweeping = true;
            const tween = new Tween(v)
              .to({
                x,
                y,
              }, Math.sqrt(distance) * 1000)
              .easing(Easing.Quadratic.Out);
            tween.onUpdate(() => {
              dispatch(rotate(v));
            });
            tween.onComplete(() => {
              isSweeping = false;
              resolve();
            });
            tween.start();
          }
        });
      }
      console.error('object3D not defined');
      return Promise.resolve();
    };
  }

  return {
    rotate,
    rotateBy,
    sweepTo,
  };
};

export const delegate = memoize((scene) => {
  function applies() {
    return scene.casts.find(forMorpheusType('PanoCast'));
  }

  function doLoad({
    setState,
    isLoaded,
    isLoading,
  }) {
    return (dispatch, getState) => {
      if (isLoaded) {
        logger.debug({
          sceneId: scene.sceneId,
          message: 'Already loaded so returning existing state',
        });
        return Promise.resolve({});
      }
      if (isLoading) {
        logger.debug({
          sceneId: scene.sceneId,
          message: 'Already loading so waiting for load finish and returning existing state',
        });
        return isLoading;
      }
      const panoCastData = scene.casts.filter(forMorpheusType('PanoCast'));
      if (panoCastData) {
        const nextStartAngle = sceneSelectors.nextSceneStartAngle(getState());

        const renderedCanvas = createCanvas({
          width: 2048,
          height: 1024,
        });
        const loader = assetLoader({
          scene,
          onVideoEndFactory(data) {
            return function onVideoEnded() {
              const el = this;
              el.onended = null;
              const { nextSceneId } = data;
              const hasNextScene = nextSceneId && nextSceneId !== 0x3FFFFFFF;
              if (hasNextScene) {
                dispatch(sceneActions.goToScene(nextSceneId, false));
              }
            };
          },
        });
        const assets = loader.load(gamestateSelectors.forState(getState()));

        const geometries = createGeometries();
        const map = new CanvasTexture(renderedCanvas);
        const { material, promise: promiseMaterial } = createMaterial(map);
        const object3D = createObject3D({
          material,
          geometries,
          startAngle: nextStartAngle,
        });
        const scene3D = createScene(object3D);
        const promise = promiseMaterial
          .then(() => {
            logger.debug({
              sceneId: scene.sceneId,
              message: 'Finished loading material',
            });
          })
          .then(() => ({
            object3D,
            scene3D,
            assets,
            renderedCanvas,
            loader,
            canvasTexture: map,
            isLoaded: true,
          }));
        setState({
          isLoading: promise,
        });
        return promise;
      }
      return Promise.resolve();
    };
  }

  function doEnter({
    webGlPool,
  }) {
    return (dispatch) => {
      const panoHandler = inputHandlerFactory({
        dispatch,
        scene,
      });

      const momentumHandler = momentumFactory({
        dispatch,
        scene,
      });
      logger.debug({
        sceneId: scene.sceneId,
        message: 'acquire webgl from pool',
        spareResourceCapacity: webGlPool.spareResourceCapacity,
        size: webGlPool.size,
      });
      return webGlPool.acquire().then((webgl) => {
        logger.debug({
          sceneId: scene.sceneId,
          message: 'doEnter finished',
        });
        return {
          webgl,
            // Hold on to panohandler separately because it needs to be turned off
          panoHandler,
          inputHandler: touchDisablesMouse(
              composeMouseTouch(
                panoHandler.handlers,
                momentumHandler,
              ),
            ),
        };
      });
    };
  }

  function onStage({
    scene3D,
    webgl,
    renderedCanvas,
    canvasTexture,
    loader,
    object3D,
  }) {
    return (dispatch, getState) => {
      const { camera, renderer, setSize } = webgl;
      const { width, height } = gameSelectors.dimensions(getState());
      const nextStartAngle = sceneSelectors.nextSceneStartAngle(getState());
      if (object3D) {
        object3D.rotation.y = nextStartAngle;
      }

      setSize({ width, height });

      positionCamera({
        camera,
        vector3: { z: -0.09 },
      });

      loader.play();

      startRenderLoop({
        scene3D,
        camera,
        renderer,
        update: () => {
          canvasTexture.needsUpdate = true;
          loader.load(gamestateSelectors.forState(getState()))
            .forEach((contextProvider) => {
              const ctx = renderedCanvas.getContext('2d');
              const {
                render,
              } = contextProvider;
              render(ctx);
            });
          dispatch(gameActions.drawCursor());
        },
      });

      return Promise.resolve({
        camera,
        renderer,
      });
    };
  }

  function doExit({
    panoHandler,
  }) {
    return () => {
      panoHandler.off();
      return Promise.resolve({
        panoHandler: null,
        inputHandler: null,
      });
    };
  }

  function doPreunload({
    scene3D,
    canvasTexture,
    loader,
  }) {
    return () => {
      disposeScene(scene3D);
      canvasTexture.dispose();
      loader.dispose();
      logger.debug({
        sceneId: scene.sceneId,
        message: 'Release webgl resources',
      });
      return Promise.resolve({
        canvasTexture: null,
        isLoaded: false,
        isLoading: null,
        loader: null,
      });
    };
  }

  function doUnload(state) {
    const {
      webGlPool,
      webgl,
    } = state;
    return (dispatch) => {
      logger.debug({
        sceneId: scene.sceneId,
        message: 'Release webgl resources',
      });

      return webGlPool.release(webgl).then(() => {
        logger.debug({
          sceneId: scene.sceneId,
          message: 'doUnload finished',
          spareResourceCapacity: webGlPool.spareResourceCapacity,
          size: webGlPool.size,
        });
        return dispatch(doPreunload(state))
          .then(clear => ({
            scene3D: null,
            object3D: null,
            webgl: null,
            ...clear,
          }));
      });
    };
  }

  return {
    applies,
    doLoad,
    doPreload: doLoad,
    doEnter,
    onStage,
    doExit,
    doUnload,
    doPreunload,
  };
});
