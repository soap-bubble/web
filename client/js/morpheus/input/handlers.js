import {
  xor,
  intersection,
} from 'lodash';
import {
  actions as gameActions,
} from 'morpheus/game';
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate';
import {
  actions as castActions,
} from 'morpheus/casts';
import loggerFactory from 'utils/logger';
import {
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
    return curr === hotspot.type;
  };
  return memo;
}, {});

export function handleEventFactory() {
  const self = function handleEvent({
    top,
    left,
    enabledHotspots,
    nowActiveHotspots,
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

      alwaysExecuteHotspots = enabledHotspots
        .filter(gesture.isAlways)
        .filter(h => h.castId === 0);

      if (wasMouseMoved) {
        mouseLeavingHotspots = leavingHotspots
          .filter(gesture.isMouseLeave);

        mouseEnteringHotspots = enteringHotspots
          .filter(gesture.isMouseEnter);
      }

      if (wasMouseUpped) {
        interactedWithHotspots = intersection(nowActiveHotspots, wasMouseDownedInHotspots);
        mouseUpHotspots = interactedWithHotspots
          .filter(gesture.isMouseUp);

        if (isClick) {
          clickableHotspots = interactedWithHotspots
            .filter(gesture.isMouseClick);
        }
      }

      if (wasMouseMoved && isMouseDown) {
        interactedWithHotspots = interactedWithHotspots
          || intersection(nowActiveHotspots, wasMouseDownedInHotspots);
        mouseDragHotspots = interactedWithHotspots
          .filter(
            or(
              or(gesture.isMouseClick, gesture.isMouseUp),
              actionType.isHorizSlider,
              actionType.isVertSlider,
              actionType.isTwoAxisSlider,
            ),
          );
      }

      if (wasMouseDowned) {
        mouseDownHotspots = nowActiveHotspots
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
          nowActiveHotspots,
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
        await dispatch(gamestateActions.handleHotspot({
          hotspot,
          top,
          left,
        }));
      });

      await forEachSeries(mouseLeavingHotspots, async (hotspot) => {
        await dispatch(gamestateActions.handleHotspot({
          hotspot,
          top,
          left,
        }));
      });

      await forEachSeries(mouseEnteringHotspots, async (hotspot) => {
        await dispatch(gamestateActions.handleHotspot({
          hotspot,
          top,
          left,
        }));
      });

      await someSeries(mouseUpHotspots, async (hotspot) => {
        const allDone = await dispatch(gamestateActions.handleHotspot({
          hotspot,
          top,
          left,
        }));
        return allDone;
      });

      await someSeries(clickableHotspots, async (hotspot) => {
        const allDone = await dispatch(gamestateActions.handleHotspot({
          hotspot,
          top,
          left,
        }));
        return allDone;
      });

      await someSeries(mouseDragHotspots, async (hotspot) => {
        const allDone = await dispatch(gamestateActions.handleHotspot({
          top,
          left,
          hotspot,
        }));
        return allDone;
      });

      await someSeries(mouseDownHotspots, async (hotspot) => {
        const allDone = await dispatch(gamestateActions.handleHotspot({
          hotspot,
          top,
          left,
        }));
        return allDone;
      });

      await forEachSeries(mouseNoneHotspots, async (hotspot) => {
        const allDone = await dispatch(gamestateActions.handleHotspot({
          hotspot,
          top,
          left,
        }));
        return allDone;
      });

      let cursor;
      for (let i = 0; i < nowActiveHotspots.length; i++) {
        const hotspot = nowActiveHotspots[i];

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
        } else if (hotspot.cursorShapeWhenActive !== 0) {
          cursor = hotspot.cursorShapeWhenActive;
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
