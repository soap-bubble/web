import {
  xor,
  intersection,
} from 'lodash';
import {
  actions as gameActions,
} from 'morpheus/game';
import {
  isActive,
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
} from 'utils/asyncIteration';
import {
  gesture,
  actionType,
  hotspotRectMatchesPosition,
} from 'morpheus/hotspot/matchers';
import {
  CURSOR_IDS,
} from 'morpheus/game/cursors';

const isDebug = process.env.NODE_ENV !== 'production';
const logger = loggerFactory('input:handlers');

const isHotspotActive = ({ hotspot, gamestates }) => isActive({
  cast: hotspot,
  gamestates,
});

export function resolveCursor({
  hotspots,
  currentPosition,
  startingPosition,
  isMouseDown,
}) {
  return (dispatch, getState) => {
    let cursor;
    for (let i = 0; i < hotspots.length; i++) {
      const hotspot = hotspots[i];
      if (isHotspotActive({
        hotspot,
        gamestates: gamestateSelectors.forState(getState()),
      })) {
        if (hotspotRectMatchesPosition(currentPosition)(hotspot)
          && actionType.isChangeCursor(hotspot)) {
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
        } else if (hotspot.cursorShapeWhenActive === CURSOR_IDS.HAND
          && or(
            hotspotRectMatchesPosition(currentPosition),
            and(
              hotspotRectMatchesPosition(startingPosition),
              or(gesture.isMouseClick, gesture.isMouseUp, gesture.isMouseDown),
              or(
                actionType.isRotate,
                actionType.isHorizSlider,
                actionType.isVertSlider,
                actionType.isTwoAxisSlider,
              ),
          ),
          )(hotspot)
        ) {
          if (hotspot.type >= 5 && hotspot.type <= 8) {
            if (isMouseDown) {
              cursor = CURSOR_IDS.CLOSED;
            } else if (!isMouseDown) {
              cursor = CURSOR_IDS.OPEN;
            }
          } else {
            cursor = CURSOR_IDS.HAND;
          }
          break;
        } else if (hotspot.cursorShapeWhenActive !== 0
          && hotspotRectMatchesPosition(currentPosition)(hotspot)) {
          cursor = hotspot.cursorShapeWhenActive;
          break;
        }
      }
    }

    if (!cursor) {
      cursor = CURSOR_IDS.WHEEL;
    }
    return cursor;
  };
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
    isClick,
    isMouseDown,
    wasMouseMoved,
    wasMouseUpped,
    wasMouseDowned,
    handleHotspot,
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
          .filter(
            and(
              hotspotRectMatchesPosition(startingPosition),
              gesture.isMouseUp,
            ),
          );

        if (isClick) {
          clickableHotspots = nowInHotspots
            .filter(
              and(
                hotspotRectMatchesPosition(startingPosition),
                gesture.isMouseClick,
              ),
            );
        }
      }

      if (wasMouseMoved && isMouseDown) {
        mouseDragHotspots = hotspots
          .filter(
            and(
              hotspotRectMatchesPosition(startingPosition),
              or(gesture.isMouseClick, gesture.isMouseUp, gesture.isMouseDown),
              or(
                actionType.isRotate,
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

        nowInHotspots.filter(
          or(
            actionType.isRotate,
            actionType.isHorizSlider,
            actionType.isVertSlider,
            actionType.isTwoAxisSlider,
          ),
        ).forEach((hotspot) => {
          const { param1 } = hotspot;
          const gamestate = gamestateSelectors.forState(getState()).byId(param1);
          if (gamestate) {
            hotspot.oldValue = gamestate.value;
          }
        });
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
          currentPosition,
          startingPosition,
          nowInHotspots,
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

      await someSeries(alwaysExecuteHotspots, async (hotspot) => {
        if (isHotspotActive({
          hotspot,
          gamestates: gamestateSelectors.forState(getState()),
        })) {
          const allDone = await dispatch(handleHotspot({
            hotspot,
            currentPosition,
            startingPosition,
          }));
          return allDone;
        }
      });

      await forEachSeries(mouseLeavingHotspots, async (hotspot) => {
        if (isHotspotActive({
          hotspot,
          gamestates: gamestateSelectors.forState(getState()),
        })) {
          await dispatch(handleHotspot({
            hotspot,
            currentPosition,
            startingPosition,
          }));
        }
      });

      await forEachSeries(mouseEnteringHotspots, async (hotspot) => {
        if (isHotspotActive({
          hotspot,
          gamestates: gamestateSelectors.forState(getState()),
        })) {
          await dispatch(handleHotspot({
            hotspot,
            currentPosition,
            startingPosition,
          }));
        }
      });

      await someSeries(mouseUpHotspots, async (hotspot) => {
        if (isHotspotActive({
          hotspot,
          gamestates: gamestateSelectors.forState(getState()),
        })) {
          const allDone = await dispatch(handleHotspot({
            hotspot,
            currentPosition,
            startingPosition,
          }));
          return allDone;
        }
        return null;
      });

      await someSeries(clickableHotspots, async (hotspot) => {
        if (isHotspotActive({
          hotspot,
          gamestates: gamestateSelectors.forState(getState()),
        })) {
          const allDone = await dispatch(handleHotspot({
            hotspot,
            currentPosition,
            startingPosition,
          }));
          return allDone;
        }
        return null;
      });

      await someSeries(mouseDragHotspots, async (hotspot) => {
        if (isHotspotActive({
          hotspot,
          gamestates: gamestateSelectors.forState(getState()),
        })) {
          const allDone = await dispatch(handleHotspot({
            hotspot,
            currentPosition,
            startingPosition,
          }));
          return allDone;
        }
        return null;
      });

      await someSeries(mouseDownHotspots, async (hotspot) => {
        if (isHotspotActive({
          hotspot,
          gamestates: gamestateSelectors.forState(getState()),
        })) {
          const allDone = await dispatch(handleHotspot({
            hotspot,
            currentPosition,
            startingPosition,
          }));
          return allDone;
        }
        return null;
      });

      await forEachSeries(mouseNoneHotspots, async (hotspot) => {
        if (isHotspotActive({
          hotspot,
          gamestates: gamestateSelectors.forState(getState()),
        })) {
          await dispatch(handleHotspot({
            hotspot,
            currentPosition,
            startingPosition,
          }));
        }
      });

      const cursor = dispatch(resolveCursor({
        hotspots,
        currentPosition,
        startingPosition,
        isMouseDown,
      }));
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
