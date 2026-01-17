import { xor } from 'lodash';
import { isActive } from '@soapbubble/morpheus-client';
import type { Hotspot } from 'morpheus/casts/types';
import { CURSOR_IDS } from 'morpheus/game/cursors';

import { and, or } from '@/utils/matchers';
import { forEachSeries, someSeries } from '@/utils/asyncIteration';
import isDebug from '@/utils/isDebug';

import { actionType, gesture, hotspotRectMatchesPosition } from './matchers';
import type { HotspotActionResult } from './handleHotspotAction';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';

const isHotspotActive = (params: {
  hotspot: Hotspot;
  gamestates: GamestatesAccessor;
}) =>
  isActive({
    cast: params.hotspot,
    gamestates: params.gamestates,
  });

export function resolveCursor(
  hotspots: Hotspot[],
  gamestates: GamestatesAccessor,
  currentPosition: { top: number; left: number },
  startingPosition: { top: number; left: number },
  isMouseDown: boolean,
) {
  let cursor: number | undefined;
  for (let i = 0; i < hotspots.length; i += 1) {
    const hotspot = hotspots[i];
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
        const { param1, param2 } = hotspot;
        if (param1) {
          const gamestate = gamestates.byId(param1);
          cursor = gamestate.value + param2;
          break;
        }
      } else if (
        hotspot.cursorShapeWhenActive === CURSOR_IDS.HAND &&
        or(
          hotspotRectMatchesPosition(currentPosition),
          // Only consider starting position when mouse is down (actively dragging)
          and(
            () => isMouseDown,
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
          cursor = isMouseDown ? CURSOR_IDS.CLOSED : CURSOR_IDS.OPEN;
        } else {
          cursor = CURSOR_IDS.HAND;
        }
        break;
      } else if (
        hotspot.cursorShapeWhenActive !== 0 &&
        hotspotRectMatchesPosition(currentPosition)(hotspot)
      ) {
        cursor = hotspot.cursorShapeWhenActive;
        break;
      }
    }
  }

  if (!cursor) {
    cursor = CURSOR_IDS.WHEEL;
  }
  return cursor;
}

export interface EventOption {
  currentPosition: {
    top: number;
    left: number;
  };
  startingPosition: {
    top: number;
    left: number;
  };
  hotspots: Hotspot[];
  nowInHotspots: Hotspot[];
  leavingHotspots: Hotspot[];
  enteringHotspots: Hotspot[];
  noInteractionHotspots: Hotspot[];
  isClick: boolean;
  isMouseDown: boolean;
  wasMouseMoved: boolean;
  wasMouseUpped: boolean;
  wasMouseDowned: boolean;
  gamestates: GamestatesAccessor;
  handleHotspot: (params: {
    hotspot: Hotspot;
    currentPosition: { top: number; left: number };
    startingPosition: { top: number; left: number };
    isMouseDown: boolean;
  }) => Promise<HotspotActionResult>;
}

export type HandleEventResult = {
  gamestateUpdates: Array<{ stateId: number; value: number }>;
  sceneTransition?: { sceneId: number; dissolve: boolean; startAngle?: number };
};

type HandleEventFn = ((options: EventOption) => Promise<HandleEventResult>) & {
  alwaysExecuteHotspots: Hotspot[];
  mouseLeavingHotspots: Hotspot[];
  mouseEnteringHotspots: Hotspot[];
  mouseUpHotspots: Hotspot[];
  mouseDownHotspots: Hotspot[];
  mouseDragHotspots: Hotspot[];
  clickableHotspots: Hotspot[];
  mouseNoneHotspots: Hotspot[];
  lastCursor: number | null;
  lastWasMouseUpped?: boolean;
  lastWasMouseMoved?: boolean;
  lastWasMouseDowned?: boolean;
};

export const handleEventFactory = (): HandleEventFn => {
  const self: HandleEventFn = (async ({
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
    gamestates,
  }: EventOption): Promise<HandleEventResult> => {
    let alwaysExecuteHotspots: Hotspot[] = [];
    let mouseLeavingHotspots: Hotspot[] = [];
    let mouseEnteringHotspots: Hotspot[] = [];
    let mouseUpHotspots: Hotspot[] = [];
    let mouseDownHotspots: Hotspot[] = [];
    let mouseDragHotspots: Hotspot[] = [];
    let clickableHotspots: Hotspot[] = [];
    let mouseNoneHotspots: Hotspot[] = [];

    alwaysExecuteHotspots = hotspots
      .filter(gesture.isAlways)
      .filter((h) => h.castId === 0);

    if (wasMouseMoved) {
      mouseLeavingHotspots = leavingHotspots.filter(gesture.isMouseLeave);
      mouseEnteringHotspots = enteringHotspots.filter(gesture.isMouseEnter);
    }

    if (wasMouseUpped) {
      mouseUpHotspots = nowInHotspots.filter(
        and(hotspotRectMatchesPosition(startingPosition), gesture.isMouseUp),
      );

      if (isClick) {
        clickableHotspots = nowInHotspots.filter(
          and(
            hotspotRectMatchesPosition(startingPosition),
            gesture.isMouseClick,
          ),
        );
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
            actionType.isTwoAxisSlider,
          ),
        ),
      );
    }

    if (wasMouseDowned) {
      mouseDownHotspots = nowInHotspots.filter(gesture.isMouseDown);

      nowInHotspots
        .filter(
          or(
            actionType.isRotate,
            actionType.isHorizSlider,
            actionType.isVertSlider,
            actionType.isTwoAxisSlider,
          ),
        )
        .forEach((hotspot) => {
          const { param1 } = hotspot;
          const gamestate = gamestates.byId(param1);
          const mutableHotspot = hotspot as Hotspot & { oldValue?: number };
          mutableHotspot.oldValue = gamestate.value;
        });
    }

    mouseNoneHotspots = noInteractionHotspots.filter(gesture.isMouseNone);

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
      // Intentionally no-op (kept for parity with legacy debug checks).
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

    const result: HandleEventResult = {
      gamestateUpdates: [],
    };

    const handleIfActive = () => async (hotspot: Hotspot) => {
      let allDone = false;
      if (isHotspotActive({ hotspot, gamestates })) {
        const actionResult = await handleHotspot({
          hotspot,
          currentPosition,
          startingPosition,
          isMouseDown,
        });
        if (actionResult.sceneTransition) {
          result.sceneTransition = actionResult.sceneTransition;
        }
        if (actionResult.gamestateUpdates.length) {
          result.gamestateUpdates.push(...actionResult.gamestateUpdates);
        }
        allDone = actionResult.allDone;
      }
      return allDone;
    };

    await forEachSeries(mouseLeavingHotspots, handleIfActive());
    await forEachSeries(mouseEnteringHotspots, handleIfActive());
    await someSeries(mouseUpHotspots, handleIfActive());
    await someSeries(clickableHotspots, handleIfActive());
    await someSeries(mouseDragHotspots, handleIfActive());
    await someSeries(alwaysExecuteHotspots, handleIfActive());
    await someSeries(mouseDownHotspots, handleIfActive());
    await forEachSeries(mouseNoneHotspots, handleIfActive());

    return result;
  }) as HandleEventFn;

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
};
