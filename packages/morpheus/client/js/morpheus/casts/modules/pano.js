import {
  PerspectiveCamera,
  FrontSide,
  BackSide,
  DoubleSide,
  BufferGeometry,
  Object3D,
  BufferAttribute,
  Uint16BufferAttribute,
  MeshBasicMaterial,
  Mesh,
  Scene,
  CanvasTexture,
  CylinderGeometry,
  CylinderBufferGeometry,
  RepeatWrapping,
} from 'three'
import Tween from '@tweenjs/tween.js'
import { get } from 'lodash'
import memoize from 'utils/memoize'
import { createSelector } from 'reselect'
import { positionCamera, disposeScene } from 'utils/three'
import renderEvents from 'utils/render'
import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene'
import { selectors as castSelectors } from 'morpheus/casts'
import {
  actions as gameActions,
  selectors as gameSelectors,
} from 'morpheus/game'
import {
  composeMouseTouch,
  touchDisablesMouse,
} from 'morpheus/hotspot/eventInterface'
import { isActive, selectors as gamestateSelectors } from 'morpheus/gamestate'
import createCanvas from 'utils/canvas'
import assetLoader from 'morpheus/render/pano/loader'
import loggerFactory from 'utils/logger'
import {
  momentum as momentumFactory,
  pano as inputHandlerFactory,
} from 'morpheus/hotspot'
import { DST_WIDTH, DST_HEIGHT, PANO_DRAW_NUDGE } from 'morpheus/constants'
import { forScene } from '../selectors'
import { forMorpheusType } from '../matchers'
// 0.00592592592
const sliceOffset = (600 / 3072) * Math.PI * 2
const twentyFourthRad = Math.PI / 12
const sliceWidth = sliceOffset
const sliceHeight = 0.56
const sliceDepth = 1.0
const X_ROTATION_OFFSET = 0 * (Math.PI / 180)
const logger = loggerFactory('casts:module:pano')

function cylindrical(theta) {
  return {
    x: Math.cos(theta),
    y: Math.sin(theta),
  }
}

function createGeometry() {
  const geometry = new CylinderBufferGeometry(
    1,
    1,
    sliceHeight * 2,
    24,
    1,
    true,
    -sliceOffset / 2,
    sliceOffset,
  )
  geometry.addAttribute(
    'uv',
    new BufferAttribute(
      new Float32Array(
        geometry.attributes.uv.array.map((u, i) => {
          return 1 - u
        }),
      ),
      2,
    ),
  )
  return geometry
}

function createObject3D({
  theta = Math.PI,
  geometry,
  material,
  startAngle = 0,
}) {
  const mesh = new Mesh(geometry, material)
  mesh.rotation.y = theta
  mesh.name = 'pano'
  return mesh
}

function createMaterial(map) {
  let material
  const promise = new Promise(resolve => {
    material = new MeshBasicMaterial({
      side: BackSide,
      map,
    })
    resolve()
  }).then(() => material)
  return {
    material,
    promise,
  }
}

const UP_DOWN_LIMIT = 5 * (Math.PI / 180)

function clamp({ x, y }) {
  if (x > UP_DOWN_LIMIT + X_ROTATION_OFFSET) {
    x = UP_DOWN_LIMIT + X_ROTATION_OFFSET
  } else if (x < -UP_DOWN_LIMIT + X_ROTATION_OFFSET) {
    x = -UP_DOWN_LIMIT + X_ROTATION_OFFSET
  }
  if (y > 2 * Math.PI) {
    y -= 2 * Math.PI
  } else if (y < 0) {
    y += 2 * Math.PI
  }
  return { x, y }
}

function createScene(...objects) {
  const scene = new Scene()
  objects.forEach(o => scene.add(o))
  return scene
}

function startRenderLoop({ scene3D, camera, renderer, update }) {
  window.camera = camera
  window.PerspectiveCamera = PerspectiveCamera
  const render = () => {
    update()
    renderer.render(scene3D, window.camera)
  }
  renderEvents.onRender(render)
  renderEvents.onDestroy(() => {
    renderer.dispose()
  })
}

const radToMorpheus = 3600 / (Math.PI * 2)
const radToMorpheusTexture = 3072 / (Math.PI * 2)

function morpheusRotationTransform(rot3, mRot) {
  mRot.y = rot3.y
  mRot.x = rot3.x
}

