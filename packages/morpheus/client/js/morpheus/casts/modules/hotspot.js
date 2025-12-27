import {
  DoubleSide,
  BufferAttribute,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  MeshBasicMaterial,
  BufferGeometry,
  Mesh,
  Scene,
  Object3D,
} from 'three'
import { get } from 'lodash'
import memoize from 'utils/memoize'
import { createSelector } from 'reselect'
import { disposeScene, positionCamera } from 'utils/three'
import renderEvents from 'utils/render'
import { selectors as gameSelectors } from 'morpheus/game'
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
  isActive,
} from 'morpheus/gamestate'
import { selectors as sceneSelectors } from 'morpheus/scene'
import { selectors as castSelectors } from 'morpheus/casts'
import { GESTURES } from 'morpheus/constants'
import { isPano, isHotspot } from '../matchers'
const X_ROTATION_OFFSET = -0.038
const SCALE_FACTOR = 1
const HOTSPOT_X_OFFSET = Math.PI / 3
const HOTSPOT_X_COORD_FACTOR = Math.PI / -1800
const HOTSPOT_Y_COORD_FACTOR = 22e-4 * SCALE_FACTOR
const SIZE = 0.99 * SCALE_FACTOR
function cylinderMap(y, x) {
  return {
    x: SIZE * Math.sin(x - Math.PI / 2),
    y: -y,
    z: SIZE * Math.cos(x - Math.PI / 2),
  }
}

