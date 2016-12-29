import THREE, {
  BufferAttribute,
  Uint16Attribute,
  MeshBasicMaterial,
  BufferGeometry,
  Mesh,
  Scene,
  WebGLRenderer,
} from 'three';

import {
  createCameraForType,
  createRendererForType,
  positionCameraForType,
  addToRenderLoop,
} from './common/three';
import {
  HOTSPOTS_VISIBLE_POSITIONS_CREATE,
  HOTSPOTS_VISIBLE_UVS_CREATE,
  HOTSPOTS_VISIBLE_INDEX_CREATE,
  HOTSPOTS_VISIBLE_GEOMETRY_CREATE,
  HOTSPOTS_VISIBLE_MATERIAL_CREATE,
  HOTSPOTS_VISIBLE_OBJECT_CREATE,
  HOTSPOTS_HIT_POSITIONS_CREATE,
  HOTSPOTS_HIT_UVS_CREATE,
  HOTSPOTS_HIT_INDEX_CREATE,
  HOTSPOTS_HIT_GEOMETRY_CREATE,
  HOTSPOTS_HIT_MATERIAL_CREATE,
  HOTSPOTS_HIT_OBJECT_CREATE,
  HOTSPOTS_CANVAS_CREATED,
  HOTSPOTS_THETA,
  HOTSPOTS_SCENE_CREATE,
  HOTSPOTS_CAMERA_CREATE,
  HOTSPOTS_CAMERA_TRANSLATE,
  HOTSPOTS_RENDERER_CREATE,
  HOTSPOTS_RENDER_LOOP,
} from './types';

const HOTSPOT_VERTEX_SIZE = 4;
const SCALE_FACTOR = 1.0;
const HOTSPOT_X_OFFSET = Math.PI / 3;
const HOTSPOT_X_COORD_FACTOR = Math.PI / -1800;
const HOTSPOT_Y_COORD_FACTOR = 0.0022 * SCALE_FACTOR;
const SIZE = 0.99 * SCALE_FACTOR;

function cylinderMap(y, x) {
  return {
    x: SIZE * Math.sin(x),
    y: -y,
    z: SIZE * Math.cos(x),
  };
}

export function canvasCreated(canvas) {
  return {
    type: HOTSPOTS_CANVAS_CREATED,
    payload: canvas,
  };
}

export function createPositions(hotspotsData) {
  return (dispatch) => {
    const visiblePositions = new BufferAttribute(
      new Float32Array(hotspotsData.length * 12), 3,
    );
    const hitPositions = new BufferAttribute(
      new Float32Array(hotspotsData.length * 12), 3,
    );

    hotspotsData.map((hotspotData) => {
      let {
        rectTop: top,
        rectRight: right,
        rectBottom: bottom,
        rectLeft: left,
      } = hotspotData;

      top *= HOTSPOT_Y_COORD_FACTOR;
      bottom *= HOTSPOT_Y_COORD_FACTOR;
      right = (HOTSPOT_X_COORD_FACTOR * right) + HOTSPOT_X_OFFSET;
      left = (HOTSPOT_X_COORD_FACTOR * left) + HOTSPOT_X_OFFSET;

      return [
        cylinderMap(bottom, left),
        cylinderMap(bottom, right),
        cylinderMap(top, right),
        cylinderMap(top, left),
      ];
    }).forEach(([bottomLeft, bottomRight, topRight, topLeft], index) => {
      const offset = index * HOTSPOT_VERTEX_SIZE;

      visiblePositions.setXYZ(offset, bottomLeft.x, bottomLeft.y, bottomLeft.z);
      visiblePositions.setXYZ(offset + 1, bottomRight.x, bottomRight.y, bottomRight.z);
      visiblePositions.setXYZ(offset + 2, topRight.x, topRight.y, topRight.z);
      visiblePositions.setXYZ(offset + 3, topLeft.x, topLeft.y, topLeft.z);

      hitPositions.setXYZ(offset, bottomLeft.x, bottomLeft.y, bottomLeft.z);
      hitPositions.setXYZ(offset + 1, bottomRight.x, bottomRight.y, bottomRight.z);
      hitPositions.setXYZ(offset + 2, topRight.x, topRight.y, topRight.z);
      hitPositions.setXYZ(offset + 3, topLeft.x, topLeft.y, topLeft.z);
    });
    dispatch({
      type: HOTSPOTS_VISIBLE_POSITIONS_CREATE,
      payload: visiblePositions,
    });
    dispatch({
      type: HOTSPOTS_HIT_POSITIONS_CREATE,
      payload: hitPositions,
    });
  };
}

export function createUvs(count) {
  return (dispatch) => {
    const visibleUvs = new BufferAttribute(new Float32Array(count * 8), 2);
    const hitUvs = new BufferAttribute(new Float32Array(count * 8), 2);
    for (let i = 0; i < count; i += 1) {
      const offset = i * HOTSPOT_VERTEX_SIZE;
      visibleUvs.setXY(offset, 0.0, 0.0);
      visibleUvs.setXY(offset + 1, 1.0, 0.0);
      visibleUvs.setXY(offset + 2, 1.0, 1.0);
      visibleUvs.setXY(offset + 3, 0.0, 1.0);

      hitUvs.setXY(offset, 0.0, 0.0);
      hitUvs.setXY(offset + 1, 1.0, 0.0);
      hitUvs.setXY(offset + 2, 1.0, 1.0);
      hitUvs.setXY(offset + 3, 0.0, 1.0);
    }
    dispatch({
      type: HOTSPOTS_VISIBLE_UVS_CREATE,
      payload: visibleUvs,
    });
    dispatch({
      type: HOTSPOTS_HIT_UVS_CREATE,
      payload: hitUvs,
    });
  };
}

