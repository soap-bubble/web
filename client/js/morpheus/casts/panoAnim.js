import {
  BufferGeometry,
  BufferAttribute,
  Uint16Attribute,
  MeshBasicMaterial,
  LinearFilter,
  RGBFormat,
  VideoTexture,
  Mesh,
  DoubleSide,
} from 'three';
import {
  get,
  map,
  values,
} from 'lodash';
import {
  createSelector,
} from 'reselect';
import {
  getPanoAnimUrl,
} from 'service/gamedb';
import {
  actions as videoActions,
  selectors as videoSelectors,
} from 'morpheus/video';
import {
  selectors as panoSelectors,
} from 'morpheus/casts/pano';
import {
  defer,
} from 'utils/promise';

const selectPanoAnim = state => get(state, 'casts.panoAnim');
const selectPanoAnimFilenames = createSelector(
  selectPanoAnim,
  panoAnim => panoAnim.filenames,
);
const selectPanoAnimCastMap = createSelector(
  selectPanoAnim,
  panoAnim => panoAnim.panoAnimCastMap,
);
const selectIsPanoAnim = createSelector(
  selectPanoAnimFilenames,
  filenames => !!filenames.length,
);

const ONE_TWENTYFOURTH_RAD = Math.PI / 12;
const SLICE_WIDTH = 0.1325;
const SLICE_HEIGHT = 0.55;
const DBL_SLICE_WIDTH = SLICE_WIDTH * 2;
const DBL_SLICE_HEIGHT = SLICE_HEIGHT * 2;
const SLICE_DEPTH = 0.999;
const SLICE_PIX_WIDTH = 128;
const SLICE_PIX_HEIGHT = 512;

function createPositions(panoAnimData) {
  const { location, frame } = panoAnimData;
  let { width, height  } = panoAnimData;
  let { x, y } = location;

  let right = -((2 * SLICE_WIDTH) * (x / SLICE_PIX_WIDTH) - SLICE_WIDTH);
  let left = -((2 * SLICE_WIDTH) * ((x + width) / SLICE_PIX_WIDTH) - SLICE_WIDTH);
  let bottom = -((2 * SLICE_HEIGHT) * (y / SLICE_PIX_HEIGHT) - SLICE_HEIGHT);
  let top = -((2 * SLICE_HEIGHT) * ((y + height) / SLICE_PIX_HEIGHT) - SLICE_HEIGHT);


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
  return new Uint16Attribute([
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
  texture.format = RGBFormat;
  return new MeshBasicMaterial({
    map: texture,
    side: DoubleSide,
  });
}

function createObject3D(geometry, material, frame) {
  const mesh = new Mesh(geometry, material);
  mesh.rotation.y =  -(frame * ONE_TWENTYFOURTH_RAD);
  return mesh;
}

let videoElDefers;

function doEnter(scene) {
  return (dispatch) => {
    const { casts } = scene;
    const panoAnimCasts = casts
      // eslint-disable-next-line no-underscore-dangle
      .filter(c => c.__t === 'PanoAnim');
    const panoAnimCastMap = {};
    videoElDefers = {};
    return Promise.all(
      panoAnimCasts.map((panoAnimCastData) => {
        const name = getPanoAnimUrl(panoAnimCastData.fileName);
        videoElDefers[name] = defer();
        panoAnimCastMap[name] = panoAnimCastData;
        return name;
      }))
      .then(filenames => ({
        filenames,
        scene,
        panoAnimCastMap,
      }));
  };
}

function videoElRef(name, videoEl) {
  return () => {
    if (!videoElDefers[name]) {
      throw new Error(`Don't know anything about ${name}`);
    }
    videoElDefers[name].resolve({
      name,
      videoEl,
    });
  };
}

function onStage() {
  return (dispatch, getState) => {
    const filenames = selectPanoAnimFilenames(getState());
    if (!filenames.length) {
      return Promise.resolve();
    }

    const panoScene3D = panoSelectors.panoScene3D(getState());
    const panoAnimCastMap = selectPanoAnimCastMap(getState());
    return Promise.all(values(map(videoElDefers, 'promise')))
      .then((videoEls) => {
        videoEls.forEach(({ name, videoEl }) => {
          const panoAnimCast = panoAnimCastMap[name];
          // const { videoWidth: width, videoHeight: height } = videoEl;
          const { frame } = panoAnimCast;
          const postions = createPositions(panoAnimCast);
          const uvs = createUvs();
          const geometry = createGeometry(
            postions,
            uvs,
            createIndex(),
          );
          const material = createMaterial(videoEl);
          const object3D = createObject3D(geometry, material, frame);
          panoScene3D.add(object3D);
        });
      });
  };
}

export const actions = {
  doEnter,
  onStage,
  videoElRef,
};

export const selectors = {
  filenames: selectPanoAnimFilenames,
  castMap: selectPanoAnimCastMap,
  isPanoAnim: selectIsPanoAnim,
};
