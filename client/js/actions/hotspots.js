import THREE, {
  BufferAttribute,
  Uint16Attribute,
  MeshBasicMaterial,
  BufferGeometry,
  Mesh,
  Scene,
  WebGLRenderer,
  Object3D,
} from 'three';

import {
  goToScene,
} from './scene';
import {
  createCameraForType,
  createRendererForType,
  positionCameraForType,
} from './common/three';
import renderEvents from '../utils/render';
import {
  HOTSPOTS_LOADED,
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
  HOTSPOTS_SET_VISIBILITY,
  HOTSPOTS_SET_HIT_COLORS,
  HOTSPOTS_HOVER_INDEX,
  HOTSPOTS_SCENE_CREATE,
  HOTSPOTS_CAMERA_CREATE,
  HOTSPOTS_CAMERA_TRANSLATE,
  HOTSPOTS_RENDERER_CREATE,
  HOTSPOTS_RENDER_LOOP,
  HOTSPOTS_ACTIVATED,
  SCENE_END,
} from './types';

const HOTSPOT_VERTEX_SIZE = 4;
const SCALE_FACTOR = 1.0;
const HOTSPOT_X_OFFSET = Math.PI / 3;
const HOTSPOT_X_COORD_FACTOR = Math.PI / -1800;
const HOTSPOT_Y_COORD_FACTOR = 0.0022 * SCALE_FACTOR;
const SIZE = 0.99 * SCALE_FACTOR;

function cylinderMap(y, x) {
  return {
    x: SIZE * Math.sin(x - Math.PI / 2),
    y: -y,
    z: SIZE * Math.cos(x - Math.PI / 2),
  };
}

export function hotspotsLoaded(data) {
  return {
    type: HOTSPOTS_LOADED,
    payload: data,
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
    const visiblePositionsList = [];
    const hitPositionsList = [];

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

      const visiblePositions = new BufferAttribute(
        new Float32Array(12), 3,
      );

      const hitPositions = new BufferAttribute(
        new Float32Array(12), 3,
      );

      visiblePositions.setXYZ(0, bottomLeft.x, bottomLeft.y, bottomLeft.z);
      visiblePositions.setXYZ(1, bottomRight.x, bottomRight.y, bottomRight.z);
      visiblePositions.setXYZ(2, topRight.x, topRight.y, topRight.z);
      visiblePositions.setXYZ(3, topLeft.x, topLeft.y, topLeft.z);

      hitPositions.setXYZ(0, bottomLeft.x, bottomLeft.y, bottomLeft.z);
      hitPositions.setXYZ(1, bottomRight.x, bottomRight.y, bottomRight.z);
      hitPositions.setXYZ(2, topRight.x, topRight.y, topRight.z);
      hitPositions.setXYZ(3, topLeft.x, topLeft.y, topLeft.z);

      visiblePositionsList.push(visiblePositions);
      hitPositionsList.push(hitPositions);
    });
    dispatch({
      type: HOTSPOTS_VISIBLE_POSITIONS_CREATE,
      payload: visiblePositionsList,
    });
    dispatch({
      type: HOTSPOTS_HIT_POSITIONS_CREATE,
      payload: hitPositionsList,
    });
  };
}

export function createUvs(count) {
  return (dispatch) => {
    const visibleUvsList = [];
    const hitUvsList = [];

    for (let i = 0; i < count; i += 1) {
      const visibleUvs = new BufferAttribute(new Float32Array(8), 2);
      const hitUvs = new BufferAttribute(new Float32Array(8), 2);

      const offset = i * HOTSPOT_VERTEX_SIZE;
      visibleUvs.setXY(0, 0.0, 0.0);
      visibleUvs.setXY(1, 1.0, 0.0);
      visibleUvs.setXY(2, 1.0, 1.0);
      visibleUvs.setXY(3, 0.0, 1.0);

      hitUvs.setXY(0, 0.0, 0.0);
      hitUvs.setXY(1, 1.0, 0.0);
      hitUvs.setXY(2, 1.0, 1.0);
      hitUvs.setXY(3, 0.0, 1.0);

      visibleUvsList.push(visibleUvs);
      hitUvsList.push(hitUvs);
    }
    dispatch({
      type: HOTSPOTS_VISIBLE_UVS_CREATE,
      payload: visibleUvsList,
    });
    dispatch({
      type: HOTSPOTS_HIT_UVS_CREATE,
      payload: hitUvsList,
    });
  };
}

export function createIndex(count) {
  return (dispatch) => {
    const indicesList = [];
    for (let i = 0; i < count; i += 1) {
      const indices = [];
      indices.push(
        0, 1, 2,
        0, 2, 3,
      );
      indicesList.push(new Uint16Attribute(indices, 1));
    }
    dispatch({
      type: HOTSPOTS_VISIBLE_INDEX_CREATE,
      payload: indicesList,
    });
    dispatch({
      type: HOTSPOTS_HIT_INDEX_CREATE,
      payload: indicesList,
    });
  };
}

