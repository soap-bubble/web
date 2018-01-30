import {
  BufferGeometry,
  BufferAttribute,
  Uint16BufferAttribute,
  MeshBasicMaterial,
  LinearFilter,
  VideoTexture,
  TextureLoader,
  Mesh,
  DoubleSide,
  BackSide,
} from 'three';
import {
  get,
  map,
  memoize,
  values,
  uniq,
  pick,
} from 'lodash';
import Promise from 'bluebird';
import {
  createSelector,
} from 'reselect';
import {
  createVideo,
} from 'utils/video';
import {
  getPanoAnimUrl,
  getAssetUrl,
} from 'service/gamedb';
import {
  isActive,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as panoSelectors,
} from './pano';

const ONE_TWENTYFOURTH_RAD = Math.PI / 12;
const SLICE_WIDTH = 0.1325;
const SLICE_HEIGHT = 0.55;
const SLICE_DEPTH = 0.999;
const SLICE_PIX_WIDTH = 128;
const SLICE_PIX_HEIGHT = 512;
const SCENE_WIDTH = SLICE_WIDTH * 24;

function createVideoPositions(panoAnimData) {
  const { location: { x, y }, width, height } = panoAnimData;

  /* eslint-disable no-mixed-operators */
  const right = -((2 * SLICE_WIDTH) * (x / SLICE_PIX_WIDTH) - SLICE_WIDTH);
  const left = -((2 * SLICE_WIDTH) * ((x + width) / SLICE_PIX_WIDTH) - SLICE_WIDTH);
  const bottom = -((2 * SLICE_HEIGHT) * (y / SLICE_PIX_HEIGHT) - SLICE_HEIGHT);
  const top = -((2 * SLICE_HEIGHT) * ((y + height) / SLICE_PIX_HEIGHT) - SLICE_HEIGHT);


  const panoAnimPositions = new BufferAttribute(new Float32Array([
    left, top, SLICE_DEPTH,
    right, top, SLICE_DEPTH,
    right, bottom, SLICE_DEPTH,
    left, bottom, SLICE_DEPTH,
  ]), 3);

  return panoAnimPositions;
}

const SCALE_FACTOR = 1.0;
const HOTSPOT_X_OFFSET = Math.PI / 3;
const HOTSPOT_X_COORD_FACTOR = Math.PI / -1800;
const SIZE = 0.99 * SCALE_FACTOR;
const HOTSPOT_Y_COORD_FACTOR = 0.0022 * SCALE_FACTOR;
const SCALE_WIDTH_FACTOR = 1.2;
const SCALE_HEIGHT_FACTOR = 0.95;


function cylinderMap(y, x) {
  return {
    x: SIZE * Math.sin(x - (Math.PI / 2)),
    y: -y,
    z: SIZE * Math.cos(x - (Math.PI / 2)),
  };
}


function createControlledPositions(controlledCastsData) {
  const { controlledLocation: { x, y }, width, height } = controlledCastsData;

  let top = y - 250;
  let bottom = y + (height * SCALE_HEIGHT_FACTOR) - 250;
  let left = x;
  let right = x + (width * SCALE_WIDTH_FACTOR);

  top *= HOTSPOT_Y_COORD_FACTOR;
  bottom *= HOTSPOT_Y_COORD_FACTOR;
  right = (HOTSPOT_X_COORD_FACTOR * right) + HOTSPOT_X_OFFSET;
  left = (HOTSPOT_X_COORD_FACTOR * left) + HOTSPOT_X_OFFSET;

  const bottomLeft = cylinderMap(bottom, left);
  const bottomRight = cylinderMap(bottom, right);
  const topRight = cylinderMap(top, right);
  const topLeft = cylinderMap(top, left);

  const positions = new BufferAttribute(
    new Float32Array(12), 3,
  );

  positions.setXYZ(0, bottomLeft.x, bottomLeft.y, bottomLeft.z);
  positions.setXYZ(1, bottomRight.x, bottomRight.y, bottomRight.z);
  positions.setXYZ(2, topRight.x, topRight.y, topRight.z);
  positions.setXYZ(3, topLeft.x, topLeft.y, topLeft.z);

  return positions;
}

function createUvs() {
  const paUvs = new BufferAttribute(new Float32Array(8), 2);

  paUvs.setXY(0, 1.0, 0.0);
  paUvs.setXY(1, 0.0, 0.0);
  paUvs.setXY(2, 0.0, 1.0);
  paUvs.setXY(3, 1.0, 1.0);

  return paUvs;
}

function createIndex() {
  return new Uint16BufferAttribute([
    0, 1, 2,
    0, 2, 3,
  ], 1);
}

function createGeometry(positions, uvs, index) {
  const geometry = new BufferGeometry();
  geometry.setIndex(index);
  geometry.addAttribute('position', positions);
  geometry.addAttribute('uv', uvs);
  return geometry;
}

function createVideoMaterial(videoEl) {
  const texture = new VideoTexture(videoEl);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  // texture.format = RGBFormat;
  return new MeshBasicMaterial({
    map: texture,
    side: DoubleSide,
  });
}

