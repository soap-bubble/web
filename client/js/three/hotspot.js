import { singleton } from '../utils/object';

const SCALE_FACTOR = 1.0;

const HOTSPOT_X_OFFSET = Math.PI/3;
const HOTSPOT_X_COORD_FACTOR = Math.PI / -1800;
const HOTSPOT_Y_COORD_FACTOR = 0.004 * SCALE_FACTOR;
const SIZE = 0.99 * SCALE_FACTOR;

function scaleFromHotspotToRad(rect) {
  return {
    left: HOTSPOT_X_COORD_FACTOR * rect.left + HOTSPOT_X_OFFSET,
    right: HOTSPOT_X_COORD_FACTOR * rect.right + HOTSPOT_X_OFFSET,
    top: HOTSPOT_Y_COORD_FACTOR * rect.top,
    bottom: HOTSPOT_Y_COORD_FACTOR * rect.bottom
  };
}

function cylinderMap(y, x) {
  return {
    x: SIZE * Math.sin(x),
    y,
    z: SIZE * Math.cos(x)
  };
}

function hotspotMap(y, x) {
  return {
    x: x / 450 - 4,
    y: -y / 500,
    z: 0
  };
}

export default function createHotspot(hotspotData) {
  const {
    rectTop: top,
    rectRight: right,
    rectBottom: bottom,
    rectLeft: left
  } = hotspotData;
  const cylinderVector3DsFactory = singleton(() => [
    cylinderMap(selfie.rad.bottom, selfie.rad.left),
    cylinderMap(selfie.rad.bottom, selfie.rad.right),
    cylinderMap(selfie.rad.top, selfie.rad.right),
    cylinderMap(selfie.rad.top, selfie.rad.left)
  ]);
  const radFactory = singleton(() => scaleFromHotspotToRad(selfie.rect));

  const selfie = {
    rect: {
      top, right, bottom, left
    },
    get rad() { return radFactory(); },
    get cylinderVector3Ds() { return cylinderVector3DsFactory(); }
  };

  return selfie;
}
