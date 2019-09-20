import {
  BufferGeometry,
  BufferAttribute,
  Uint16BufferAttribute,
  MeshBasicMaterial,
  TextureLoader,
  Mesh,
  DoubleSide,
} from 'three'
import { get } from 'lodash'
import memoize from 'utils/memoize'
import { createSelector } from 'reselect'
import { getAssetUrl } from 'service/gamedb'
import { selectors as gamestateSelectors } from 'morpheus/gamestate'
import { selectors as castSelectors } from 'morpheus/casts'
import { disposeObject, disposeScene } from 'utils/three'
import { isPano, forMorpheusType, and, or, not } from '../matchers'

const SCALE_FACTOR = 1.0
const HOTSPOT_X_OFFSET = Math.PI / 3
const HOTSPOT_X_COORD_FACTOR = Math.PI / -1800
const SIZE = 0.99 * SCALE_FACTOR
const HOTSPOT_Y_COORD_FACTOR = 0.0022 * SCALE_FACTOR
const SCALE_WIDTH_FACTOR = 1.2
const SCALE_HEIGHT_FACTOR = 0.95

function cylinderMap(y, x) {
  return {
    x: SIZE * Math.sin(x - Math.PI / 2),
    y: -y,
    z: SIZE * Math.cos(x - Math.PI / 2),
  }
}

function createControlledPositions(controlledCastsData) {
  const {
    controlledLocation: { x, y },
    width,
    height,
  } = controlledCastsData

  let top = y - 250
  let bottom = y + (height * SCALE_HEIGHT_FACTOR - 250)
  let left = x
  let right = x + width * SCALE_WIDTH_FACTOR

  top *= HOTSPOT_Y_COORD_FACTOR
  bottom *= HOTSPOT_Y_COORD_FACTOR
  right = HOTSPOT_X_COORD_FACTOR * right + HOTSPOT_X_OFFSET
  left = HOTSPOT_X_COORD_FACTOR * left + HOTSPOT_X_OFFSET

  const bottomLeft = cylinderMap(bottom, left)
  const bottomRight = cylinderMap(bottom, right)
  const topRight = cylinderMap(top, right)
  const topLeft = cylinderMap(top, left)

  const positions = new BufferAttribute(new Float32Array(12), 3)

  positions.setXYZ(0, bottomLeft.x, bottomLeft.y, bottomLeft.z)
  positions.setXYZ(1, bottomRight.x, bottomRight.y, bottomRight.z)
  positions.setXYZ(2, topRight.x, topRight.y, topRight.z)
  positions.setXYZ(3, topLeft.x, topLeft.y, topLeft.z)

  return positions
}

function createUvs({ cast, gamestates }) {
  const { controlledMovieCallbacks } = cast
  const gameStateId = get(controlledMovieCallbacks, '[0].gameState', null)
  const gs = gamestates.byId(gameStateId)
  const { maxValue } = gs
  const value = Math.round(gs.value, 0)
  const minX = value / (maxValue + 1)
  const maxX = (value + 1) / (maxValue + 1)

  const uvs = new BufferAttribute(new Float32Array(8), 2)

  uvs.setXY(0, minX, 0.0)
  uvs.setXY(1, maxX, 0.0)
  uvs.setXY(2, maxX, 1.0)
  uvs.setXY(3, minX, 1.0)

  return uvs
}

function createIndex() {
  return new Uint16BufferAttribute([0, 1, 2, 0, 2, 3], 1)
}

function createGeometry(positions, uvs, index) {
  const geometry = new BufferGeometry()
  geometry.setIndex(index)
  geometry.addAttribute('position', positions)
  geometry.addAttribute('uv', uvs)
  return geometry
}

function createMaterial(asset) {
  const loader = new TextureLoader()
  loader.crossOrigin = 'anonymous'
  let material
  return new Promise((resolve, reject) => {
    material = new MeshBasicMaterial({
      side: DoubleSide,
      map: loader.load(asset, resolve, undefined, reject),
    })
  }).then(() => material)
}

function createObject3D({ geometry, material }) {
  const mesh = new Mesh(geometry, material)
  return mesh
}

const selectors = memoize(scene => {
  const selectSceneCache = castSelectors.forScene(scene).cache
  const allCasts = () => get(scene, 'casts', [])
  const selectSelfInStore = createSelector(
    selectSceneCache,
    cache => get(cache, 'controlledMovie'),
  )
  const selectControlledCasts = createSelector(
    selectSelfInStore,
    controlledMovie => get(controlledMovie, 'controlledCasts', []),
  )
  const selectControlledCastsData = createSelector(
    allCasts,
    forMorpheusType('ControlledMovieCast'),
  )
  const selectIsPano = createSelector(
    () => scene,
    isPano,
  )
  const selectIsLoaded = createSelector(
    selectSelfInStore,
    controlledMovie => get(controlledMovie, 'isLoaded'),
  )
  const selectIsLoading = createSelector(
    selectSelfInStore,
    controlledMovie => get(controlledMovie, 'isLoading'),
  )
  return {
    self: selectSelfInStore,
    isLoaded: selectIsLoaded,
    isLoading: selectIsLoading,
    isPano: selectIsPano,
    controlledCasts: selectControlledCasts,
    controlledCastsData: selectControlledCastsData,
  }
})

export const delegate = memoize(scene => {
  function applies() {
    return (
      isPano(scene) && scene.casts.find(forMorpheusType('ControlledMovieCast'))
    )
  }

  function doLoad({ setState, isLoaded, isLoading }) {
    return () => {
      const controlledCastsData = scene.casts.filter(
        forMorpheusType('ControlledMovieCast'),
      )
      if (isLoaded) {
        return Promise.resolve({})
      }
      if (isLoading) {
        return isLoading
      }
      const promise = Promise.all(
        controlledCastsData.map(curr =>
          createMaterial(getAssetUrl(curr.fileName, 'png')).then(material => ({
            material,
            positions: createControlledPositions(curr),
            data: curr,
          })),
        ),
      ).then(controlledCasts => ({
        controlledCasts,
        isLoaded: true,
        isLoading: false,
      }))

      setState({
        isLoading: promise,
      })

      return promise
    }
  }

  function doEnter({
    controlledCasts,
    modules: {
      pano: { object3D: panoObject3D },
    },
  }) {
    return (dispatch, getState) =>
      Promise.all(
        controlledCasts.map(({ data, material, positions }) => {
          const uvs = createUvs({
            cast: data,
            gamestates: gamestateSelectors.forState(getState()),
          })
          const geometry = createGeometry(positions, uvs, createIndex())
          const object3D = createObject3D({ geometry, material })
          panoObject3D.add(object3D)
          return { data, material, positions, object3D }
        }),
      ).then(c => ({
        controlledCasts: c,
      }))
  }

  function doUnload({ controlledCasts }) {
    return () => {
      return Promise.resolve({
        isLoaded: false,
        isLoading: null,
        controlledCasts: [],
      })
    }
  }

  function update({ controlledCasts }) {
    return (dispatch, getState) => {
      const gamestates = gamestateSelectors.forState(getState())
      controlledCasts.forEach(({ object3D, data: cast }) => {
        const uv = createUvs({ cast, gamestates })
        object3D.geometry.attributes.uv = uv
      })
      return Promise.resolve()
    }
  }

  return {
    applies,
    doLoad,
    doPreload: doLoad,
    doPreunload: doUnload,
    doEnter,
    doUnload,
    update,
  }
})
