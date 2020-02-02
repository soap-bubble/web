import { useState, useEffect, useMemo, useCallback } from 'react'
import { Raycaster, Object3D, Camera, Vector2 } from 'three'
import { PointerEvent } from 'react-three-fiber'
import useRaf from '@rooks/use-raf'
import { difference, sortBy, uniq, get } from 'lodash'
import {
  selectors as castSelectors,
  actions as castActions,
} from 'morpheus/casts'
import { selectors as sceneSelectors } from 'morpheus/scene'
import { selectors as gameSelectors } from 'morpheus/game'
import Queue from 'promise-queue'
import { actions as inputActions, handleEventFactory } from 'morpheus/input'
import { hotspotRectMatchesPosition } from '../../hotspot/matchers'
import createOrientation from 'morpheus/input/orientation'
import { actions as gamestateActions } from 'morpheus/gamestate'
import storeFactory from 'store'
import { isHotspot } from 'morpheus/casts/matchers'
import {
  PANO_CANVAS_WIDTH,
  PANO_CHUNK,
  PANO_UV_NUDGE,
  DST_RATIO,
  PANO_OFFSET,
} from 'morpheus/constants'
import { screenToGame } from 'utils/coordinates'
import { ThunkDispatch } from 'redux-thunk'
import { Scene, Hotspot } from '../types'
import { isPano } from '../matchers'
import { Action } from 'redux'

const actionQueue = new Queue(1, 128)

type Position = {
  top: number
  left: number
}

interface ClientInputState {
  clientX: number
  clientY: number
}

const raycaster = new Raycaster()

