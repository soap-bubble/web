import {
  PointerEvent,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useReducer,
} from 'react'
import { Raycaster, Object3D, Camera, Vector2 } from 'three'
import { useDispatch } from 'react-redux'
import { each, difference } from 'lodash'
import {
  actions as castActions,
  selectors as castSelectors,
} from 'morpheus/casts'
import { selectors as sceneSelectors } from 'morpheus/scene'
import {
  EventOption,
  resolveCursor,
  handleEventFactory,
} from 'morpheus/input/handlers'
import { promiseCursor } from 'morpheus/game/actions'
import { selectors as gameSelectors } from 'morpheus/game'
import { actions as gamestateActions, isActive } from 'morpheus/gamestate'
import Queue from 'promise-queue'
import loggerFactory from 'utils/logger'
import { screenToGame } from 'utils/coordinates'
import { isHotspot } from 'morpheus/casts/matchers'
import { Hotspot, Scene, Cast } from 'morpheus/casts/types'
import { DST_RATIO, PANO_OFFSET, DST_WIDTH } from 'morpheus/constants'
import { isPano } from '../matchers'
import { and } from 'utils/matchers'
import { Gamestates } from 'morpheus/gamestate/isActive'
import { handleHotspot } from 'morpheus/gamestate/actions'

const logger = loggerFactory('flatspot')
const mouseQueue = new Queue(1, 128)
const actionQueue = new Queue(1, 12)
interface ClientInputState {
  clientX: number
  clientY: number
  wasPointerUpped: boolean
  wasPointerDown: boolean
  wasPointerMoved: boolean
  wasPointerCancelled: boolean
}
type InputReturn = [
  { top: number; left: number; image: HTMLImageElement | undefined },
  {
    onPointerUp: (e: PointerEvent) => void
    onPointerDown: (e: PointerEvent) => void
    onPointerMove: (e: PointerEvent) => void
    onPointerCancelled: (e: PointerEvent) => void
  }
]

const EVENT_QUEUE_START_ACTION = 'EVENT_QUEUE_START_ACTION'
const EVENT_QUEUE_FINISH_ACTION = 'EVENT_QUEUE_FINISH_ACTION'
const EVENT_QUEUE_PUSH_ACTION = 'EVENT_QUEUE_PUSH_ACTION'

interface EventQueueStartAction {
  type: 'EVENT_QUEUE_START_ACTION'
  payload: EventOption
}
interface EventQueueFinishAction {
  type: 'EVENT_QUEUE_FINISH_ACTION'
  payload: EventOption
}

interface EventQueuePushAction {
  type: 'EVENT_QUEUE_PUSH_ACTION'
  payload: EventOption
}
type EventQueueActions =
  | EventQueueStartAction
  | EventQueueFinishAction
  | EventQueuePushAction

const eventQueueActionCreators = {
  start: (payload: EventOption): EventQueueStartAction => ({
    type: EVENT_QUEUE_START_ACTION,
    payload,
  }),
  finish: (payload: EventOption): EventQueueFinishAction => ({
    type: EVENT_QUEUE_FINISH_ACTION,
    payload,
  }),
  push: (payload: EventOption): EventQueuePushAction => ({
    type: EVENT_QUEUE_PUSH_ACTION,
    payload,
  }),
}

function eventQueueReducer(
  state: {
    executing: null | EventOption
    queue: EventOption[]
  },
  action: EventQueueActions
) {
  switch (action.type) {
    case EVENT_QUEUE_START_ACTION:
      if (state.executing) {
        throw new Error('Event is already executing')
      }
      if (action.payload !== state.queue[0]) {
        throw new Error('Event options do not match')
      }
      return {
        ...state,
        executing: action.payload,
      }
    case EVENT_QUEUE_FINISH_ACTION:
      if (!state.executing) {
        throw new Error('No executing event')
      }
      if (
        action.payload !== state.queue[0] ||
        state.executing !== action.payload
      ) {
        throw new Error('Event options do not match')
      }
      return {
        executing: null,
        queue: state.queue.slice(1),
      }
    case EVENT_QUEUE_PUSH_ACTION:
      return {
        ...state,
        queue: [...state.queue, action.payload],
      }
    default:
      throw new Error()
  }
}

