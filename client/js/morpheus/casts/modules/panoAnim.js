import {
  BufferGeometry,
  BufferAttribute,
  Uint16BufferAttribute,
  MeshBasicMaterial,
  LinearFilter,
  VideoTexture,
  Mesh,
  DoubleSide,
} from 'three';
import {
  get,
  memoize,
  uniq,
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
} from 'morpheus/casts/modules/pano';

const ONE_TWENTYFOURTH_RAD = Math.PI / 12;
const SLICE_WIDTH = 0.1325;
const SLICE_HEIGHT = 0.55;
const SLICE_DEPTH = 0.999;
const SLICE_PIX_WIDTH = 128;
const SLICE_PIX_HEIGHT = 512;

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
  return new MeshBasicMaterial({
    map: texture,
    side: DoubleSide,
  });
}

function createObject3D({ geometry, material, frame }) {
  const mesh = new Mesh(geometry, material);
  mesh.rotation.y = -(frame * ONE_TWENTYFOURTH_RAD);
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
  const selectIsPano = createSelector(
    () => scene,
    (sceneData) => {
      const { casts } = sceneData;
      return !!(casts.find(c => c.__t === 'PanoCast'));
    },
  );
  const selectObject3D = createSelector(
    selectPanoAnim,
    panoAnim => panoAnim.object3D,
  );
  return {
    isPano: selectIsPano,
    panoAnimData: selectPanoAnimData,
    enabledPanoAnimData: selectEnabledPanoAnimData,
    filenames: selectPanoAnimFilenames,
    enabledFilenames: selectEnabledFilenames,
    videoCasts: selectVideoCasts,
    isPanoAnim: selectIsPanoAnim,
    object3D: selectObject3D,
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
        && (panoAnimSelectors.panoAnimData(state).length !== 0));
  }

  function doEnter() {
    return (dispatch, getState) => {
      const videoCastsData = panoAnimSelectors.enabledPanoAnimData(getState());

      return Promise.all(
        videoCastsData.map(
          curr => promiseVideoElement(getPanoAnimUrl(curr.fileName), { loop: curr.looping })
            .then(video => ({
              el: video,
              data: curr,
              positions: createVideoPositions(curr),
              material: createVideoMaterial(video),
            }))),
      )
        .then(videoCasts => ({
          videoCasts,
        }));
    };
  }

  function onStage() {
    return (dispatch, getState) => {
      const panoObject3D = panoSelectors(scene).panoObject3D(getState());
      const videoCasts = panoAnimSelectors.videoCasts(getState());

      return Promise.all(videoCasts)
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
            return {
              object3D,
            };
          });
        });
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
        object3D: null,
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
