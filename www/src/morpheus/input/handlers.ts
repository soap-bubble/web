import { xor, intersection } from 'lodash'
import { actions as gameActions } from 'morpheus/game'
import { actions as sceneActions } from 'morpheus/scene'
import { isActive, selectors as gamestateSelectors } from 'morpheus/gamestate'
import loggerFactory from 'utils/logger'
import { and, or } from 'utils/matchers'
import { forEachSeries, someSeries } from 'utils/asyncIteration'
import {
  gesture,
  actionType,
  hotspotRectMatchesPosition,
} from 'morpheus/hotspot/matchers'
import { CURSOR_IDS } from 'morpheus/game/cursors'
import isDebug from 'utils/isDebug'
import { ActionCreator, Action } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { Hotspot } from 'morpheus/casts/types'
import { Gamestates } from 'morpheus/gamestate/isActive'

const logger = loggerFactory('input:handlers')

const isHotspotActive = ({ hotspot, gamestates }: any) =>
  isActive({
    cast: hotspot,
    gamestates,
  })

export function resolveCursor(
  hotspots: Hotspot[],
  gamestates: Gamestates,
  currentPosition: { top: number; left: number },
  startingPosition: { top: number; left: number },
  isMouseDown: boolean
) {
  let cursor
  for (let i = 0; i < hotspots.length; i++) {
    const hotspot = hotspots[i]
    if (
      isHotspotActive({
        hotspot,
        gamestates,
      })
    ) {
      if (
        hotspotRectMatchesPosition(currentPosition)(hotspot) &&
        actionType.isChangeCursor(hotspot)
      ) {
        const { param1, param2 } = hotspot
        if (param1) {
          const gamestate = gamestates.byId(param1)
          if (gamestate) {
            cursor = gamestate.value + param2
            break
          }
        }
      } else if (
        hotspot.cursorShapeWhenActive === CURSOR_IDS.HAND &&
        or(
          hotspotRectMatchesPosition(currentPosition),
          and(
            hotspotRectMatchesPosition(startingPosition),
            or(gesture.isMouseClick, gesture.isMouseUp, gesture.isMouseDown),
            or(
              actionType.isRotate,
              actionType.isHorizSlider,
              actionType.isVertSlider,
              actionType.isTwoAxisSlider
            )
          )
        )(hotspot)
      ) {
        if (hotspot.type >= 5 && hotspot.type <= 8) {
          if (isMouseDown) {
            cursor = CURSOR_IDS.CLOSED
          } else if (!isMouseDown) {
            cursor = CURSOR_IDS.OPEN
          }
        } else {
          cursor = CURSOR_IDS.HAND
        }
        break
      } else if (
        hotspot.cursorShapeWhenActive !== 0 &&
        hotspotRectMatchesPosition(currentPosition)(hotspot)
      ) {
        cursor = hotspot.cursorShapeWhenActive
        break
      }
    }
  }

  if (!cursor) {
    cursor = CURSOR_IDS.WHEEL
  }
  return cursor
}

export const resolveCursorAction: ActionCreator<ThunkAction<
  number,
  any,
  any,
  Action
>> = ({ hotspots, currentPosition, startingPosition, isMouseDown }: any) => {
  return (dispatch, getState) => {
    const gamestates = gamestateSelectors.forState(getState())
    return resolveCursor(
      hotspots,
      gamestates,
      currentPosition,
      startingPosition,
      isMouseDown
    )
  }
}