export default function(
  scene: Scene,
  gamestates: Gamestates,
  isPanoScene: boolean,
  camera: Camera | undefined,
  panoObject: Object3D | undefined,
  offsetX: number,
  rotX: number,
  screenLeft: number,
  screenTop: number,
  screenWidth: number,
  screenHeight: number
): InputReturn {
  const dispatch = useDispatch()
  const handleEvent = useMemo(handleEventFactory, [])
  const [eventQueue, eventQueueDispatch] = useReducer(eventQueueReducer, {
    executing: null,
    queue: [],
  })
  const [cursor, setCursor] = useState<HTMLImageElement>()
  const [wasInHotspots, setWasInHotspots] = useState<Hotspot[]>([])
  const [lastMouseDown, setLastMouseDown] = useState<number>(0)
  const [clickStartPos, setClickStartPos] = useState<{
    top: number
    left: number
  }>({
    top: 0,
    left: 0,
  })
  const [isClick, setIsClick] = useState<boolean>(false)
  const [mouseDown, setMouseDown] = useState<boolean>(false)
  const [lastUpdate, setLastUpdatePosition] = useState<ClientInputState>({
    clientY: screenTop,
    clientX: screenLeft,
    wasPointerCancelled: false,
    wasPointerDown: false,
    wasPointerMoved: false,
    wasPointerUpped: false,
  })
  const { top: cursorTop, left: cursorLeft } = useMemo(
    () => ({
      top: lastUpdate.clientY - screenTop,
      left: lastUpdate.clientX - screenLeft,
    }),
    [lastUpdate, screenTop, screenLeft]
  )

  const raycaster = useMemo(() => new Raycaster(), [])
  const { top: gameTop, left: gameLeft } = useMemo(() => {
    if (isPanoScene && camera) {
      if (!document.hidden && panoObject) {
        // Convert mouse coordinates to x, y clamped between -1 and 1.  Also invert y
        const y = ((screenHeight - cursorTop) / screenHeight) * 2 - 1
        const x = ((cursorLeft - screenWidth) / screenWidth) * 2 + 1

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
            const top = uv.y * -512 + 256

            // This is the inverse of the panoChunk shader math
            let left =
              (((8 / 7) * (1.0 - uv.x) - 0.5) * DST_WIDTH + offsetX) * DST_RATIO
            if (left < 0) {
              left += 3600
            } else if (left > 3600) {
              left -= 3600
            }
            if (Date.now() % 15 === 0) {
              console.log({ offsetX, rotX, top, left, x: uv.x, y: uv.y })
            }
            return { top, left }
          }
        }
      }
    }
    return screenToGame({
      top: cursorTop,
      left: cursorLeft,
      height: screenHeight,
      width: screenWidth,
    })
  }, [
    lastUpdate,
    isPanoScene,
    camera,
    offsetX,
    rotX,
    raycaster,
    cursorTop,
    cursorLeft,
    screenWidth,
    screenHeight,
  ])

  const hotspots = useMemo(() => {
    const filter = and<Cast>(isHotspot, cast => isActive({ cast, gamestates }))
    return scene.casts.filter(filter) as Hotspot[]
  }, [scene])

  const cursorIndex = useMemo(() => {
    return resolveCursor(
      hotspots,
      gamestates,
      {
        top: gameTop,
        left: gameLeft,
      },
      clickStartPos,
      mouseDown
    )
  }, [hotspots, gamestates, gameTop, gameLeft, clickStartPos, mouseDown])

  useMemo(() => {
    if (cursorIndex !== 0) {
      return promiseCursor(cursorIndex).then(cursorImg => setCursor(cursorImg))
    }
  }, [cursorIndex])

  useEffect(() => {
    let newMouseDown = mouseDown
    const isClick =
      lastUpdate.wasPointerUpped && Date.now() - lastMouseDown < 800
    if (lastUpdate.wasPointerUpped) {
      newMouseDown = false
    }
    if (!newMouseDown && lastUpdate.wasPointerDown) {
      newMouseDown = true

      setClickStartPos({
        top: gameTop,
        left: gameLeft,
      })
      setLastMouseDown(Date.now())
    }
    setMouseDown(newMouseDown)
    setIsClick(isClick)
  }, [
    lastUpdate,
    gameTop,
    gameLeft,
    setClickStartPos,
    setLastMouseDown,
    setMouseDown,
  ])

  useEffect(() => {
    const nowInHotspots: Hotspot[] = []
    each(hotspots, hotspot => {
      const { rectTop, rectBottom, rectLeft, rectRight } = hotspot
      if (
        (gameTop > rectTop &&
          gameTop < rectBottom &&
          gameLeft > rectLeft &&
          gameLeft < rectRight) ||
        (rectTop === 0 && rectLeft === 0 && rectRight === 0 && rectBottom === 0)
      ) {
        nowInHotspots.push(hotspot)
      }
    })
    const leavingHotspots = difference(wasInHotspots, nowInHotspots)
    const enteringHotspots = difference(nowInHotspots, wasInHotspots)
    const noInteractionHotspots = difference(hotspots, nowInHotspots)

    setWasInHotspots(nowInHotspots)

    const eventOption = {
      currentPosition: {
        top: gameTop,
        left: gameLeft,
      },
      startingPosition: clickStartPos,
      hotspots,
      nowInHotspots,
      leavingHotspots,
      enteringHotspots,
      noInteractionHotspots,
      isClick,
      isMouseDown: mouseDown,
      wasMouseMoved: lastUpdate.wasPointerMoved,
      wasMouseUpped: lastUpdate.wasPointerUpped,
      wasMouseDowned: lastUpdate.wasPointerDown,
      currentScene: scene.sceneId,
      handleHotspot: gamestateActions.handleHotspot,
    }
    // console.log('Queuing', eventOption)
    eventQueueDispatch(eventQueueActionCreators.push(eventOption))
  }, [gameTop, gameLeft, lastUpdate, scene, mouseDown])

  useEffect(() => {
    if (!eventQueue.executing && eventQueue.queue.length) {
      const eventOption = eventQueue.queue[0]
      // console.log('Starting', eventOption)
      eventQueueDispatch(eventQueueActionCreators.start(eventOption))
      dispatch(handleEvent(eventOption)).then(() => {
        //console.log('Finishing', eventOption)
        eventQueueDispatch(eventQueueActionCreators.finish(eventOption))
      })
    }
  }, [eventQueue])
  // const store = storeFactory()
  // const castSelectorForScene = castSelectors.forScene(scene)
  // const castActionsForScene = castActions.forScene(scene)
  // const handleEvent = handleEventFactory()

  // let clickStartPos = { top: -1, left: -1 }
  // let wasInHotspots: Hotspot[] = []
  // let mouseDown = false
  // let lastTouchPosition: { top: number; left: number }
  // let lastMouseDown: number

  // async function updateState({
  //   clientX,
  //   clientY,
  // }: PointerEvent<HTMLCanvasElement>) {
  //   // const state = store.getState()
  //   // const currentScene = scene
  //   // if (!document.hidden) {
  //   //   const inputEnabled = inputSelectors.enabled(state)
  //   //   if (!inputEnabled) {
  //   //     return null
  //   //   }

  //   // }
  //   // return null

  //   const hotspots: Hotspot[] = (scene.casts as any[]).filter(isHotspot)

  //   // Disable for new hook to work. TODO Figure out later;
  //   // const isCurrent = sceneSelectors.currentSceneData(state) === scene
  //   // const isExiting = castSelectorForScene.isExiting
  //   // const acceptsMouseEvents = isCurrent && !isExiting
  //   // if (!acceptsMouseEvents) {
  //   //   return null
  //   // }
  //   const nowInHotspots: Hotspot[] = []
  //   const left = clientX - screenLeft
  //   const top = clientY - screenTop

  //   const adjustedClickPos = screenToGame({
  //     height: screenHeight,
  //     width: screenWidth,
  //     top,
  //     left,
  //   })

  //   each(hotspots, hotspot => {
  //     const { rectTop, rectBottom, rectLeft, rectRight } = hotspot
  //     if (
  //       (adjustedClickPos.top > rectTop &&
  //         adjustedClickPos.top < rectBottom &&
  //         adjustedClickPos.left > rectLeft &&
  //         adjustedClickPos.left < rectRight) ||
  //       (rectTop === 0 && rectLeft === 0 && rectRight === 0 && rectBottom === 0)
  //     ) {
  //       nowInHotspots.push(hotspot)
  //     }
  //   })

  //   const leavingHotspots = difference(wasInHotspots, nowInHotspots)
  //   const enteringHotspots = difference(nowInHotspots, wasInHotspots)
  //   const noInteractionHotspots = difference(hotspots, nowInHotspots)
  //   const isClick = wasMouseUpped && Date.now() - lastMouseDown < 800

  //   if (wasMouseUpped) {
  //     mouseDown = false
  //   }

  //   if (!mouseDown && wasMouseDowned) {
  //     mouseDown = true
  //     clickStartPos = adjustedClickPos
  //     lastMouseDown = Date.now()
  //   }
  //   const isMouseDown = mouseDown
  //   const eventOptions = {
  //     currentPosition: adjustedClickPos,
  //     startingPosition: clickStartPos,
  //     hotspots,
  //     nowInHotspots,
  //     leavingHotspots,
  //     enteringHotspots,
  //     noInteractionHotspots,
  //     isClick,
  //     isMouseDown,
  //     wasMouseMoved,
  //     wasMouseUpped,
  //     wasMouseDowned,
  //     // currentScene: currentScene.sceneId,
  //     handleHotspot: gamestateActions.handleHotspot,
  //   }

  //   if (wasMouseUpped) {
  //     clickStartPos = { top: -1, left: -1 }
  //   }

  //   wasInHotspots = nowInHotspots
  //   wasMouseMoved = false
  //   wasMouseUpped = false
  //   wasMouseDowned = false
  //   lastTouchPosition = {
  //     top: clientX,
  //     left: clientY,
  //   }
  //   // await dispatch(handleEvent(eventOptions))
  //   // await dispatch(inputActions.cursorSetPosition({ top, left }))
  //   // await dispatch(castActionsForScene.update(eventOptions))
  // }

  const onPointerUp = useCallback(
    function onMouseUp(event: PointerEvent) {
      const { clientX, clientY } = event
      setLastUpdatePosition({
        clientX,
        clientY,
        wasPointerCancelled: false,
        wasPointerDown: false,
        wasPointerMoved: false,
        wasPointerUpped: true,
      })
    },
    [setLastUpdatePosition]
  )

  const onPointerMove = useCallback(
    function onMouseMove(event: PointerEvent) {
      const { clientX, clientY } = event
      setLastUpdatePosition({
        clientX,
        clientY,
        wasPointerCancelled: false,
        wasPointerDown: false,
        wasPointerMoved: true,
        wasPointerUpped: false,
      })
    },
    [setLastUpdatePosition]
  )

  const onPointerDown = useCallback(
    function onMouseDown(event: PointerEvent) {
      const { clientX, clientY } = event
      setLastUpdatePosition({
        clientX,
        clientY,
        wasPointerCancelled: false,
        wasPointerDown: true,
        wasPointerMoved: false,
        wasPointerUpped: false,
      })
    },
    [setLastUpdatePosition]
  )

  const onPointerCancelled = useCallback(
    function onPointerCancelled(event: PointerEvent) {
      const { clientX, clientY } = event
      setLastUpdatePosition({
        clientX,
        clientY,
        wasPointerCancelled: true,
        wasPointerDown: false,
        wasPointerMoved: false,
        wasPointerUpped: false,
      })
    },
    [setLastUpdatePosition]
  )

  return [
    {
      image: cursor,
      top: cursorTop,
      left: cursorLeft,
    },
    {
      onPointerUp,
      onPointerMove,
      onPointerDown,
      onPointerCancelled,
    },
  ]
}
