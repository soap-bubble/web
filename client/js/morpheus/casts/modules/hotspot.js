import THREE, {
  DoubleSide,
  BufferAttribute,
  Uint16BufferAttribute,
  MeshBasicMaterial,
  BufferGeometry,
  Mesh,
  Scene,
  WebGLRenderer,
  Object3D,
} from 'three';
import {
  get,
  memoize,
} from 'lodash';
import {
  defer,
} from 'utils/promise';
import { createSelector } from 'reselect';
import createCanvas from 'utils/canvas';
import {
  createCamera,
  positionCamera,
  createRenderer,
} from 'utils/three';
import renderEvents from 'utils/render';
import {
  actions as gameActions,
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as castSelectors,
} from 'morpheus/casts';

export const selectors = memoize(function selectors(scene) {
  const selectSceneCache = castSelectors.forScene(scene).cache;
  const selectHotspot = createSelector(
    selectSceneCache,
    cache => get(cache, 'hotspot'),
  );

  const selectCanvas = createSelector(
    selectHotspot,
    cache => get(cache, 'canvas'),
  );

  const selectHotspotsData = createSelector(
    () => scene,
    scene => get(scene, 'casts', []).filter(c => c.castId === 0),
  );
  const selectHitColorList = createSelector(
    selectHotspot,
    hotspot => hotspot.hitColorList,
  );

  const selectHotspotHitObject3D = createSelector(
    selectHotspot,
    hotspot => hotspot.hitObject3D,
  );

  const selectHotspotVisibleObject3D = createSelector(
    selectHotspot,
    hotspot => hotspot.visibleObject3D,
  );

  const selectRenderElements = createSelector(
    selectHotspot,
    hotspot => ({
      camera: get(hotspot, 'camera'),
      renderer: get(hotspot, 'renderer'),
    }),
  );

  const selectIsPano = createSelector(
    () => scene,
    (sceneData) => {
      const { casts } = sceneData;
      return !!(casts.find(c => c.__t === 'PanoCast'));
    },
  );

  const selectScene3D = createSelector(
    selectHotspot,
    hotspot => hotspot.scene3D,
  );

  return {
    isPano: selectIsPano,
    scene3D: selectScene3D,
    visibleObject3D: selectHotspotVisibleObject3D,
    hitObject3D: selectHotspotHitObject3D,
    hitColorList: selectHitColorList,
    renderElements: selectRenderElements,
    hotspotsData: selectHotspotsData,
    canvas: selectCanvas,
  };
});

const HOTSPOT_VERTEX_SIZE = 4;
const SCALE_FACTOR = 1.0;
const HOTSPOT_X_OFFSET = Math.PI / 3;
const HOTSPOT_X_COORD_FACTOR = Math.PI / -1800;
const HOTSPOT_Y_COORD_FACTOR = 0.0022 * SCALE_FACTOR;
const SIZE = 0.99 * SCALE_FACTOR;

function cylinderMap(y, x) {
  return {
    x: SIZE * Math.sin(x - (Math.PI / 2)),
    y: -y,
    z: SIZE * Math.cos(x - (Math.PI / 2)),
  };
}

function createPositions(hotspotsData) {
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
  }).forEach(([bottomLeft, bottomRight, topRight, topLeft]) => {
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
  return {
    visiblePositionsList,
    hitPositionsList,
  };
}

function createUvs(count) {
  const visibleUvsList = [];
  const hitUvsList = [];

  for (let i = 0; i < count; i += 1) {
    const visibleUvs = new BufferAttribute(new Float32Array(8), 2);
    const hitUvs = new BufferAttribute(new Float32Array(8), 2);

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
  return {
    visibleUvsList,
    hitUvsList,
  };
}

function createIndex(count) {
  const indicesList = [];
  for (let i = 0; i < count; i += 1) {
    const indices = [];
    indices.push(
      0, 1, 2,
      0, 2, 3,
    );
    indicesList.push(new Uint16BufferAttribute(indices, 1));
  }
  return indicesList;
}

function createGeometry({
  count,
  visibleIndexList,
  visibleUvsList,
  visiblePositionsList,
  hitIndexList,
  hitUvsList,
  hitPositionsList,
}) {
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

  return {
    visibleGeometryList,
    hitGeometryList,
  };
}

function createMaterials(hotspotData) {
  const visibleMaterialList = [];
  const hitMaterialList = [];
  const hitColorList = [];
  hotspotData.forEach((hotspot) => {
    // A random color for the hotspot
    let hitColor;
    // On the highly unlikely occurence of picking two 24-bit numbers in a hotspot set
    while (!hitColor || hitColorList.indexOf(hitColor) !== -1) {
      hitColor = Math.floor(Math.random() * 0xFFFFFF);
    }
    hitColorList.push({
      color: hitColor,
      data: hotspot,
    });
    visibleMaterialList.push(new MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0x00ff00,
      side: DoubleSide,
    }));
    hitMaterialList.push(new MeshBasicMaterial({
      color: hitColor,
      side: DoubleSide,
    }));
  });

  return {
    hitColorList,
    hitMaterialList,
    visibleMaterialList,
  };
}

