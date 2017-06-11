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

const selectPanoAnimFilenames = state => get(state, 'casts.panoAnim.filenames', '');
const selectPanoAnimCastMap = state => get(state, 'casts.panoAnim.panoAnimCastMap', {});

const ONE_TWENTYFOURTH_RAD = Math.PI / 12;
const SLICE_WIDTH = 0.1325;
const SLICE_HEIGHT = 0.55;
const DBL_SLICE_WIDTH = SLICE_WIDTH * 2;
const DBL_SLICE_HEIGHT = SLICE_HEIGHT * 2;
const SLICE_DEPTH = 0.999;
const SLICE_PIX_WIDTH = 128;
const SLICE_PIX_HEIGHT = 512;

function createPositions(panoAnimData) {
  const { location } = panoAnimData;
  const { width, height } = panoAnimData;
  const { x, y } = location;

  const right = -(DBL_SLICE_WIDTH *
    ((x / SLICE_PIX_WIDTH) - SLICE_WIDTH));
  const left = -(DBL_SLICE_WIDTH *
    (((x + width) / SLICE_PIX_WIDTH) - SLICE_WIDTH));
  const bottom = -(DBL_SLICE_HEIGHT *
    ((y / SLICE_PIX_HEIGHT) - SLICE_HEIGHT));
  const top = -(DBL_SLICE_HEIGHT *
    (((y + height) / SLICE_PIX_HEIGHT) - SLICE_HEIGHT));

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
  if (!videoElDefers[name]) {
    throw new Error(`Don't know anything about ${name}`);
  }
  videoElDefers[name].resolve(videoEl);
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
      .then(() => {
        filenames.forEach((name) => {
          const panoAnimCast = panoAnimCastMap[name];
          const videoEl = videoSelectors.forCast(panoAnimCast).videoEl(getState);
          if (panoAnimCast) {
            const { frame } = panoAnimCast;
            const postions = createPositions(panoAnimCast);
            const uvs = createUvs();
            const index = createIndex();
            const geometry = createGeometry(
              postions,
              uvs,
              index,
            );
            const material = createMaterial(videoEl);
            const object3D = createObject3D(geometry, material, frame);
            panoScene3D.add(object3D);
          }
        });
      });
  };
}

export const actions = {
  doEnter,
  onStage,
};

export const selectors = {
  filenames: selectPanoAnimFilenames,
  castMap: selectPanoAnimCastMap,
};