export function createIndex(count) {
  return (dispatch) => {
    const indices = [];
    for (let i = 0; i < count; i += 1) {
      const offset = i * HOTSPOT_VERTEX_SIZE;
      indices.push(
        offset, offset + 1, offset + 2,
        offset, offset + 2, offset + 3,
      );
    }
    dispatch({
      type: HOTSPOTS_VISIBLE_INDEX_CREATE,
      payload: new Uint16Attribute(indices, 1),
    });
    dispatch({
      type: HOTSPOTS_HIT_INDEX_CREATE,
      payload: new Uint16Attribute([].concat(indices), 1),
    });
  };
}

export function createGeometry({
  visibleIndex,
  visibleUvs,
  visiblePositions,
  hitIndex,
  hitUvs,
  hitPositions,
}) {
  return (dispatch) => {
    const visibleGeometry = new BufferGeometry();
    const hitGeometry = new BufferGeometry();

    visibleGeometry.setIndex(visibleIndex);
    visibleGeometry.addAttribute('position', visiblePositions);
    visibleGeometry.addAttribute('uv', visibleUvs);

    hitGeometry.setIndex(hitIndex);
    hitGeometry.addAttribute('position', hitPositions);
    hitGeometry.addAttribute('uv', hitUvs);

    dispatch({
      type: HOTSPOTS_VISIBLE_GEOMETRY_CREATE,
      payload: visibleGeometry,
    });
    dispatch({
      type: HOTSPOTS_HIT_GEOMETRY_CREATE,
      payload: hitGeometry,
    });
  }
}

export function createMaterials() {
  return (dispatch) => {
    dispatch({
      type: HOTSPOTS_HIT_MATERIAL_CREATE,
      payload: new MeshBasicMaterial({
        color: 0x0000ff,
        side: THREE.DoubleSide,
      }),
    });
    dispatch({
      type: HOTSPOTS_VISIBLE_MATERIAL_CREATE,
      payload: new MeshBasicMaterial({
        transparent: true,
        opacity: 0.3,
        color: 0x00ff00,
        side: THREE.DoubleSide,
      }),
    });
  };
}

export function createObjects3D() {
  return (dispatch, getState) => {
    const {
      theta,
      visibleGeometry,
      visibleMaterial,
      hitGeometry,
      hitMaterial,
    } = getState().hotspots;

    function createObject3D({ type, geometry, material }) {
      const mesh = new Mesh(geometry, material);
      mesh.rotation.y += theta;
      return {
        type,
        payload: mesh,
      };
    }

    dispatch(createObject3D({
      type: HOTSPOTS_VISIBLE_OBJECT_CREATE,
      geometry: getState().hotspots.visibleGeometry,
      material: getState().hotspots.visibleMaterial,
    }));
    dispatch(createObject3D({
      type: HOTSPOTS_HIT_OBJECT_CREATE,
      geometry: getState().hotspots.hitGeometry,
      material: getState().hotspots.hitMaterial,
    }));
  };
}

export function setHotspotsTheta(theta) {
  return (dispatch, getState) => {
    const {
      visibleObject3D,
      hitObject3D,
      theta: oldTheta,
    } = getState().hotspots;

    visibleObject3D.rotation.y
      = visibleObject3D.rotation.y + theta - oldTheta;
    hitObject3D.rotation.y
      = hitObject3D.rotation.y + theta - oldTheta;

    dispatch({
      type: HOTSPOTS_THETA,
      payload: theta,
    });
  };
}

export function createHotspots() {
  return (dispatch, getState) => {
    const { casts } = getState().scene.data;
    const hotspotsData = casts.filter(c => c.castId === 0);

    dispatch(createPositions(hotspotsData));
    dispatch(createUvs(hotspotsData.length));
    dispatch(createIndex(hotspotsData.length));
    dispatch(createGeometry(getState().hotspots));
    dispatch(createMaterials());
    dispatch(createObjects3D());
    dispatch(buildScene());
    dispatch(buildRig());
  }
}

export function buildScene() {
  return (dispatch, getState) => {
    const objects = [];
    objects.push(getState().hotspots.hitObject3D);
    dispatch(createScene(objects));
  }
}

export function buildRig() {
  return (dispatch, getState) => {
    const { width, height } = getState().dimensions;
    const { canvas } = getState().hotspots;
    dispatch(createCamera({ width, height }));
    dispatch(createRenderer({ canvas, width, height }));
  };
}

export function createScene(objects) {
  const scene = new Scene();
  objects.forEach(o => scene.add(o));
  return {
    type: HOTSPOTS_SCENE_CREATE,
    payload: scene,
  };
}

export function createCamera({ width, height }) {
  return createCameraForType({
    type: HOTSPOTS_CAMERA_CREATE,
    width,
    height,
  });
}

export function positionCamera(vector3) {
  return (dispatch, getState) => {
    const { camera } = getState().hotspots;
    dispatch(positionCameraForType({
      type: HOTSPOTS_CAMERA_TRANSLATE,
      vector3,
      camera,
    }));
  }

}

export function createRenderer({ canvas, width, height }) {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  return {
    type: HOTSPOTS_RENDERER_CREATE,
    payload: renderer,
  };
}

export function startRenderLoop() {
  return (dispatch, getState) => {
    const { hotspots } = getState();
    const { scene3D, camera, renderer, canvas } = hotspots;
    dispatch({
      type: HOTSPOTS_RENDER_LOOP,
      payload: addToRenderLoop(() => {
        renderer.render(scene3D, camera);
        // const pixel = new Uint8Array(4);
        // const gl = canvas.getContext('webgl');
        // gl.readPixels(500, 300, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        // console.log(pixel);
      }),
    });
  };
}