function createObjects3D({
  count,
  theta = 0,
  visibleGeometryList,
  visibleMaterialList,
  hitGeometryList,
  hitMaterialList,
  startAngle = 0,
}) {
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

  visibleObject.rotation.y += startAngle;
  hitObject.rotation.y += startAngle;

  return {
    visibleObject,
    hitObject,
  };
}

export function setHotspotsTheta({
  theta,
  oldTheta,
  hitObject3D,
  visibleObject3D,
}) {
  visibleObject3D.rotation.y
    = (visibleObject3D.rotation.y + theta) - oldTheta;
  hitObject3D.rotation.y
    = (hitObject3D.rotation.y + theta) - oldTheta;

  return theta;
}

export function setHotspotsVisibility(visible) {
  // return (dispatch, getState) => {
  //   const { hotspot, pano } = getState();
  //   const { visible: currentVisible } = hotspot;
  //   if (visible === currentVisible) return;
  //
  //   const { scene3D } = pano;
  //   const { visibleObject3D } = hotspot;
  //
  //   if (visible === true) {
  //     scene3D.add(visibleObject3D);
  //   } else if (visible === false) {
  //     scene3D.remove(visibleObject3D);
  //   } else {
  //     return;
  //   }
  //
  //   dispatch({
  //     type: HOTSPOTS_SET_VISIBILITY,
  //     payload: visible,
  //   });
  // };
}

export function setHoverIndex(index) {
  // return (dispatch, getState) => {
  //   const { hotspot } = getState();
  //   const { hoverIndex, data } = hotspot;
  //   if (index !== null && hoverIndex !== index) {
  //     dispatch({
  //       type: HOTSPOTS_HOVER_INDEX,
  //       payload: index,
  //     });
  //     const { cursorShapeWhenActive: morpheusCursor } = data[index];
  //     dispatch(gameActions.setCursor(morpheusCursor));
  //   }
  // }
}

function createScene(...objects) {
  const scene = new Scene();
  objects.forEach(o => scene.add(o));
  return scene;
}

function startRenderLoop({ scene3D, camera, renderer }) {
  const render = () => {
    renderer.render(scene3D, camera);
  };
  renderEvents.onRender(render);
  renderEvents.onDestroy(() => renderer.dispose());
}

export function activateHotspotIndex(index) {
  // return (dispatch, getState) => {
  //   const { hotspot } = getState();
  //   const { data } = hotspot;
  //   if (data && data[index]) {
  //     // FIXME SCENE_END here
  //     dispatch({
  //       type: HOTSPOTS_ACTIVATED,
  //       payload: data[index],
  //     });
  //     const { param1: nextSceneId } = data[index];
  //     // dispatch(sceneActions.goToScene(nextSceneId));
  //   }
  // }
}

