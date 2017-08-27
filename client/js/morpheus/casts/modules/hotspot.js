import THREE, {
  DoubleSide,
  BufferAttribute,
  Uint16BufferAttribute,
  MeshBasicMaterial,
  BufferGeometry,
  Geometry,
  Face3,
  Mesh,
  Scene,
  Raycaster,
  Vector3,
  Object3D,
} from 'three';
import {
  get,
  memoize,
} from 'lodash';
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
  actions as gamestateActions,
  selectors as gamestateSelectors,
  isActive,
} from 'morpheus/gamestate';
import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  ACTION_TYPES,
  GESTURES,
} from 'morpheus/constants';

export const selectors = memoize((scene) => {
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
    s => get(s, 'casts', [])
      .filter(c => c.castId === 0),
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

  const selectCamera = createSelector(
    selectHotspot,
    hotspot => hotspot.camera,
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
    camera: selectCamera,
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

function createHotspotModel(hotspotsData) {
  return hotspotsData.map((hotspotData) => {
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

    return {
      bottomLeft: cylinderMap(bottom, left),
      bottomRight: cylinderMap(bottom, right),
      topRight: cylinderMap(top, right),
      topLeft: cylinderMap(top, left),
    };
  });
}

function createHitGeometry(hotspotsData) {
  const geometry = new Geometry();
  createHotspotModel(hotspotsData)
    .forEach(({ bottomLeft, bottomRight, topRight, topLeft }, index) => {
      const offset = index * 4;
      geometry.vertices.push(new Vector3(bottomLeft.x, bottomLeft.y, bottomLeft.z));
      geometry.vertices.push(new Vector3(bottomRight.x, bottomRight.y, bottomRight.z));
      geometry.vertices.push(new Vector3(topRight.x, topRight.y, topRight.z));
      geometry.vertices.push(new Vector3(topLeft.x, topLeft.y, topLeft.z));
      geometry.faces.push(new Face3(offset + 0, offset + 1, offset + 2));
      geometry.faces.push(new Face3(offset + 0, offset + 2, offset + 3));
    });
  return geometry;
}

function createHotspotObjectPositions({ bottomLeft, bottomRight, topRight, topLeft }) {
  const positions = new BufferAttribute(
    new Float32Array(12), 3,
  );

  positions.setXYZ(0, bottomLeft.x, bottomLeft.y, bottomLeft.z);
  positions.setXYZ(1, bottomRight.x, bottomRight.y, bottomRight.z);
  positions.setXYZ(2, topRight.x, topRight.y, topRight.z);
  positions.setXYZ(3, topLeft.x, topLeft.y, topLeft.z);

  return positions;
}

function createPositions(hotspotsData) {
  return createHotspotModel(hotspotsData)
    .map(createHotspotObjectPositions);
}

function createUvs(count) {
  const uvList = [];

  for (let i = 0; i < count; i += 1) {
    const uvs = new BufferAttribute(new Float32Array(8), 2);

    uvs.setXY(0, 0.0, 0.0);
    uvs.setXY(1, 1.0, 0.0);
    uvs.setXY(2, 1.0, 1.0);
    uvs.setXY(3, 0.0, 1.0);

    uvList.push(uvs);
  }
  return uvList;
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
  indexList,
  uvsList,
  positionsList,
}) {
  const visibleGeometryList = [];

  for (let i = 0; i < count; i++) {
    const visibleGeometry = new BufferGeometry();

    visibleGeometry.setIndex(indexList[i]);
    visibleGeometry.addAttribute('position', positionsList[i]);
    visibleGeometry.addAttribute('uv', uvsList[i]);

    visibleGeometryList.push(visibleGeometry);
  }

  return visibleGeometryList;
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
  geometryList,
  visibleMaterialList,
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
      geometry: geometryList[i],
      material: visibleMaterialList[i],
    }));
    hitObject.add(createObject3D({
      geometry: geometryList[i],
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

export const delegate = memoize((scene) => {
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
        const positionsList = createPositions(hotspotsData);
        const { width, height } = gameSelectors.dimensions(getState());
        const uvsList = createUvs(hotspotsData.length);
        const indexList = createIndex(hotspotsData.length);
        const nextStartAngle = sceneSelectors.nextSceneStartAngle(getState());
        const geometryList = createGeometry({
          count: hotspotsData.length,
          indexList,
          uvsList,
          positionsList,
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
          geometryList,
          visibleMaterialList,
          hitMaterialList,
          startAngle: nextStartAngle,
        });
        const hitGeometry = createHitGeometry(hotspotsData);
        const hitMesh = new Mesh(hitGeometry);
        const hitObject = new Object3D();
        hitObject.add(hitMesh);
        const scene3D = createScene(hitObject);
        scene3D.rotation.y = nextStartAngle;
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
      const hotspotsData = hotspotSelectors.hotspotsData(getState());
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

      hotspotsData.forEach((hotspot) => {
        const { gesture, type, param1: gamestateId, param2: value } = hotspot;
        if (GESTURES[gesture] === 'Always') {
          dispatch(gamestateActions.handleHotspot({ hotspot }));
          // if (ACTION_TYPES[type] === 'SetStateTo') {
          //   dispatch(gamestateActions.updateGameState(gamestateId, value));
          // } else if (ACTION_TYPES[type] === 'IncrementState') {
          //   dispatch(gamestateActions.updateGameState(gamestateId, value));
          // }
        }
      });

      return Promise.resolve();
    };
  }

  return {
    applies,
    doEnter,
    onStage,
  };
});

export const actions = memoize((scene) => {
  function hovered(hoveredHotspots) {
    return (dispatch) => {
      hoveredHotspots.every((hotspot) => {
        // TODO: check if really currently enabled
        // See CHotspot::GetCursor
        if (hotspot.initiallyEnabled) {
          if (ACTION_TYPES[hotspot.type] === 'ChangeScene') {
            const { cursorShapeWhenActive: morpheusCursor } = hotspot;
            dispatch(gameActions.setCursor(morpheusCursor));
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
      const scene3D = selectors(scene).scene3D(getState());
      dispatch(sceneActions.setNextStartAngle(scene3D.rotation.y));
      activatedHotspots.every(hotspot =>
        // const gamestates = gamestateSelectors.gamestates(getState());
         dispatch(gamestateActions.handleHotspot({ hotspot })),
        // if (isActive({ cast: hotspot, gamestates })) {
        //   switch (ACTION_TYPES[hotspot.type]) {
        //     case 'ChangeScene':
        //     case 'DissolveTo':
        //     case 'GoBack':
        //     case 'ReturnFromHelp': {
        //       const scene3D = selectors(scene).scene3D(getState());
        //       dispatch(sceneActions.setNextStartAngle(scene3D.rotation.y));
        //       dispatch(sceneActions.goToScene(hotspot.param1));
        //       return false;
        //     }
        //     default:
        //       return true;
        //   }
        // }
        // return true;
      );
    };
  }

  return {
    hovered,
    activated,
  };
});