export default function(
  dispatch: ThunkDispatch<any, any, Action>,
  panoObject: Object3D | undefined,
  camera: Camera,
  scene: Scene | undefined,
  screenTop: number,
  screenLeft: number,
  screenWidth: number,
  screenHeight: number,
  offsetX: number,
  rotX: number
) {
  // const store = useMemo(() => storeFactory(), [])
  // const handleEvent = useMemo(() => handleEventFactory(), [])
  // const [hotspots, castActionsForScene]: [Hotspot[], any] = useMemo(() => [scene.casts.filter(isHotspot) as any, castActions.forScene(scene)], [scene])

  // const [startingPanoPosition, setStartingPanoPosition] = useState<Position>()
  // const [startingScreenPosition, setStartingScreenPosition] = useState<Position>()
  // const [wasInHotspots, setWasInHotspots] = useState<Hotspot[]>([])
  // const [lastMouseDown, setLastMouseDown] = useState<number>()
  // const [mouseCurrentlyDown, setMouseCurrentlyDown] = useState<boolean>(false)
  const [wasMouseDowned, setWasMouseDowned] = useState<boolean>(false)
  const [wasMouseMoved, setWasMouseMoved] = useState<boolean>(false)
  const [wasMouseUpped, setWasMouseUpped] = useState<boolean>(false)

  const [lastUpdate, setLastUpdatePosition] = useState<ClientInputState>({
    clientY: screenTop,
    clientX: screenLeft,
  })

  const { top, left } = useMemo(
    () =>
      screenToGame({
        top: lastUpdate.clientY - screenTop,
        left: lastUpdate.clientX - screenLeft,
        height: screenHeight,
        width: screenWidth,
      }),
    [lastUpdate, screenTop, screenLeft, screenWidth, screenHeight]
  )

  const isPanoScene = useMemo(() => {
    return scene && isPano(scene)
  }, [scene])

  const currentPanoPosition = useMemo(() => {
    if (lastUpdate && isPanoScene) {
      const { clientX, clientY } = lastUpdate
      const currentScreenPosition = {
        top: clientY - screenTop,
        left: clientX - screenLeft,
      }
      if (!document.hidden && currentScreenPosition && panoObject) {
        // Convert mouse coordinates to x, y clamped between -1 and 1.  Also invert y
        const y =
          ((screenHeight - currentScreenPosition.top) / screenHeight) * 2 - 1
        const x =
          ((currentScreenPosition.left - screenWidth) / screenWidth) * 2 + 1

        raycaster.setFromCamera({ x, y }, camera)
        const panoIntersects = raycaster.intersectObject(panoObject)
        const panoIntersect = panoIntersects.find(intersect => {
          if (intersect && intersect.uv) {
            return true
          }
          return false
        })
        if (panoIntersect) {
          const { uv } = panoIntersect
          if (uv) {
            const top = uv.y * -512 + 512

            // This is the inverse of the panoChunk shader math
            let left =
              ((8 / 7) * (1.0 - uv.x - offsetX / 1024) + rotX - PANO_OFFSET) *
              DST_RATIO
            if (left < 0) {
              left += 3600
            } else if (left > 3600) {
              left -= 3600
            }
            return { top, left }
          }
        }
      }
    }
  }, [lastUpdate, isPanoScene, camera, panoObject])

  // function updateGame({ clientX, clientY }: { clientX: number; clientY: number}, isTouch?: boolean, isTouchEnd?: boolean) {
  //   const location = gameSelectors.location(store.getState())
  //   const currentScreenPosition = isTouchEnd
  //     ? lastTouchPosition
  //     : {
  //         top: clientY - location.y,
  //         left: clientX - location.x,
  //       }

  //   const state = store.getState()
  //   const currentScene = sceneSelectors.currentSceneData(state)
  //   if (currentScene === scene && !document.hidden && currentScreenPosition) {
  //     // Convert mouse coordinates to x, y clamped between -1 and 1.  Also invert y
  //     const y =
  //       ((screenHeight - currentScreenPosition.top) / screenHeight) * 2 - 1
  //     const x =
  //       ((currentScreenPosition.left - screenWidth) / screenWidth) * 2 + 1
  //     // Create a ray that travels from camera through screen at mouse location
  //     raycaster.setFromCamera({ x, y }, camera)
  //     const panoIntersects = raycaster.intersectObject(panoObject)
  //     const currentPanoPosition: Position = { top: -1, left: -1}
  //     const panoIntersect = panoIntersects.find(intersect => {
  //       if (intersect && intersect.uv) {
  //         return true
  //       }
  //       return false
  //     })
  //     if (panoIntersect) {
  //       const {
  //         uv,
  //         object: { material },
  //       } = panoIntersect as any
  //       const top = uv.y * 512 - 256

  //       material.map.transformUv(uv)

  //       // This logic is the reverse of the panoChunk shader logic
  //       let left = (8 / 7) * ((1.0 - uv.x) - offsetX / 1024) * DST_RATIO + rotX
  //       if (left < 0) {
  //         left += 3600
  //       } else if (left > 3600) {
  //         left -= 3600
  //       }
  //       currentPanoPosition.left = left
  //       currentPanoPosition.top = top
  //     }
  //     const filterHotspot = hotspotRectMatchesPosition(currentPanoPosition)
  //     const nowInHotspots = hotspots.filter(
  //       (hotspot) => filterHotspot(hotspot),
  //     )
  //     const leavingHotspots = difference(wasInHotspots, nowInHotspots)
  //     const enteringHotspots = difference(nowInHotspots, wasInHotspots)
  //     const noInteractionHotspots = difference(hotspots, nowInHotspots)

  //     // Update our state
  //     if (wasMouseUpped) {
  //       mouseDown = false
  //     }

  //     if (!mouseDown && wasMouseDowned) {
  //       mouseDown = true
  //       startingPanoPosition = currentPanoPosition
  //       startingScreenPosition = currentSreenPosition
  //       lastMouseDown = Date.now()
  //     }
  //     const isMouseDown = mouseDown

  //     let interactionDistance: number = 0

  //     if (wasMouseUpped && startingScreenPosition) {
  //       interactionDistance = Math.sqrt(
  //         (currentSreenPosition.left - startingScreenPosition.left) ** 2 +
  //           (currentSreenPosition.top - startingScreenPosition.top) ** 2,
  //       )
  //     } else if (wasMouseUpped) {
  //       // if no previous mouse down
  //       startingScreenPosition = currentSreenPosition
  //       interactionDistance = 0
  //     }

  //     const debounceDistance = isTouch ? 80 : 20
  //     const isClick =
  //       wasMouseUpped &&
  //       Date.now() - lastMouseDown < 500 &&
  //       interactionDistance < debounceDistance

  //     const eventOptions = {
  //       currentPosition: currentPanoPosition,
  //       startingPosition: startingPanoPosition,
  //       hotspots,
  //       nowInHotspots,
  //       leavingHotspots,
  //       enteringHotspots,
  //       noInteractionHotspots,
  //       isClick,
  //       isMouseDown,
  //       wasMouseMoved,
  //       wasMouseUpped,
  //       wasMouseDowned,
  //       handleHotspot: gamestateActions.handlePanoHotspot,
  //     }

  //     wasInHotspots = nowInHotspots
  //     wasMouseMoved = false
  //     wasMouseUpped = false
  //     wasMouseDowned = false

  //     if (isTouch) {
  //       lastTouchPosition = currentSreenPosition
  //     }

  //     actionQueue.add(async () => {
  //       // Update gamestate
  //       await dispatch(handleEvent(eventOptions))
  //       // Update cursor location and icon
  //       await dispatch(inputActions.cursorSetPosition(currentSreenPosition))
  //       // Update the PanoAnim
  //       await dispatch(castActionsForScene.update(eventOptions))
  //     })
  //   }
  // }

  // const orientation = createOrientation((rotation) => {
  //   dispatch(
  //     castActionsForScene.pano.rotateBy({
  //       x: rotation.y,
  //       y: rotation.x,
  //     }),
  //   )
  //   if (lastUpdatePosition) {
  //     updateGame(lastUpdatePosition)
  //   }
  // })

  const update = useCallback(
    function update(event: PointerEvent) {
      const { clientX, clientY } = event
      setLastUpdatePosition({ clientX, clientY })
    },
    [setLastUpdatePosition]
  )

  // function off() {
  //   if (orientation) {
  //     orientation.off()
  //   }
  // }

  // function rememberEvent(mouseEvent: any, isTouch?: boolean) {
  //   update(mouseEvent, isTouch)
  // }

  const onPointerUp = useCallback(
    function onMouseUp(event: PointerEvent) {
      setWasMouseUpped(true)
      update(event)
    },
    [update, setWasMouseUpped]
  )

  const onPointerMove = useCallback(
    function onMouseMove(event: PointerEvent) {
      setWasMouseMoved(true)
      update(event)
    },
    [update, setWasMouseMoved]
  )

  const onPointerDown = useCallback(
    function onMouseDown(event: PointerEvent) {
      setWasMouseDowned(true)
      update(event)
    },
    [update, setWasMouseDowned]
  )

  return {
    top,
    left,
    onPointerUp,
    onPointerMove,
    onPointerDown,
    wasMouseDowned,
    wasMouseMoved,
    wasMouseUpped,
  }
}