function createHotspotCanvas({ width, height }) {
  const canvas = createCanvas();
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export const delegate = memoize(function delegate(scene) {
  const hotspotSelectors = selectors(scene);

  function applies(state) {
    return hotspotSelectors.hotspotsData(state).length;
  }

  function doEnter() {
    return (dispatch, getState) => {
      const hotspotsData = hotspotSelectors.hotspotsData(getState());
      const isPano = hotspotSelectors.isPano(getState());
      if (hotspotsData.length && isPano) {
        // 3D hotspots
        const {
          visiblePositionsList,
          hitPositionsList,
        } = createPositions(hotspotsData);
        const { width, height } = gameSelectors.dimensions(getState());
        const {
          visibleUvsList,
          hitUvsList,
        } = createUvs(hotspotsData.length);
        const indexList = createIndex(hotspotsData.length);
        const nextStartAngle = sceneSelectors.nextSceneStartAngle(getState());
        const {
          visibleGeometryList,
          hitGeometryList,
        } = createGeometry({
          count: hotspotsData.length,
          visibleIndexList: indexList,
          visibleUvsList,
          visiblePositionsList,
          hitIndexList: indexList,
          hitUvsList,
          hitPositionsList,
        });
        const {
          hitColorList,
          hitMaterialList,
          visibleMaterialList,
        } = createMaterials(hotspotsData);

        const {
          visibleObject: visibleObject3D,
          hitObject: hitObject3D,
        } = createObjects3D({
          count: hotspotsData.length,
          visibleGeometryList,
          visibleMaterialList,
          hitGeometryList,
          hitMaterialList,
          startAngle: nextStartAngle,
        });
        const scene3D = createScene(hitObject3D);
        const canvas = createCanvas({ width, height });
        return Promise.resolve({
          canvas,
          scene3D,
          hitObject3D,
          visibleObject3D,
          hitColorList,
        });
      }
      return Promise.resolve();
    };
  }

  function onStage() {
    return (dispatch, getState) => {
      const { width, height } = gameSelectors.dimensions(getState());
      const isPano = hotspotSelectors.isPano(getState());
      if (isPano) {
        const scene3D = hotspotSelectors.scene3D(getState());
        const canvas = hotspotSelectors.canvas(getState());
        const camera = createCamera({ width, height });
        const renderer = createRenderer({ canvas, width, height });
        positionCamera({
          camera,
          vector3: { z: -0.325 },
        });
        startRenderLoop({
          scene3D,
          camera,
          renderer,
        });
        return Promise.resolve({
          camera,
          renderer,
        });
      }
      return Promise.resolve();
    };
  }

  return {
    applies,
    doEnter,
    onStage,
  };
});

const HOTSPOT_TYPE = {
  0: 'CHANGE_SCENE',
  1: 'DISSOLVE_TO',
  2: 'INCREMENT_STATE',
  3: 'DECREMENT_STATE',
  4: 'GO_BACK',
  5: 'ROTATE',
  6: 'HORIZONTAL_SLIDER',
  7: 'VERTICAL_SLIDER',
  8: 'TWO_AXIS_SLIDER',
  9: 'SET_STATE_TO',
  10: 'EXCHANGE_STATE',
  11: 'COPY_STATE',
  12: 'CHANGE_CURSOR',
  13: 'RETURN_FROM_HELP',
  14: 'NO_ACTION',
  99: 'DO_ACTION',
};

export const actions = memoize(function (scene) {
  function hovered(hoveredHotspots) {
    return (dispatch) => {
      hoveredHotspots.every(hotspot => {
        // TODO: check if really currently enabled
        // See CHotspot::GetCursor
        if (hotspot.initiallyEnabled) {
          if (HOTSPOT_TYPE[hotspot.type] === 'CHANGE_SCENE') {
            const { cursorShapeWhenActive: morpheusCursor } = hotspot;
            dispatch(gameActions.setCursor(morpheusCursor))
          }
        }
      });

      if (hoveredHotspots.length === 0) {
        dispatch(gameActions.setCursor(0));
      }
    };
  }

  function activated(activatedHotspots) {
    return (dispatch, getState) => {
      activatedHotspots.every(hotspot => {
        switch (HOTSPOT_TYPE[hotspot.type]) {
          case 'CHANGE_SCENE':
          case 'DISSOLVE_TO':
          case 'GO_BACK':
          case 'RETURN_FROM_HELP':
            const hitObject3D = selectors(scene).hitObject3D(getState());
            dispatch(sceneActions.setNextStartAngle(hitObject3D.rotation.y));
            dispatch(sceneActions.goToScene(hotspot.param1));
            return false;
          default:
            return true;
        }
      });
    };
  }

  return {
    hovered,
    activated,
  };
});