export const actions = scene => {
  let isSweeping = false
  global.rotate = function(y) {
    forScene(scene).cache().pano.object3D.rotation.y = y
  }
  function rotate({ x, y }) {
    return () => {
      const {
        hotspot: { scene3D },
        pano: { object3D, rotation, canvasTexture },
      } = forScene(scene).cache()
      const rot = clamp({
        x,
        y,
      })
      Object.assign(scene3D.rotation, rot)
      object3D.rotation.x = rot.x
      // Object.assign(object3D.rotation, rot);
      morpheusRotationTransform(rot, rotation)
      canvasTexture.needsUpdate = true
    }
  }

  function rotateBy({ x: deltaX, y: deltaY }) {
    return dispatch => {
      if (!isSweeping) {
        const cache = forScene(scene).cache()
        const object3D = cache.pano.object3D
        const { x: rotX, y: rotY } = cache.pano.rotation
        let x = rotX
        let y = rotY

        x += deltaX
        y += deltaY

        dispatch(rotate({ x, y }))
      }
    }
  }

  function sweepTo({ rectLeft, rectRight }) {
    return dispatch => {
      const left = rectLeft
      const right = rectRight > rectLeft ? rectRight : rectRight + 3600
      const cache = forScene(scene).cache()
      const angleAtEnd = left + (right - left) / 2 - 1500
      const startAngle = angleAtEnd / radToMorpheus
      const y = startAngle
      const x = 0
      const object3D = cache.pano.object3D
      if (object3D) {
        const v = cache.pano.rotation
        if (Math.abs(v.y - y) > Math.PI) {
          // Travelling more than half way around the axis, so instead let's go the other way
          if (v.y > y) {
            v.y -= 2 * Math.PI
          } else {
            v.y += 2 * Math.PI
          }
        }
        const distance = Math.sqrt((x - v.x) ** 2 + (y - v.y) ** 2)
        return new Promise(resolve => {
          if (distance === 0) {
            // What do you know... already there
            resolve()
          } else {
            isSweeping = true
            const tween = new Tween(v)
              .to(
                {
                  x,
                  y,
                },
                Math.sqrt(distance) * 1000,
              )
              .easing(Tween.Easing.Quadratic.Out)
            tween.onUpdate(() => {
              dispatch(rotate(v))
            })
            tween.onComplete(() => {
              isSweeping = false
              dispatch(sceneActions.setNextStartAngle(v.y))
              resolve()
            })
            tween.start()
          }
        })
      }
      console.error('object3D not defined')
      return Promise.resolve()
    }
  }

  return {
    rotate,
    rotateBy,
    sweepTo,
  }
}

