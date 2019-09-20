import { each, difference } from 'lodash'
import {
  actions as castActions,
  selectors as castSelectors,
} from 'morpheus/casts'
import { selectors as sceneSelectors } from 'morpheus/scene'
import {
  handleEventFactory,
  actions as inputActions,
  selectors as inputSelectors,
} from 'morpheus/input'
import { selectors as gameSelectors } from 'morpheus/game'
import { actions as gamestateActions } from 'morpheus/gamestate'
import Queue from 'promise-queue'
import storeFactory from 'store'
import loggerFactory from 'utils/logger'
import { screenToGame } from 'utils/coordinates'
import { isHotspot } from 'morpheus/casts/matchers'

const logger = loggerFactory('flatspot')
const mouseQueue = new Queue(1, 128)
const actionQueue = new Queue(1, 12)

export default function({ dispatch, scene }) {
  const store = storeFactory()
  const castSelectorForScene = castSelectors.forScene(scene)
  const castActionsForScene = castActions.forScene(scene)
  const handleEvent = handleEventFactory()

  let clickStartPos = { top: -1, left: -1 }
  let wasInHotspots = []
  let wasMouseDowned = false
  let wasMouseMoved = false
  let wasMouseUpped = false
  let mouseDown = false
  let lastTouchPosition
  let lastMouseDown

  async function updateState({ clientX, clientY }, isTouchEnd) {
    const state = store.getState()
    const currentScene = scene
    if (!document.hidden) {
      const inputEnabled = inputSelectors.enabled(state)
      if (!inputEnabled) {
        return null
      }
      const location = gameSelectors.location(state)
      const hotspots = scene.casts.filter(isHotspot)

      // Disable for new hook to work. TODO Figure out later;
      // const isCurrent = sceneSelectors.currentSceneData(state) === scene
      // const isExiting = castSelectorForScene.isExiting
      // const acceptsMouseEvents = isCurrent && !isExiting
      // if (!acceptsMouseEvents) {
      //   return null
      // }
      const nowInHotspots = []
      const left = clientX - location.x
      const top = clientY - location.y

      const newWidth = gameSelectors.width(store.getState())
      const newHeight = gameSelectors.height(store.getState())

      const adjustedClickPos = screenToGame({
        height: newHeight,
        width: newWidth,
        top,
        left,
      })

      each(hotspots, hotspot => {
        const { rectTop, rectBottom, rectLeft, rectRight } = hotspot
        if (
          (adjustedClickPos.top > rectTop &&
            adjustedClickPos.top < rectBottom &&
            adjustedClickPos.left > rectLeft &&
            adjustedClickPos.left < rectRight) ||
          (rectTop === 0 &&
            rectLeft === 0 &&
            rectRight === 0 &&
            rectBottom === 0)
        ) {
          nowInHotspots.push(hotspot)
        }
      })

      const leavingHotspots = difference(wasInHotspots, nowInHotspots)
      const enteringHotspots = difference(nowInHotspots, wasInHotspots)
      const noInteractionHotspots = difference(hotspots, nowInHotspots)
      const isClick = wasMouseUpped && Date.now() - lastMouseDown < 800

      if (wasMouseUpped) {
        mouseDown = false
      }

      if (!mouseDown && wasMouseDowned) {
        mouseDown = true
        clickStartPos = adjustedClickPos
        lastMouseDown = Date.now()
      }
      const isMouseDown = mouseDown
      const eventOptions = {
        currentPosition: adjustedClickPos,
        startingPosition: clickStartPos,
        hotspots,
        nowInHotspots,
        leavingHotspots,
        enteringHotspots,
        noInteractionHotspots,
        isClick,
        isMouseDown,
        wasMouseMoved,
        wasMouseUpped,
        wasMouseDowned,
        currentScene: currentScene.sceneId,
        handleHotspot: gamestateActions.handleHotspot,
      }

      if (wasMouseUpped) {
        clickStartPos = { top: -1, left: -1 }
      }

      wasInHotspots = nowInHotspots
      wasMouseMoved = false
      wasMouseUpped = false
      wasMouseDowned = false
      lastTouchPosition = {
        top: clientX,
        left: clientY,
      }
      await dispatch(handleEvent(eventOptions))
      await dispatch(inputActions.cursorSetPosition({ top, left }))
      await dispatch(castActionsForScene.update(eventOptions))
    }
    return null
  }

  async function onMouseDown(mouseEvent) {
    wasMouseDowned = true
    await updateState(mouseEvent)
  }

  async function onMouseMove(mouseEvent) {
    wasMouseMoved = true
    await updateState(mouseEvent)
  }

  async function onMouseUp(mouseEvent) {
    wasMouseUpped = true
    await updateState(mouseEvent)
  }

  async function onTouchStart(touchEvent) {
    const { touches } = touchEvent
    if (touches.length) {
      wasMouseDowned = true
      await updateState(touches[0])
    }
  }

  async function onTouchMove(touchEvent) {
    const { touches } = touchEvent
    if (touches.length) {
      wasMouseMoved = true
      await updateState(touches[0])
    }
  }

  async function onTouchEnd({ changedTouches: touches }) {
    if (touches.length) {
      wasMouseUpped = true
      await updateState(touches[0], true)
    }
  }

  function onTouchCancel(/* touchEvent */) {
    // TODO....
  }

  return {
    onMouseUp,
    onMouseMove,
    onMouseDown,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  }
}