function createMaterial(asset) {
  const loader = new TextureLoader();
  loader.crossOrigin = 'anonymous';
  let material;
  return new Promise(
    (resolve, reject) => {
      material = new MeshBasicMaterial({
        side: DoubleSide,
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
}

function createObject3D({ geometry, material, frame }) {
  const mesh = new Mesh(geometry, material);
  if (frame) {
    mesh.rotation.y = -(frame * ONE_TWENTYFOURTH_RAD);
  }
  return mesh;
}

export const selectors = memoize((scene) => {
  const selectSceneCache = castSelectors.forScene(scene).cache;
  const allCasts = () => get(scene, 'casts', []);
  const selectPanoAnimData = createSelector(
    allCasts,
    casts => casts
      .filter(c => c.__t === 'PanoAnim'),
  );
  const selectEnabledPanoAnimData = createSelector(
    selectPanoAnimData,
    gamestateSelectors.forState,
    (panos, gamestates) => panos
      .filter(c => isActive({ cast: c, gamestates })),
  );
  const selectPanoAnim = createSelector(
    selectSceneCache,
    cache => get(cache, 'panoAnim'),
  );
  const selectVideoCasts = createSelector(
    selectPanoAnim,
    panoAnim => panoAnim.videoCasts,
  );
  const selectControlledCasts = createSelector(
    selectPanoAnim,
    panoAnim => panoAnim.controlledCasts,
  );
  const mapPanoAnimDataToUniqueFilenames = panoAnimData => uniq(
    panoAnimData
      .map(p => p.fileName),
    )
      .map(getPanoAnimUrl);

  const selectPanoAnimFilenames = createSelector(
    selectPanoAnimData,
    mapPanoAnimDataToUniqueFilenames,
  );
  const selectIsPanoAnim = createSelector(
    selectPanoAnimFilenames,
    filenames => !!filenames.length,
  );
  const selectEnabledFilenames = createSelector(
    selectEnabledPanoAnimData,
    mapPanoAnimDataToUniqueFilenames,
  );
  const selectControlledCastsData = createSelector(
    allCasts,
    casts => casts.filter(c => c.__t === 'ControlledMovieCast', []),
  );
  const selectIsPano = createSelector(
    () => scene,
    (sceneData) => {
      const { casts } = sceneData;
      return !!(casts.find(c => c.__t === 'PanoCast'));
    },
  );
  return {
    isPano: selectIsPano,
    panoAnimData: selectPanoAnimData,
    enabledPanoAnimData: selectEnabledPanoAnimData,
    filenames: selectPanoAnimFilenames,
    enabledFilenames: selectEnabledFilenames,
    videoCasts: selectVideoCasts,
    controlledCasts: selectControlledCasts,
    isPanoAnim: selectIsPanoAnim,
    controlledCastsData: selectControlledCastsData,
  };
});

function promiseVideoElement(name, options) {
  return new Promise((resolve, reject) => {
    const video = createVideo(name, {
      ...options,
      defaultMuted: true,
      autoplay: true,
      oncanplaythrough() {
        resolve(video);
      },
      onerror: reject,
    });
  });
}

export const delegate = memoize((scene) => {
  const panoAnimSelectors = selectors(scene);

  function applies(state) {
    return (
      panoAnimSelectors.isPano(state)
        && ((panoAnimSelectors.panoAnimData(state).length !== 0)
        || (panoAnimSelectors.controlledCastsData(state).length !== 0)));
  }

  function doEnter() {
    return (dispatch, getState) => {
      const videoCastsData = panoAnimSelectors.enabledPanoAnimData(getState());
      const controlledCastsData = panoAnimSelectors.controlledCastsData(getState());

      return Promise.all(
        [
          controlledCastsData.map(
            curr => createMaterial(getAssetUrl(curr.fileName, 'png'))
              .then(material => ({
                material,
                positions: createControlledPositions(curr),
                data: curr,
              })),
          ),
          videoCastsData.map(
            curr => promiseVideoElement(getPanoAnimUrl(curr.fileName), { loop: curr.looping })
              .then(video => ({
                el: video,
                data: curr,
                positions: createVideoPositions(curr),
                material: createVideoMaterial(video),
              }))),
        ],
      )
        .then(([controlledCasts, videoCasts]) => ({
          videoCasts, controlledCasts,
        }));
    };
  }

  function onStage() {
    return (dispatch, getState) => {
      const panoObject3D = panoSelectors(scene).panoObject3D(getState());
      const videoCasts = panoAnimSelectors.videoCasts(getState());
      const controlledCasts = panoAnimSelectors.controlledCasts(getState());

      return Promise.all([
        Promise.all(controlledCasts)
          .then((imageCasts) => {
            imageCasts.forEach(({ material, positions }) => {
              const uvs = createUvs();
              const geometry = createGeometry(
                positions,
                uvs,
                createIndex(),
              );
              const object3D = createObject3D({ geometry, material });
              panoObject3D.add(object3D);
            });
          }),
        Promise.all(videoCasts)
          .then((panoAnims) => {
            panoAnims.forEach(({ data: panoAnimCast, material, positions }) => {
              const { frame } = panoAnimCast;
              const uvs = createUvs();
              const geometry = createGeometry(
                positions,
                uvs,
                createIndex(),
              );
              const object3D = createObject3D({ geometry, material, frame });
              panoObject3D.add(object3D);
            });
          }),
      ]);
    };
  }

  function doUnload() {
    return (dispatch, getState) => {
      const panoAnimCasts = panoAnimSelectors.videoCasts(getState());
      panoAnimCasts.forEach(({ el: videoEl }) => {
        videoEl.oncanplaythrough = null;
        videoEl.onerror = null;
      });
      return Promise.resolve({
        panoAnimCasts: null,
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