export interface EventOption {
  currentPosition: {
    top: number
    left: number
  }
  startingPosition: {
    top: number
    left: number
  }
  hotspots: Hotspot[]
  nowInHotspots: Hotspot[]
  leavingHotspots: Hotspot[]
  enteringHotspots: Hotspot[]
  noInteractionHotspots: Hotspot[]
  isClick: boolean
  isMouseDown: boolean
  wasMouseMoved: boolean
  wasMouseUpped: boolean
  wasMouseDowned: boolean
  currentScene: number
  handleHotspot: ActionCreator<
    ThunkAction<Promise<boolean>, any, any, Action<any>>
  >
}
export const handleEventFactory = () => {
  const self: any = function handleEvent({
    currentScene,
    currentPosition,
    startingPosition,
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
    handleHotspot,
  }: EventOption) {
    return async (dispatch: any, getState: any) => {
      let alwaysExecuteHotspots: Hotspot[] = []
      let mouseLeavingHotspots: Hotspot[] = []
      let mouseEnteringHotspots: Hotspot[] = []
      let mouseUpHotspots: Hotspot[] = []
      let mouseDownHotspots: Hotspot[] = []
      let mouseDragHotspots: Hotspot[] = []
      let clickableHotspots: Hotspot[] = []
      let mouseNoneHotspots: Hotspot[] = []

      alwaysExecuteHotspots = hotspots
        .filter(gesture.isAlways)
        .filter((h: any) => h.castId === 0)

      if (wasMouseMoved) {
        mouseLeavingHotspots = leavingHotspots.filter(gesture.isMouseLeave)

        mouseEnteringHotspots = enteringHotspots.filter(gesture.isMouseEnter)
      }

      if (wasMouseUpped) {
        mouseUpHotspots = nowInHotspots.filter(
          and(hotspotRectMatchesPosition(startingPosition), gesture.isMouseUp)
        )

        if (isClick) {
          clickableHotspots = nowInHotspots.filter(
            and(
              hotspotRectMatchesPosition(startingPosition),
              gesture.isMouseClick
            )
          )
        }
      }

      if (wasMouseMoved && isMouseDown) {
        mouseDragHotspots = hotspots.filter(
          and(
            hotspotRectMatchesPosition(startingPosition),
            or(gesture.isMouseClick, gesture.isMouseUp, gesture.isMouseDown),
            or(
              actionType.isRotate,
              actionType.isHorizSlider,
              actionType.isVertSlider,
              actionType.isTwoAxisSlider
            )
          )
        )
      }

      if (wasMouseDowned) {
        mouseDownHotspots = nowInHotspots.filter(gesture.isMouseDown)

        nowInHotspots
          .filter(
            or(
              actionType.isRotate,
              actionType.isHorizSlider,
              actionType.isVertSlider,
              actionType.isTwoAxisSlider
            )
          )
          .forEach((hotspot: any) => {
            const { param1 } = hotspot
            const gamestate = gamestateSelectors
              .forState(getState())
              .byId(param1)
            if (gamestate) {
              hotspot.oldValue = gamestate.value
            }
          })
      }

      mouseNoneHotspots = noInteractionHotspots.filter(gesture.isMouseNone)

      if (
        isDebug &&
        (xor(self.alwaysExecuteHotspots, alwaysExecuteHotspots).length ||
          xor(self.mouseLeavingHotspots, mouseLeavingHotspots).length ||
          xor(self.mouseEnteringHotspots, mouseEnteringHotspots).length ||
          xor(self.mouseUpHotspots, mouseUpHotspots).length ||
          xor(self.mouseDownHotspots, mouseDownHotspots).length ||
          xor(self.mouseDragHotspots, mouseDragHotspots).length ||
          xor(self.clickableHotspots, clickableHotspots).length ||
          xor(self.mouseNoneHotspots, mouseNoneHotspots).length ||
          self.lastWasMouseDowned !== wasMouseDowned ||
          self.lastWasMouseUpped !== wasMouseUpped ||
          self.lastWasMouseMoved !== wasMouseMoved)
      ) {
        // logger.debug({
        //   currentScene,
        //   hotspots,
        //   currentPosition,
        //   startingPosition,
        //   nowInHotspots,
        //   alwaysExecuteHotspots,
        //   mouseLeavingHotspots,
        //   mouseEnteringHotspots,
        //   mouseUpHotspots,
        //   mouseDownHotspots,
        //   mouseDragHotspots,
        //   clickableHotspots,
        //   mouseNoneHotspots,
        //   isClick,
        //   isMouseDown,
        //   wasMouseMoved,
        //   wasMouseDowned,
        //   wasMouseUpped,
        // })
      }

      self.alwaysExecuteHotspots = alwaysExecuteHotspots
      self.mouseLeavingHotspots = mouseLeavingHotspots
      self.mouseEnteringHotspots = mouseEnteringHotspots
      self.mouseUpHotspots = mouseUpHotspots
      self.mouseDownHotspots = mouseDownHotspots
      self.mouseDragHotspots = mouseDragHotspots
      self.clickableHotspots = clickableHotspots
      self.mouseNoneHotspots = mouseNoneHotspots
      self.lastWasMouseUpped = wasMouseUpped
      self.lastWasMouseMoved = wasMouseMoved
      self.lastWasMouseDowned = wasMouseDowned

      let nextSceneSpread: any[]

      const handleIfActive = (inform: any) => async (hotspot: any) => {
        let allDone = false
        const handlerContext = {
          set nextSceneSpread(spread: any[]) {
            nextSceneSpread = spread
          },
        }
        if (
          isHotspotActive({
            hotspot,
            gamestates: gamestateSelectors.forState(getState()),
          })
        ) {
          allDone = await dispatch(
            handleHotspot({
              hotspot,
              currentPosition,
              startingPosition,
              isMouseDown,
              context: handlerContext,
            })
          )
          if (inform) {
            inform({
              allDone,
              hotspot,
              handlerContext,
            })
          }
        }
        return allDone
      }

      let debugLogger // = logger.debug.bind(logger);

      await forEachSeries(mouseLeavingHotspots, handleIfActive(debugLogger))
      await forEachSeries(mouseEnteringHotspots, handleIfActive(debugLogger))
      await someSeries(mouseUpHotspots, handleIfActive(debugLogger))
      await someSeries(clickableHotspots, handleIfActive(debugLogger))
      await someSeries(mouseDragHotspots, handleIfActive(debugLogger))
      await someSeries(alwaysExecuteHotspots, handleIfActive(debugLogger))
      await someSeries(mouseDownHotspots, handleIfActive(debugLogger))
      await forEachSeries(mouseNoneHotspots, handleIfActive(debugLogger))

      // @ts-ignore
      if (nextSceneSpread) {
        await dispatch(sceneActions.goToScene(...nextSceneSpread))
      }
    }
  }

  return Object.assign(self, {
    alwaysExecuteHotspots: [],
    mouseLeavingHotspots: [],
    mouseEnteringHotspots: [],
    mouseUpHotspots: [],
    mouseDownHotspots: [],
    mouseDragHotspots: [],
    clickableHotspots: [],
    mouseNoneHotspots: [],
    lastCursor: null,
  })
}
