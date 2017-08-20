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
} from 'lodash';
import {
  defer,
} from 'utils/promise';
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
    gamestateSelectors.gamestates,
    (s, gamestates) => get(s, 'casts', [])
      .filter(c => c.__t === 'PanoAnim')
      .filter(c => isActive({ cast: c, gamestates })),
  );
  const selectPanoAnim = createSelector(
    selectSceneCache,
    cache => get(cache, 'panoAnim'),
  );
  const selectPanoAnimFilenames = createSelector(
    selectPanoAnim,
    panoAnim => uniq(panoAnim.filenames),
  );
  const selectPanoAnimCastMap = createSelector(
    selectPanoAnim,
    panoAnim => panoAnim.panoAnimCastMap,
  );
  const selectIsPanoAnim = createSelector(
    selectPanoAnimFilenames,
    filenames => !!filenames.length,
  );
  return {
    panoAnimData: selectPanoAnimData,
    filenames: selectPanoAnimFilenames,
    castMap: selectPanoAnimCastMap,
    isPanoAnim: selectIsPanoAnim,
  };
});

export const delegate = memoize((scene) => {
  let videoElDefers;
  const panoAnimSelectors = selectors(scene);

  function applies(state) {
    return panoAnimSelectors.panoAnimData(state).length;
  }

  function doEnter() {
    return (dispatch, getState) => {
      const panoAnimCasts = panoAnimSelectors.panoAnimData(getState());
      const panoAnimCastMap = {};
      videoElDefers = {};
      return Promise.all(
        panoAnimCasts.map((panoAnimCastData) => {
          const name = getPanoAnimUrl(panoAnimCastData.fileName);
          videoElDefers[name] = defer();
          panoAnimCastMap[name] = panoAnimCastData;
          let video;
          return new Promise((resolve, reject) => {
            video = createVideo(name, {
              loop: true,
              oncanplaythrough() {
                resolve(video);
              },
              onerror: reject,
            });
          })
            .then((video) => {
              video.play();
              videoElDefers[name].resolve({
                videoEl: video,
                name,
              });
            });
          return name;
        }))
        .then(filenames => ({
          filenames,
          panoAnimCastMap,
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
      return Promise.all(values(map(videoElDefers, 'promise')))
        .then((videoEls) => {
          videoEls.forEach(({ name, videoEl }) => {
            const panoAnimCast = panoAnimCastMap[name];
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

  return {
    applies,
    doEnter,
    onStage,
  };
});