export const delegate = memoize(scene => {
  function applies() {
    return scene.casts.find(forMorpheusType('PanoCast'))
  }

  function doLoad({ setState, isLoaded, isLoading }) {
    return (dispatch, getState) => {
      if (isLoaded) {
        logger.debug({
          sceneId: scene.sceneId,
          message: 'Already loaded so returning existing state',
        })
        return Promise.resolve({})
      }
      if (isLoading) {
        logger.debug({
          sceneId: scene.sceneId,
          message:
            'Already loading so waiting for load finish and returning existing state',
        })
        return isLoading
      }
      const panoCastData = scene.casts.filter(forMorpheusType('PanoCast'))
      if (panoCastData) {
        const nextStartAngle = sceneSelectors.nextSceneStartAngle(getState())
        const renderedCanvas = createCanvas({
          width: DST_WIDTH,
          height: DST_HEIGHT,
        })
        const map = new CanvasTexture(renderedCanvas)
        const loader = assetLoader({
          scene,
          canvasTexture: map,
          onVideoEndFactory(data) {
            return function onVideoEnded() {
              const el = this
              el.onended = null
              const { nextSceneId } = data
              const hasNextScene = nextSceneId && nextSceneId !== 0x3fffffff
              if (hasNextScene) {
                dispatch(sceneActions.goToScene(nextSceneId, false))
              }
            }
          },
        })
        const assets = loader.load(
          gamestateSelectors.forState(getState()),
          gameSelectors.htmlVolume(getState()),
        )

        const geometry = createGeometry()
        map.flipY = false
        const { material, promise: promiseMaterial } = createMaterial(map)
        const object3D = createObject3D({
          material,
          geometry,
          startAngle: nextStartAngle,
        })
        const scene3D = createScene(object3D)
        const promise = promiseMaterial
          .then(() => {
            logger.debug({
              sceneId: scene.sceneId,
              message: 'Finished loading material',
            })
          })
          .then(() => ({
            object3D,
            scene3D,
            assets,
            renderedCanvas,
            loader,
            canvasTexture: map,
            isLoaded: true,
            rotation: {
              x: 0,
              y: 0,
              get morpheusOffsetLeft() {
                // the left most of canvasTexture in Morpheus coordinates
                let morpheusOffsetLeft = this.y * radToMorpheus + 1800
                if (morpheusOffsetLeft < 0) {
                  morpheusOffsetLeft += 3600
                } else if (morpheusOffsetLeft > 3600) {
                  morpheusOffsetLeft -= 3600
                }
                return morpheusOffsetLeft
              },
              get morpheusOffsetX() {
                // rotation should be the middle of the texture
                let morpheusOffsetX = this.y * radToMorpheusTexture + 1536
                if (morpheusOffsetX < 0) {
                  morpheusOffsetX += 3072
                } else if (morpheusOffsetX > 3072) {
                  morpheusOffsetX -= 3072
                }
                return morpheusOffsetX
              },
              get morpheusX() {
                // offset when drawing to canvas texture
                let x = this.morpheusOffsetX - PANO_DRAW_NUDGE
                if (x < 0) {
                  x += 3072
                } else if (x > 3072) {
                  x -= 3072
                }
                return x
              },
            },
          }))
        setState({
          isLoading: promise,
        })
        return promise
      }
      return Promise.resolve()
    }
  }

  function doEnter({ webGlPool }) {
    return (dispatch, getState) => {
      const panoHandler = inputHandlerFactory({
        dispatch,
        scene,
      })

      const momentumHandler = momentumFactory({
        dispatch,
        scene,
      })
      logger.debug({
        sceneId: scene.sceneId,
        message: 'acquire webgl from pool',
        spareResourceCapacity: webGlPool.spareResourceCapacity,
        size: webGlPool.size,
      })
      return webGlPool.acquire().then(webgl => {
        logger.debug({
          sceneId: scene.sceneId,
          message: 'doEnter finished',
        })
        const { width, height } = gameSelectors.dimensions(getState())
        webgl.setSize({ width, height })
        return {
          webgl,
          // Hold on to panohandler separately because it needs to be turned off
          panoHandler,
          inputHandler: touchDisablesMouse(
            composeMouseTouch(panoHandler.handlers, momentumHandler),
          ),
        }
      })
    }
  }

  function onStage({
    rotation,
    scene3D,
    webgl,
    renderedCanvas,
    canvasTexture,
    loader,
    object3D,
  }) {
    return (dispatch, getState) => {
      const { camera, renderer, setSize } = webgl
      const nextStartAngle = sceneSelectors.nextSceneStartAngle(getState())
      rotation.y = nextStartAngle

      camera.position.z = -0.09

      loader.play()
      let textureVersion = canvasTexture.version
      canvasTexture.needsUpdate = true
      startRenderLoop({
        scene3D,
        camera,
        renderer,
        update: () => {
          loader
            .load(
              gamestateSelectors.forState(getState()),
              gameSelectors.htmlVolume(getState()),
            )
            .forEach(contextProvider => {
              if (canvasTexture.version !== textureVersion) {
                const ctx = renderedCanvas.getContext('2d')
                const { render } = contextProvider
                render(ctx, rotation)
              }
            })
          dispatch(gameActions.drawCursor())
          textureVersion = canvasTexture.version
        },
      })

      morpheusRotationTransform(
        {
          x: 0,
          y: rotation.y,
        },
        rotation,
      )

      return Promise.resolve({
        camera,
        renderer,
      })
    }
  }

  function doExit({ panoHandler }) {
    return () => {
      panoHandler.off()
      return Promise.resolve({
        panoHandler: null,
        inputHandler: null,
      })
    }
  }

  function doPreunload({ scene3D, canvasTexture, loader }) {
    return () => {
      disposeScene(scene3D)
      canvasTexture.dispose()
      loader.dispose()
      logger.debug({
        sceneId: scene.sceneId,
        message: 'Release webgl resources',
      })
      return Promise.resolve({
        canvasTexture: null,
        isLoaded: false,
        isLoading: null,
        loader: null,
      })
    }
  }

  function doUnload(state) {
    const { webGlPool, webgl, scene3D } = state
    return dispatch => {
      logger.debug({
        sceneId: scene.sceneId,
        message: 'Release webgl resources',
      })

      return webGlPool.release(webgl).then(() => {
        logger.debug({
          sceneId: scene.sceneId,
          message: 'doUnload finished',
          spareResourceCapacity: webGlPool.spareResourceCapacity,
          size: webGlPool.size,
        })
        disposeScene(scene3D)
        return dispatch(doPreunload(state)).then(clear => ({
          scene3D: null,
          object3D: null,
          webgl: null,
          ...clear,
        }))
      })
    }
  }

  return {
    applies,
    doLoad,
    doPreload: doLoad,
    doEnter,
    onStage,
    doExit,
    doUnload,
    doPreunload,
  }
})
