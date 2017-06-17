import {
  BufferGeometry,
  BufferAttribute,
  Uint16BufferAttribute,
  MeshBasicMaterial,
  LinearFilter,
  RGBFormat,
  VideoTexture,
  Mesh,
  DoubleSide,
} from 'three';

import {
  getPanoAnimUrl,
} from 'service/gamedb';
import {
  actions as panoActions,
} from 'morpheus/pano';
import {
  actions as videoActions,
} from 'morpheus/video';
import {
  PANOANIM_OBJECT_CREATE,
} from './actionTypes';

const ONE_TWENTYFOURTH_RAD = Math.PI / 12;
const SLICE_WIDTH = 0.1325;
const SLICE_HEIGHT = 0.55;
const SLICE_DEPTH = 0.999;
const SLICE_PIX_WIDTH = 128;
const SLICE_PIX_HEIGHT = 512;

function createPosition(panoAnimData) {
  const panoAnimPositionList = [];
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

export function load() {
  return (dispatch, getState) => {
    const { scene } = getState();
    const { currentScene: sceneData } = scene;
    const { casts } = sceneData;
    // eslint-disable-next-line no-underscore-dangle
    casts
      .filter(c => c.__t === 'PanoAnim')
      .forEach((panoAnimCastData) => {
        const fileName = getPanoAnimUrl(panoAnimCastData.fileName);
        dispatch(videoActions.load(fileName, panoAnimCastData, true));
      });
  };
}

export function panoAnimLoaded(name, videoEl) {
  return (dispatch, getState) => {
    const { panoAnim, video, pano } = getState();
    const { startAngle } = pano;
    const { casts } = panoAnim;
    const panoAnimCast = casts
      .find(c => name.indexOf(c.fileName) !== -1);
    const panoAnimVideo = video[name];
    if (panoAnimCast && panoAnimVideo) {
      const { frame } = panoAnimCast;
      const { videoWidth: width, videoHeight: height } = videoEl;
      const postions = createPosition({
        ...panoAnimCast,
        width,
        height,
      });
      const uvs = createUvs();
      const index = createIndex();
      const geometry = createGeometry(
        postions,
        uvs,
        index,
      );
      const material = createMaterial(videoEl);
      const object3D = createObject3D(geometry, material, frame);
      dispatch(panoActions.addToPanoScene(object3D));
      dispatch({
        type: PANOANIM_OBJECT_CREATE,
        payload: object3D,
      });
    }
  };
}
