import {
  PointerEvent,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useReducer,
} from 'react'
import { useObservable } from 'rxjs-hooks'
import { Raycaster, Object3D, Camera, Vector2 } from 'three'
import { useDispatch } from 'react-redux'
import { each, difference, isUndefined } from 'lodash'
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
import {
  Hotspot,
  Scene,
  Cast,
  MovieCast,
  MovieSpecialCast,
} from 'morpheus/casts/types'
import { DST_RATIO, PANO_OFFSET, DST_WIDTH, GESTURES } from 'morpheus/constants'
import { forMorpheusType } from '../matchers'
import { and } from 'utils/matchers'
import { Gamestates } from 'morpheus/gamestate/isActive'
import { handleHotspot } from 'morpheus/gamestate/actions'
import { Observable, Subscription } from 'rxjs'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import { Action, AnyAction } from 'redux'
import { goToScene } from 'morpheus/scene/actions'

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
export type DispatchEvent = ThunkAction<Promise<any>, any, any, Action>

const EVENT_QUEUE_START_ACTION = 'EVENT_QUEUE_START_ACTION'
const EVENT_QUEUE_FINISH_ACTION = 'EVENT_QUEUE_FINISH_ACTION'
const EVENT_QUEUE_PUSH_ACTION = 'EVENT_QUEUE_PUSH_ACTION'

interface EventQueueStartAction {
  type: 'EVENT_QUEUE_START_ACTION'
  payload: DispatchEvent
}
interface EventQueueFinishAction {
  type: 'EVENT_QUEUE_FINISH_ACTION'
  payload: DispatchEvent
}

interface EventQueuePushAction {
  type: 'EVENT_QUEUE_PUSH_ACTION'
  payload: DispatchEvent
}
type EventQueueActions =
  | EventQueueStartAction
  | EventQueueFinishAction
  | EventQueuePushAction

const eventQueueActionCreators = {
  start: (payload: DispatchEvent): EventQueueStartAction => ({
    type: EVENT_QUEUE_START_ACTION,
    payload,
  }),
  finish: (payload: DispatchEvent): EventQueueFinishAction => ({
    type: EVENT_QUEUE_FINISH_ACTION,
    payload,
  }),
  push: (payload: DispatchEvent): EventQueuePushAction => ({
    type: EVENT_QUEUE_PUSH_ACTION,
    payload,
  }),
}

function eventQueueReducer(
  state: {
    executing: null | DispatchEvent
    queue: DispatchEvent[]
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

const isMovieSpecialCast = forMorpheusType('MovieSpecialCast')
const isMovieCast = forMorpheusType('MovieCast')

export default function(
  scene: Scene,
  gamestates: Gamestates,
  movieCastEndObserver: Observable<MovieCast> | undefined | null,
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
  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>()
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

  /*
   * Determines the coordinates of the pointer in Morpheus game coordinates
   */
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

  /*
   * The currently active hotspots of the scene
   */
  const hotspots = useMemo(() => {
    const filter = and<Cast>(isHotspot, cast => isActive({ cast, gamestates }))
    return scene.casts.filter(filter) as Hotspot[]
  }, [scene, gamestates])

  /*
   * The Morpheus cursor type expressed as the original Morpheus cursor enum
   */
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

  /*
   * Loads the image for a cursor (or returns the cached copy)
   */
  useEffect(() => {
    if (cursorIndex !== 0) {
      promiseCursor(cursorIndex).then(cursorImg => setCursor(cursorImg))
    }
  }, [cursorIndex])

  /*
   * Various state effect updators
   */
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

  /*
   * Generates new hotspot events for the dispatch queue
   */
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
    eventQueueDispatch(eventQueueActionCreators.push(handleEvent(eventOption)))
  }, [gameTop, gameLeft, lastUpdate, scene, mouseDown])

  /*
   * Handles hotspots in new scenes that need to be always activated
   * As far as I can tell, the gesture types "Always" and "SceneEnter" can be
   * activated at the same time which for here will when be a new scene is received
   */
  useEffect(() => {
    if (scene) {
      const activatableNewHotspots = (scene.casts as Hotspot[]).filter(
        and<Cast>(
          isHotspot,
          cast => isActive({ cast, gamestates }),
          (({ gesture }: Hotspot) =>
            GESTURES[gesture] === 'Always' ||
            GESTURES[gesture] === 'SceneEnter') as (c: Cast) => boolean
        )
      )
      for (const hotspot of activatableNewHotspots) {
        eventQueueDispatch(
          eventQueueActionCreators.push(handleHotspot({ hotspot }))
        )
      }
    }
  }, [scene])

  /*
   * Receives "end" events for MovieCasts (which can be either an image or a movie)
   * and handles them. Contains various edge case logic from original Morpheus
   */
  useEffect(() => {
    let subscription: Subscription
    if (movieCastEndObserver) {
      subscription = movieCastEndObserver.subscribe(movieCast => {
        if (isMovieSpecialCast(movieCast)) {
          const {
            nextSceneId,
            actionAtEnd,
            angleAtEnd,
            dissolveToNextScene,
          } = movieCast as MovieSpecialCast
          if (actionAtEnd > 0) {
            eventQueueDispatch(
              eventQueueActionCreators.push(
                goToScene(nextSceneId, dissolveToNextScene)
              )
            )
          } else {
            let startAngle: number
            if (
              nextSceneId &&
              scene &&
              nextSceneId !== 0x3fffffff &&
              nextSceneId !== scene.sceneId
            ) {
              if (!isUndefined(angleAtEnd) && angleAtEnd !== -1) {
                startAngle = angleAtEnd
              }
            }
            eventQueueDispatch(
              eventQueueActionCreators.push(
                goToScene(nextSceneId, dissolveToNextScene)
              )
            )
          }
        }
      })
    }
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [movieCastEndObserver, eventQueueDispatch, scene])

  /*
   * Empties the event dispatch queue
   */
  useEffect(() => {
    if (!eventQueue.executing && eventQueue.queue.length) {
      const dispatchEvent = eventQueue.queue[0]
      eventQueueDispatch(eventQueueActionCreators.start(dispatchEvent))
      dispatch(dispatchEvent).then(
        () => {
          eventQueueDispatch(eventQueueActionCreators.finish(dispatchEvent))
        },
        err => {
          console.error('Error dispatching hotspot event', err)
          eventQueueDispatch(eventQueueActionCreators.finish(dispatchEvent))
        }
      )
    }
  }, [eventQueue])

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
