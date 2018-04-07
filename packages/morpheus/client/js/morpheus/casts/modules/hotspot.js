import {
  DoubleSide,
  BufferAttribute,
  Uint16BufferAttribute,
  MeshBasicMaterial,
  BufferGeometry,
  Geometry,
  Face3,
  Mesh,
  Scene,
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
  actions as castActions,
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

const X_ROTATION_OFFSET = -0.038;
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
        // Handle "Always" hotspots now
        const gamestates = gamestateSelectors.forState(getState());
        hotspotsData
          .filter((h) => {
            const { gesture, rectBottom, rectTop, rectLeft, rectRight } = h;
            return GESTURES[gesture] === 'MouseClick'
              && isActive({ cast: h, gamestates })
              && rectBottom === 0
              && rectTop === 0
              && rectLeft === 0
              && rectRight === 0;
          })
          .filter(cast => isActive({ cast, gamestates }))
          .forEach((hotspot) => {
            dispatch(gamestateActions.handleHotspot({ hotspot }));
          });
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
          vector3: { z: -0.325, y: -0.01 },
        });
        camera.rotation.x = X_ROTATION_OFFSET;
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
      const gamestates = gamestateSelectors.forState(getState());
      hotspotsData
        .filter(cast => isActive({ cast, gamestates }))
        .forEach((hotspot) => {
          const { gesture } = hotspot;
          if (
            GESTURES[gesture] === 'Always'
            || GESTURES[gesture] === 'SceneEnter'
          ) {
            dispatch(gamestateActions.handleHotspot({ hotspot }));
          }
        });

      return Promise.resolve();
    };
  }

  function doUnload() {
    return (dispatch, getState) => {
      const scene3D = hotspotSelectors.scene3D(getState());
      const visibleObject3D = hotspotSelectors.visibleObject3D(getState());
      const hitObject3D = hotspotSelectors.hitObject3D(getState());
      const { camera, renderer } = hotspotSelectors.renderElements(getState());

      scene3D.children.forEach((child) => {
        scene3D.remove(child);
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          child.material.dispose();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.context = null;
      renderer.domElement = null;

      return Promise.resolve({
        scene3D: null,
        visibleObject3D: null,
        hitObject3D: null,
        camera: null,
        renderer: null,
      });
    };
  }

  return {
    applies,
    doEnter,
    onStage,
    doUnload,
  };
});

export const actions = memoize((scene) => {
  function hovered(hoveredHotspots) {
    return (dispatch, getState) => {
      let cursor;
      hoveredHotspots.some((hotspot) => {
        const gamestates = gamestateSelectors.forState(getState());
        if (isActive({ cast: hotspot, gamestates })) {
          const {
            defaultPass,
            cursorShapeWhenActive: morpheusCursor,
          } = hotspot;
          cursor = morpheusCursor;
          return defaultPass;
        }
        return true;
      });

      if (cursor) {
        dispatch(gameActions.setCursor(cursor));
      } else if (hoveredHotspots.length === 0) {
        dispatch(gameActions.setCursor(10000));
      }
    };
  }

  function activated(activatedHotspots) {
    return (dispatch, getState) => {
      const scene3D = selectors(scene).scene3D(getState());
      dispatch(sceneActions.setNextStartAngle(scene3D.rotation.y));
      activatedHotspots.some((hotspot) => {
        const gamestates = gamestateSelectors.forState(getState());
        if (isActive({ cast: hotspot, gamestates })) {
          if (ACTION_TYPES[hotspot.type] === 'ChangeScene') {
            dispatch(castActions.forScene(scene).pano.sweepTo(hotspot, () => {
              dispatch(sceneActions.goToScene(hotspot.param1, false));
            }));
            return true;
          }
          return dispatch(gamestateActions.handleHotspot({ hotspot }));
        }
        return true;
      });
    };
  }

  return {
    hovered,
    activated,
  };
});
