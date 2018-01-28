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

function createPositions(panoAnimData) {
  const { location } = panoAnimData;
  const { width, height } = panoAnimData;
  const { x, y } = location;

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

function createMaterial(videoEl) {
  const texture = new VideoTexture(videoEl);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  // texture.format = RGBFormat;
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
  const selectPanoAnimData = createSelector(
    () => scene,
    s => get(s, 'casts', [])
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
  const selectPanoAnimCastMap = createSelector(
    selectPanoAnim,
    panoAnim => panoAnim.panoAnimCastMap,
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
  return {
    panoAnimData: selectPanoAnimData,
    enabledPanoAnimData: selectEnabledPanoAnimData,
    filenames: selectPanoAnimFilenames,
    enabledFilenames: selectEnabledFilenames,
    castMap: selectPanoAnimCastMap,
    isPanoAnim: selectIsPanoAnim,
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
    return panoAnimSelectors.panoAnimData(state).length;
  }

  function doEnter() {
    return (dispatch, getState) => {
      const panoAnimCasts = panoAnimSelectors.enabledPanoAnimData(getState());
      return Promise.props(panoAnimCasts.reduce((memo, curr) => {
        const name = getPanoAnimUrl(curr.fileName);
        memo[curr.fileName] = promiseVideoElement(name, { loop: curr.looping })
          .then(video => ({
            el: video,
            data: curr,
          }));
        return memo;
      }, {}))
        .then(p => ({
          panoAnimCastMap: p,
        }));
    };
  }

  function onStage() {
    return (dispatch, getState) => {
      const filenames = panoAnimSelectors.filenames(getState());
      if (!filenames.length) {
        return Promise.resolve();
      }

      const panoObject3D = panoSelectors(scene).panoObject3D(getState());
      const panoAnimCastMap = panoAnimSelectors.castMap(getState());
      return Promise.all(values(panoAnimCastMap))
        .then((panoAnims) => {
          panoAnims.forEach(({ data: panoAnimCast, el: videoEl }) => {
            const { frame } = panoAnimCast;
            const postions = createPositions(panoAnimCast);
            const uvs = createUvs();
            const geometry = createGeometry(
              postions,
              uvs,
              createIndex(),
            );
            const material = createMaterial(videoEl);
            const object3D = createObject3D({ geometry, material, frame });
            panoObject3D.add(object3D);
          });
        });
    };
  }

  function doUnload() {
    return (dispatch, getState) => {
      const panoAnimCastMap = panoAnimSelectors.castMap(getState());
      values(panoAnimCastMap).forEach(({ el: videoEl }) => {
        videoEl.oncanplaythrough = null;
        videoEl.onerror = null;
      });
      return Promise.resolve({
        panoAnimCastMap: null,
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
