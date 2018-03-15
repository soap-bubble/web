import {
  xor,
  intersection,
} from 'lodash';
import {
  actions as gameActions,
} from 'morpheus/game';
import {
  isActive,
  actions as gamestateActions,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate';
import {
  actions as castActions,
} from 'morpheus/casts';
import loggerFactory from 'utils/logger';
import {
  and,
  or,
} from 'utils/matchers';
import {
  forEachSeries,
  someSeries,
} from 'p-iteration';
import {
  ACTION_TYPES,
  GESTURES,
} from 'morpheus/constants';
import {
  CURSOR_IDS,
  CURSOR_NAMES,
} from 'morpheus/game/cursors';

const isDebug = process.env.NODE_ENV !== 'production';
export const inputKeyHandlers = {};
const logger = loggerFactory('input:handlers');

const gesture = GESTURES.reduce((memo, curr, index) => {
  memo[`is${curr}`] = function isGestureType(hotspot) {
    return index === hotspot.gesture;
  };
  return memo;
}, {});

const actionType = Object.keys(ACTION_TYPES).reduce((memo, curr) => {
  const type = ACTION_TYPES[curr];
  memo[`is${type}`] = function isActionType(hotspot) {
    return Number(curr) === hotspot.type;
  };
  return memo;
}, {});

function matchesHotspotRect({ top, left }) {
  return ({
    rectTop,
    rectBottom,
    rectLeft,
    rectRight,
  }) => (top > rectTop
    && top < rectBottom
    && left > rectLeft
    && left < rectRight)
  || (rectTop === 0
    && rectLeft === 0
    && rectRight === 0
    && rectBottom === 0
  );
}

export function handleEventFactory() {
  const self = function handleEvent({
    currentPosition,
    startingPosition,
    hotspots,
    nowInHotspots,
    leavingHotspots,
    enteringHotspots,
    noInteractionHotspots,
    wasMouseDownedInHotspots,
    isClick,
    isMouseDown,
    wasMouseMoved,
    wasMouseUpped,
    wasMouseDowned,
  }) {
    return async (dispatch, getState) => {
      let alwaysExecuteHotspots = [];
      let mouseLeavingHotspots = [];
      let mouseEnteringHotspots = [];
      let mouseUpHotspots = [];
      let mouseDownHotspots = [];
      let mouseDragHotspots = [];
      let clickableHotspots = [];
      let mouseNoneHotspots = [];
      let interactedWithHotspots;

      const isHotspotActive = hotspot => isActive({
        cast: hotspot,
        gamestates: gamestateSelectors
          .forState(getState()),
      });

      alwaysExecuteHotspots = hotspots
        .filter(gesture.isAlways)
        .filter(h => h.castId === 0);

      if (wasMouseMoved) {
        mouseLeavingHotspots = leavingHotspots
          .filter(gesture.isMouseLeave);

        mouseEnteringHotspots = enteringHotspots
          .filter(gesture.isMouseEnter);
      }

      if (wasMouseUpped) {
        mouseUpHotspots = nowInHotspots
          .filter(and(matchesHotspotRect(startingPosition), gesture.isMouseUp));

        if (isClick) {
          clickableHotspots = nowInHotspots
            .filter(and(matchesHotspotRect(startingPosition), gesture.isMouseClick));
        }
      }

      if (wasMouseMoved && isMouseDown) {
        interactedWithHotspots = interactedWithHotspots
          || intersection(nowInHotspots, wasMouseDownedInHotspots);
        mouseDragHotspots = interactedWithHotspots
          .filter(
            and(
              or(gesture.isMouseClick, gesture.isMouseUp, gesture.isMouseDown),
              or(
                actionType.isHorizSlider,
                actionType.isVertSlider,
                actionType.isTwoAxisSlider,
              ),
            ),
          );
      }

      if (wasMouseDowned) {
        mouseDownHotspots = nowInHotspots
          .filter(gesture.isMouseDown);
      }

      mouseNoneHotspots = noInteractionHotspots
        .filter(gesture.isMouseNone);

      if (isDebug
        && (
          xor(self.alwaysExecuteHotspots, alwaysExecuteHotspots).length
          || xor(self.mouseLeavingHotspots, mouseLeavingHotspots).length
          || xor(self.mouseEnteringHotspots, mouseEnteringHotspots).length
          || xor(self.mouseUpHotspots, mouseUpHotspots).length
          || xor(self.mouseDownHotspots, mouseDownHotspots).length
          || xor(self.mouseDragHotspots, mouseDragHotspots).length
          || xor(self.clickableHotspots, clickableHotspots).length
          || xor(self.mouseNoneHotspots, mouseNoneHotspots).length
          || self.lastWasMouseDowned !== wasMouseDowned
          || self.lastWasMouseUpped !== wasMouseUpped
          || self.lastWasMouseMoved !== wasMouseMoved
        )
      ) {
        logger.info({
          nowInHotspots,
          wasMouseDownedInHotspots,
          interactedWithHotspots,
          alwaysExecuteHotspots,
          mouseLeavingHotspots,
          mouseEnteringHotspots,
          mouseUpHotspots,
          mouseDownHotspots,
          mouseDragHotspots,
          clickableHotspots,
          mouseNoneHotspots,
          isClick,
          isMouseDown,
          wasMouseMoved,
          wasMouseDowned,
          wasMouseUpped,
        });
      }

      self.alwaysExecuteHotspots = alwaysExecuteHotspots;
      self.mouseLeavingHotspots = mouseLeavingHotspots;
      self.mouseEnteringHotspots = mouseEnteringHotspots;
      self.mouseUpHotspots = mouseUpHotspots;
      self.mouseDownHotspots = mouseDownHotspots;
      self.mouseDragHotspots = mouseDragHotspots;
      self.clickableHotspots = clickableHotspots;
      self.mouseNoneHotspots = mouseNoneHotspots;
      self.lastWasMouseUpped = wasMouseUpped;
      self.lastWasMouseMoved = wasMouseMoved;
      self.lastWasMouseDowned = wasMouseDowned;

      await forEachSeries(alwaysExecuteHotspots, async (hotspot) => {
        if (isHotspotActive(hotspot)) {
          await dispatch(gamestateActions.handleHotspot({
            hotspot,
            ...currentPosition,
          }));
        }
      });

      await forEachSeries(mouseLeavingHotspots, async (hotspot) => {
        if (isHotspotActive(hotspot)) {
          await dispatch(gamestateActions.handleHotspot({
            hotspot,
            ...currentPosition,
          }));
        }
      });

      await forEachSeries(mouseEnteringHotspots, async (hotspot) => {
        if (isHotspotActive(hotspot)) {
          await dispatch(gamestateActions.handleHotspot({
            hotspot,
            ...currentPosition,
          }));
        }
      });

      await someSeries(mouseUpHotspots, async (hotspot) => {
        if (isHotspotActive(hotspot)) {
          const allDone = await dispatch(gamestateActions.handleHotspot({
            hotspot,
            ...currentPosition,
          }));
          return allDone;
        }
        return null;
      });

      await someSeries(clickableHotspots, async (hotspot) => {
        if (isHotspotActive(hotspot)) {
          const allDone = await dispatch(gamestateActions.handleHotspot({
            hotspot,
            ...currentPosition,
          }));
          return allDone;
        }
        return null;
      });

      await someSeries(mouseDragHotspots, async (hotspot) => {
        if (isHotspotActive(hotspot)) {
          const allDone = await dispatch(gamestateActions.handleHotspot({
            ...currentPosition,
            hotspot,
          }));
          return allDone;
        }
        return null;
      });

      await someSeries(mouseDownHotspots, async (hotspot) => {
        if (isHotspotActive(hotspot)) {
          const allDone = await dispatch(gamestateActions.handleHotspot({
            hotspot,
            ...currentPosition,
          }));
          return allDone;
        }
        return null;
      });

      await forEachSeries(mouseNoneHotspots, async (hotspot) => {
        if (isHotspotActive(hotspot)) {
          await dispatch(gamestateActions.handleHotspot({
            hotspot,
            ...currentPosition,
          }));
        }
      });

      let cursor;
      for (let i = 0; i < nowInHotspots.length; i++) {
        const hotspot = nowInHotspots[i];
        if (isHotspotActive(hotspot)) {
          if (actionType.isChangeCursor(hotspot)) {
            const {
              param1,
              param2,
            } = hotspot;
            if (param1) {
              const gamestate = gamestateSelectors
                .forState(getState())
                .byId(param1);
              if (gamestate) {
                cursor = gamestate.value + param2;
                break;
              }
            }
          } else if (hotspot.cursorShapeWhenActive === CURSOR_IDS.HAND) {
            if (hotspot.type >= 5 && hotspot.type <= 8) {
              if (isMouseDown) {
                cursor = CURSOR_IDS.CLOSED;
              } else {
                cursor = CURSOR_IDS.OPEN;
              }
            } else {
              cursor = CURSOR_IDS.HAND;
            }
            break;
          } else if (hotspot.cursorShapeWhenActive !== 0) {
            cursor = hotspot.cursorShapeWhenActive;
            break;
          }
        }
      }

      if (!cursor) {
        cursor = CURSOR_IDS.WHEEL;
      }
      await dispatch(gameActions.setCursor(cursor));
    };
  };

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
  });
}