export function createGeometry({
  count,
  visibleIndexList,
  visibleUvsList,
  visiblePositionsList,
  hitIndexList,
  hitUvsList,
  hitPositionsList,
}) {
  return (dispatch) => {
    const visibleGeometryList = [];
    const hitGeometryList = [];

    for (let i = 0; i < count; i++) {
      const visibleGeometry = new BufferGeometry();
      const hitGeometry = new BufferGeometry();

      visibleGeometry.setIndex(visibleIndexList[i]);
      visibleGeometry.addAttribute('position', visiblePositionsList[i]);
      visibleGeometry.addAttribute('uv', visibleUvsList[i]);

      hitGeometry.setIndex(hitIndexList[i]);
      hitGeometry.addAttribute('position', hitPositionsList[i]);
      hitGeometry.addAttribute('uv', hitUvsList[i]);

      visibleGeometryList.push(visibleGeometry);
      hitGeometryList.push(hitGeometry);
    }

    dispatch({
      type: HOTSPOTS_VISIBLE_GEOMETRY_CREATE,
      payload: visibleGeometryList,
    });
    dispatch({
      type: HOTSPOTS_HIT_GEOMETRY_CREATE,
      payload: hitGeometryList,
    });
  }
}

export function createMaterials(count) {
  return (dispatch) => {
    const visibleMaterialList = [];
    const hitMaterialList = [];
    const hitColorList = [];
    for (let i = 0; i < count; i++) {
      // A random color for the hotspot
      let hitColor;
      // On the highly unlikely occurence of picking two 24-bit numbers in a hotspot set
      while(!hitColor || hitColorList.indexOf(hitColor) !== -1) {
        hitColor = Math.floor(Math.random() * 0xFFFFFF);
      }
      hitColorList.push(hitColor);
      visibleMaterialList.push(new MeshBasicMaterial({
        transparent: true,
        opacity: 0.3,
        color: 0x00ff00,
        side: THREE.DoubleSide,
      }));
      hitMaterialList.push(new MeshBasicMaterial({
        color: hitColor,
        side: THREE.DoubleSide,
      }))
    }

    dispatch({
      type: HOTSPOTS_SET_HIT_COLORS,
      payload: hitColorList,
    });
    dispatch({
      type: HOTSPOTS_HIT_MATERIAL_CREATE,
      payload: hitMaterialList,
    });
    dispatch({
      type: HOTSPOTS_VISIBLE_MATERIAL_CREATE,
      payload: visibleMaterialList,
    });
  };
}

export function createObjects3D(count) {
  return (dispatch, getState) => {
    const {
      theta,
      visibleGeometryList,
      visibleMaterialList,
      hitGeometryList,
      hitMaterialList,
    } = getState().hotspots;

    function createObject3D({ geometry, material }) {
      const mesh = new Mesh(geometry, material);
      mesh.rotation.y += theta;
      return mesh;
    }

    const visibleObject = new Object3D();
    const hitObject = new Object3D();

    for (let i = 0; i < count; i++) {
      visibleObject.add(createObject3D({
        geometry: visibleGeometryList[i],
        material: visibleMaterialList[i],
      }));
      hitObject.add(createObject3D({
        geometry: hitGeometryList[i],
        material: hitMaterialList[i],
      }));
    }

    dispatch({
      type: HOTSPOTS_VISIBLE_OBJECT_CREATE,
      payload: visibleObject,
    });
    dispatch({
      type: HOTSPOTS_HIT_OBJECT_CREATE,
      payload: hitObject,
    });
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

export function setHotspotsVisibility(visible) {
  return (dispatch, getState) => {
    const { hotspots, pano } = getState();
    const { visible: currentVisible } = hotspots;
    if (visible === currentVisible) return;

    const { scene3D } = pano;
    const { visibleObject3D } = hotspots;

    if (visible === true) {
      scene3D.add(visibleObject3D);
    } else if (visible === false){
      scene3D.remove(visibleObject3D);
    } else {
      return;
    }

    dispatch({
      type: HOTSPOTS_SET_VISIBILITY,
      payload: visible,
    });
  };
}

export function setHoverIndex(index) {
  return (dispatch, getState) => {
    const { hotspots } = getState();
    const { hoverIndex } = hotspots;
    if (hoverIndex !== index) {
      dispatch({
        type: HOTSPOTS_HOVER_INDEX,
        payload: index,
      });
    }
  }
}

export function createHotspots() {
  return (dispatch, getState) => {
    const { casts } = getState().scene.data;
    const hotspotsData = casts.filter(c => c.castId === 0);

    dispatch(createPositions(hotspotsData));
    dispatch(createUvs(hotspotsData.length));
    dispatch(createIndex(hotspotsData.length));
    dispatch(createGeometry({
      count: hotspotsData.length,
      ...getState().hotspots,
    }));
    dispatch(createMaterials(hotspotsData.length));
    dispatch(createObjects3D(hotspotsData.length));
    dispatch(buildScene());
    dispatch(buildRig());
  }
}

export function buildScene() {
  return (dispatch, getState) => {
    dispatch(createScene([ getState().hotspots.hitObject3D ]));
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
    const render = () => renderer.render(scene3D, camera);
    renderEvents.on('render', render);
    dispatch({
      type: HOTSPOTS_RENDER_LOOP,
      payload: () => renderEvents.off('render', render),
    });
  };
}

export function activateHotspotIndex(index) {
  return (dispatch, getState) => {
    const { hotspots } = getState();
    const { data } = hotspots;
    if (data && data[index]) {
      dispatch({
        type: SCENE_END,
      });
      dispatch({
        type: HOTSPOTS_ACTIVATED,
        payload: data[index],
      });
      const { param1: nextSceneId } = data[index];
      dispatch(goToScene(nextSceneId));
    }
  }
}
