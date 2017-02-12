import {
  BackSide,
  BufferGeometry,
  Object3D,
  BufferAttribute,
  Uint16Attribute,
  MeshBasicMaterial,
  LinearFilter,
  RGBFormat,
  VideoTexture,
  Mesh,
  Scene,
  TextureLoader,
  DoubleSide,
} from 'three';

import {
  getAssetUrl,
} from '../service/gamedb';
import {
  addToPanoScene,
} from './pano';
import {
  videoLoad,
} from './video';
import {
  PANOANIM_OBJECT_CREATE,
} from './types';

const SCALE_FACTOR = 1.0;
const PANOANIM_VERTEX_SIZE = 4;
const PANOANIM_X_OFFSET = Math.PI / 3.05;
const PANOANIM_Y_OFFSET = 0;
const PANOANIM_X_COORD_FACTOR = Math.PI / 1536;
const PANOANIM_Y_COORD_FACTOR = 0.0022 * SCALE_FACTOR;
const ONE_TWENTYFOURTH_RAD = Math.PI / 12;
const SIZE = 1 * SCALE_FACTOR;

function cylinderMap(y, x) {
  return {
    x: SIZE * Math.sin(x - Math.PI / 2),
    y: -y,
    z: SIZE * Math.cos(x - Math.PI / 2),
  };
}

function createPosition(panoAnimData) {
  const panoAnimPositionList = [];
  const { location, frame } = panoAnimData;
  let { width, height  } = panoAnimData;
  // Morpheus data is bugged / swapped
  let { x: y, y: x } = location;

  x *= PANOANIM_X_COORD_FACTOR;
  x += -(frame - 2) * ONE_TWENTYFOURTH_RAD;
  y -= 256;
  y *= PANOANIM_Y_COORD_FACTOR;
  width *= PANOANIM_X_COORD_FACTOR;
  height *= PANOANIM_Y_COORD_FACTOR;

  let top = y;
  let right = x + width / 2;
  let bottom = y + height;
  let left = x - width / 2;

  top += PANOANIM_Y_OFFSET;
  bottom += PANOANIM_Y_OFFSET;
  right += PANOANIM_X_OFFSET;
  left += PANOANIM_X_OFFSET;

  const bottomLeft = cylinderMap(bottom, left);
  const bottomRight = cylinderMap(bottom, right);
  const topRight = cylinderMap(top, right);
  const topLeft = cylinderMap(top, left);

  const panoAnimPositions = new BufferAttribute(
    new Float32Array(12), 3,
  );

  panoAnimPositions.setXYZ(0, bottomLeft.x, bottomLeft.y, bottomLeft.z);
  panoAnimPositions.setXYZ(1, bottomRight.x, bottomRight.y, bottomRight.z);
  panoAnimPositions.setXYZ(2, topRight.x, topRight.y, topRight.z);
  panoAnimPositions.setXYZ(3, topLeft.x, topLeft.y, topLeft.z);

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

function createObject3D(geometry, material, startAngle) {
  const mesh = new Mesh(geometry, material);
  //mesh.rotation.y += startAngle;
  return mesh;
}

export function load() {
  return (dispatch, getState) => {
    const { cache, loaded } = getState().scene;
    const { casts } = cache[loaded];
    // eslint-disable-next-line no-underscore-dangle
    casts
      .filter(c => c.__t === 'PanoAnim')
      .forEach(panoAnimCastData => {
        const fileName = getAssetUrl(panoAnimCastData.fileName);
        dispatch(videoLoad(fileName, panoAnimCastData, true));
      });
  };
}

export function panoAnimLoaded(name, videoEl) {
  return (dispatch, getState) => {
    const { panoAnim, video, pano } = getState();
    const { startAngle } = pano;
    const { casts } = panoAnim;
    const panoAnimCast = casts.find(c => c.fileName === name);
    const panoAnimVideo = video[name];
    if (panoAnimCast && panoAnimVideo) {
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
      const object3D = createObject3D(geometry, material, startAngle);
      dispatch(addToPanoScene(object3D));
      dispatch({
        type: PANOANIM_OBJECT_CREATE,
        payload: object3D,
      });
    }
  };
}