function createHotspotModel(hotspotsData) {
  return hotspotsData.map((hotspotData) => {
    let {
      rectTop: top,
      rectRight: right,
      rectBottom: bottom,
      rectLeft: left,
    } = hotspotData
    top *= HOTSPOT_Y_COORD_FACTOR
    bottom *= HOTSPOT_Y_COORD_FACTOR
    right = HOTSPOT_X_COORD_FACTOR * right + HOTSPOT_X_OFFSET
    left = HOTSPOT_X_COORD_FACTOR * left + HOTSPOT_X_OFFSET
    return {
      bottomLeft: cylinderMap(bottom, left),
      bottomRight: cylinderMap(bottom, right),
      topRight: cylinderMap(top, right),
      topLeft: cylinderMap(top, left),
    }
  })
}
function createHitGeometry(hotspotsData) {
  const geometry = new BufferGeometry()
  if (!hotspotsData.length) {
    return geometry
  }
  const hotspotModels = createHotspotModel(hotspotsData)
  const vertexCount = hotspotModels.length * 4
  const positionArray = new Float32Array(vertexCount * 3)
  const faces = []
  const writePosition = (vertexIndex, { x, y, z }) => {
    const offset = vertexIndex * 3
    positionArray[offset] = x
    positionArray[offset + 1] = y
    positionArray[offset + 2] = z
  }
  hotspotModels.forEach(
    ({ bottomLeft, bottomRight, topRight, topLeft }, index) => {
      const offset = index * 4
      writePosition(offset + 0, bottomLeft)
      writePosition(offset + 1, bottomRight)
      writePosition(offset + 2, topRight)
      writePosition(offset + 3, topLeft)
      faces.push([offset + 0, offset + 1, offset + 2])
      faces.push([offset + 0, offset + 2, offset + 3])
    }
  )
  geometry.setAttribute('position', new BufferAttribute(positionArray, 3))
  const faceCount = faces.length
  const indexArrayLength = faceCount * 3
  const uses32BitIndices = vertexCount > 65535
  const IndexArrayCtor = uses32BitIndices ? Uint32Array : Uint16Array
  const IndexAttributeCtor = uses32BitIndices
    ? Uint32BufferAttribute
    : Uint16BufferAttribute
  const indices = new IndexArrayCtor(indexArrayLength)
  faces.forEach(([a, b, c], faceIndex) => {
    const baseIndex = faceIndex * 3
    indices[baseIndex] = a
    indices[baseIndex + 1] = b
    indices[baseIndex + 2] = c
  })
  geometry.setIndex(new IndexAttributeCtor(indices, 1))
  return geometry
}
function createHotspotObjectPositions({
  bottomLeft,
  bottomRight,
  topRight,
  topLeft,
}) {
  const positions = new BufferAttribute(new Float32Array(12), 3)
  positions.setXYZ(0, bottomLeft.x, bottomLeft.y, bottomLeft.z)
  positions.setXYZ(1, bottomRight.x, bottomRight.y, bottomRight.z)
  positions.setXYZ(2, topRight.x, topRight.y, topRight.z)
  positions.setXYZ(3, topLeft.x, topLeft.y, topLeft.z)
  return positions
}
function createPositions(hotspotsData) {
  return createHotspotModel(hotspotsData).map(createHotspotObjectPositions)
}
function createUvs(count) {
  const uvList = []
  for (let i = 0; i < count; i += 1) {
    const uvs = new BufferAttribute(new Float32Array(8), 2)
    uvs.setXY(0, 0, 0)
    uvs.setXY(1, 1, 0)
    uvs.setXY(2, 1, 1)
    uvs.setXY(3, 0, 1)
    uvList.push(uvs)
  }
  return uvList
}
function createIndex(count) {
  const indicesList = []
  for (let i = 0; i < count; i += 1) {
    const indices = []
    indices.push(0, 1, 2, 0, 2, 3)
    indicesList.push(new Uint16BufferAttribute(indices, 1))
  }
  return indicesList
}
function createGeometry({ count, indexList, uvsList, positionsList }) {
  const visibleGeometryList = []
  for (let i = 0; i < count; i++) {
    const visibleGeometry = new BufferGeometry()
    visibleGeometry.setIndex(indexList[i])
    visibleGeometry.setAttribute('position', positionsList[i])
    visibleGeometry.setAttribute('uv', uvsList[i])
    visibleGeometryList.push(visibleGeometry)
  }
  return visibleGeometryList
}
function createMaterials(hotspotData) {
  const visibleMaterialList = []
  const hitMaterialList = []
  const hitColorList = []
  hotspotData.forEach((hotspot) => {
    let hitColor
    while (!hitColor || hitColorList.indexOf(hitColor) !== -1) {
      hitColor = Math.floor(Math.random() * 16777215)
    }
    hitColorList.push({
      color: hitColor,
      data: hotspot,
    })
    visibleMaterialList.push(
      new MeshBasicMaterial({
        transparent: true,
        opacity: 0.3,
        color: 65280,
        side: DoubleSide,
      })
    )
    hitMaterialList.push(
      new MeshBasicMaterial({
        color: hitColor,
        side: DoubleSide,
      })
    )
  })
  return {
    hitColorList,
    hitMaterialList,
    visibleMaterialList,
  }
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
    const mesh = new Mesh(geometry, material)
    mesh.rotation.y += theta
    return mesh
  }
  const visibleObject = new Object3D()
  const hitObject = new Object3D()
  for (let i = 0; i < count; i++) {
    visibleObject.add(
      createObject3D({
        geometry: geometryList[i],
        material: visibleMaterialList[i],
      })
    )
    hitObject.add(
      createObject3D({
        geometry: geometryList[i],
        material: hitMaterialList[i],
      })
    )
  }
  visibleObject.rotation.y += startAngle
  hitObject.rotation.y += startAngle
  return {
    visibleObject,
    hitObject,
  }
}
function setHotspotsTheta({ theta, oldTheta, hitObject3D, visibleObject3D }) {
  visibleObject3D.rotation.y = visibleObject3D.rotation.y + theta - oldTheta
  hitObject3D.rotation.y = hitObject3D.rotation.y + theta - oldTheta
  return theta
}
function createScene(...objects) {
  const scene = new Scene()
  objects.forEach((o) => scene.add(o))
  return scene
}
function startRenderLoop({ scene3D, camera, renderer }) {
  const render = () => {
    renderer.render(scene3D, camera)
  }
  renderEvents.onRender(render)
  renderEvents.onDestroy(() => renderer.dispose())
}
const selectors = memoize((scene) => {
  const selectSceneCache = castSelectors.forScene(scene).cache
  const selectHotspot = createSelector(selectSceneCache, (cache) =>
    get(cache, 'hotspot')
  )
  const selectHotspotsData = createSelector(
    () => scene,
    (s) => get(s, 'casts', []).filter((c) => c.castId === 0)
  )
  const selectHitColorList = createSelector(
    selectHotspot,
    (hotspot) => hotspot.hitColorList
  )
  const selectHotspotHitObject3D = createSelector(
    selectHotspot,
    (hotspot) => hotspot.hitObject3D
  )
  const selectHotspotVisibleObject3D = createSelector(
    selectHotspot,
    (hotspot) => hotspot.visibleObject3D
  )
  const selectWebgl = createSelector(selectHotspot, (hotspot) =>
    get(hotspot, 'webgl')
  )
  const selectCanvas = createSelector(selectWebgl, ({ canvas }) => canvas)
  const selectIsPano = createSelector(
    () => scene,
    (sceneData) => {
      const { casts } = sceneData
      return !!casts.find((c) => c.__t === 'PanoCast')
    }
  )
  const selectScene3D = createSelector(selectHotspot, (hotspot) =>
    get(hotspot, 'scene3D')
  )
  const selectCamera = createSelector(selectWebgl, ({ camera }) => camera)
  return {
    isPano: selectIsPano,
    scene3D: selectScene3D,
    visibleObject3D: selectHotspotVisibleObject3D,
    hitObject3D: selectHotspotHitObject3D,
    hitColorList: selectHitColorList,
    renderElements: selectWebgl,
    webgl: selectWebgl,
    hotspotsData: selectHotspotsData,
    canvas: selectCanvas,
    camera: selectCamera,
  }
})
const delegate = memoize((scene) => {
  function applies() {
    return scene.casts.find(isHotspot) && isPano(scene)
  }
  function doEnter({ webGlPool }) {
    return (dispatch, getState) => {
      const hotspotsData = scene.casts.filter(isHotspot)
      if (hotspotsData.length && isPano(scene)) {
        const gamestates = gamestateSelectors.forState(getState())
        hotspotsData
          .filter((h) => {
            const { gesture, rectBottom, rectTop, rectLeft, rectRight } = h
            return (
              GESTURES[gesture] === 'MouseClick' &&
              isActive({ cast: h, gamestates }) &&
              rectBottom === 0 &&
              rectTop === 0 &&
              rectLeft === 0 &&
              rectRight === 0
            )
          })
          .filter((cast) => isActive({ cast, gamestates }))
          .forEach((hotspot) => {
            dispatch(gamestateActions.handleHotspot({ hotspot }))
          })
        const positionsList = createPositions(hotspotsData)
        const uvsList = createUvs(hotspotsData.length)
        const indexList = createIndex(hotspotsData.length)
        const nextStartAngle = sceneSelectors.nextSceneStartAngle(getState())
        const geometryList = createGeometry({
          count: hotspotsData.length,
          indexList,
          uvsList,
          positionsList,
        })
        const { hitColorList, hitMaterialList, visibleMaterialList } =
          createMaterials(hotspotsData)
        const { visibleObject: visibleObject3D, hitObject: hitObject3D } =
          createObjects3D({
            count: hotspotsData.length,
            geometryList,
            visibleMaterialList,
            hitMaterialList,
            startAngle: nextStartAngle,
          })
        const hitGeometry = createHitGeometry(hotspotsData)
        const hitMesh = new Mesh(hitGeometry)
        const hitObject = new Object3D()
        hitObject.add(hitMesh)
        const scene3D = createScene(hitObject)
        scene3D.rotation.y = nextStartAngle
        return webGlPool.acquire().then((webgl) => {
          const { width, height } = gameSelectors.dimensions(getState())
          webgl.setSize({ width, height })
          return {
            webgl,
            scene3D,
            hitObject3D,
            visibleObject3D,
            hitColorList,
            hotspotsData,
          }
        })
      }
      return Promise.resolve({})
    }
  }
  function onStage({ hotspotsData, scene3D, webgl }) {
    return (dispatch, getState) => {
      if (isPano(scene)) {
        const { camera, renderer, setSize } = webgl
        positionCamera({
          camera,
          vector3: { z: -0.325, y: -0.01 },
        })
        camera.rotation.x = X_ROTATION_OFFSET
        startRenderLoop({
          scene3D,
          camera,
          renderer,
        })
        return Promise.resolve()
      }
      const gamestates = gamestateSelectors.forState(getState())
      hotspotsData
        .filter((cast) => isActive({ cast, gamestates }))
        .forEach((hotspot) => {
          const { gesture } = hotspot
          if (
            GESTURES[gesture] === 'Always' ||
            GESTURES[gesture] === 'SceneEnter'
          ) {
            dispatch(gamestateActions.handleHotspot({ hotspot }))
          }
        })
      return Promise.resolve()
    }
  }
  function doUnload({ webGlPool, scene3D, webgl }) {
    return () => {
      if (scene3D) {
        disposeScene(scene3D)
        return webGlPool.release(webgl).then(() => ({
          scene3D: null,
          visibleObject3D: null,
          hitObject3D: null,
          webgl: null,
          isLoaded: false,
          isLoading: null,
        }))
      }
      return Promise.resolve()
    }
  }
  return {
    applies,
    doEnter,
    onStage,
    doUnload,
  }
})
export { delegate, setHotspotsTheta }
