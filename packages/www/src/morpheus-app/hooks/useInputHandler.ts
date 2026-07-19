import {
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Raycaster, Object3D, Camera, Vector2 } from 'three';
import type { Hotspot, Scene } from 'morpheus/casts/types';
import type { SceneTransitionRequest } from 'morpheus/scene/types';
import { DST_RATIO, DST_WIDTH } from 'morpheus/constants';

import {
  useAppDispatch,
  useAppSelector,
  useAppStore,
} from '@/morpheus-app/store/hooks';
import {
  replaceGamestateValues,
  selectGamestatesAccessor,
  updateGamestate,
} from '@/morpheus-app/store/slices/gamestateSlice';
import type { GamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import type { RootState } from '@/morpheus-app/store/store';
import { setRotation } from '@/morpheus-app/store/slices/rotationSlice';
import { selectRotation } from '@/morpheus-app/store/slices/rotationSlice';
import {
  handleHotspotAction,
  type HotspotActionResult,
} from '@/morpheus-app/hotspot/handleHotspotAction';
import {
  resolveAlwaysHotspotActions,
  resolveSceneEntryHotspotActions,
} from '@/morpheus-app/hotspot/alwaysHotspots';
import { handleSliderDrag } from '@/morpheus-app/hotspot/handleSliderDrag';
import {
  getActiveHotspots,
  getHotspotCandidates,
  withGamestateUpdates,
} from '@/morpheus-app/hotspot/hotspotEligibility';
import {
  executeHarnessHotspotClick,
  type HarnessClickResult,
} from '@/morpheus-app/hotspot/harnessClick';
import { resolveCursor } from '@/morpheus-app/hotspot/handlers';
import {
  gesture,
  hotspotRectMatchesPosition,
  actionType,
} from '@/morpheus-app/hotspot/matchers';
import { or } from '@/utils/matchers';
import type { ClickHotspotMatchedHotspot } from '@/lib/game-control-protocol';

const ORIGINAL_HEIGHT = 400;
const ORIGINAL_WIDTH = 640;
const CLICK_THRESHOLD_MS = 800;
const CLICK_DISTANCE_THRESHOLD = 10; // Max pixels moved for interaction to be considered a click
const SWEEP_MIN_DURATION_MS = 150;

type Rotation = { yaw3600: number; pitch: number };

interface CursorState {
  top: number;
  left: number;
  image: HTMLImageElement | undefined;
}

interface PointerHandlers {
  onPointerUp: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerLeave: (e: PointerEvent<HTMLCanvasElement>) => void;
}

export type HarnessClickHandler = (
  hotspot: ClickHotspotMatchedHotspot,
) => HarnessClickResult;

export type InputController = {
  cancelGesture: () => boolean;
};

type InputReturn = [
  CursorState,
  PointerHandlers,
  HarnessClickHandler,
  InputController,
];

const cursorCache = new Map<number, Promise<HTMLImageElement | null>>();

function loadCursorImage(cursorId: number): Promise<HTMLImageElement | null> {
  if (cursorId === 0) {
    return Promise.resolve(null);
  }

  const cached = cursorCache.get(cursorId);
  if (cached) {
    return cached;
  }

  const cursorFiles: Record<number, string> = {
    10001: 'Bigarrow.png',
    10011: 'Card.png',
    10008: 'Open.png',
    10009: 'Closed.png',
    10000: 'Wheel.png',
    10002: 'Hand.png',
    10003: 'Tele.png',
    10005: 'Goback.png',
    10007: 'Down.png',
    10010: 'Tapest.png',
    10004: 'Micro.png',
    10012: 'Cur10012.png',
    10013: 'Cur10013.png',
    10014: 'Cur10014.png',
    10015: 'Cur10015.png',
    10016: 'Cur10016.png',
    10017: 'cur10017.png',
    10018: 'cur10018.png',
    10019: 'cur10019.png',
    10020: 'cur10020.png',
    10021: 'cur10021.png',
    10022: 'cur10022.png',
    10023: 'cur10023.png',
    10024: 'cur10024.png',
  };

  const fileName = cursorFiles[cursorId];
  if (!fileName) {
    return Promise.resolve(null);
  }

  const url = `/image/cursors/${fileName}`;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });

  cursorCache.set(cursorId, promise);
  return promise;
}

function screenToGameCoords(params: {
  top: number;
  left: number;
  height: number;
  width: number;
}): { top: number; left: number } {
  const { top, left, height, width } = params;
  return {
    top: top / (height / ORIGINAL_HEIGHT),
    left: left / (width / ORIGINAL_WIDTH),
  };
}

export interface PointerState {
  screenX: number;
  screenY: number;
  isDown: boolean;
  downTime: number;
  startScreenX: number;
  startScreenY: number;
  startGameX: number;
  startGameY: number;
}

export function finishPointerInteraction(pointer: PointerState): PointerState {
  return {
    ...pointer,
    isDown: false,
    startScreenX: 0,
    startScreenY: 0,
    startGameX: 0,
    startGameY: 0,
  };
}

export function resolvePointerSuppression(
  suppressedPointerId: number | null,
  pointerId: number,
  event: 'down' | 'move' | 'up' | 'cancel',
): { shouldIgnore: boolean; suppressedPointerId: number | null } {
  if (suppressedPointerId === null) {
    return { shouldIgnore: false, suppressedPointerId: null };
  }

  if (pointerId === suppressedPointerId && event === 'down') {
    // A pointer cannot emit another down until its prior press has ended. This
    // also recovers when the release happened outside the canvas.
    return { shouldIgnore: false, suppressedPointerId: null };
  }

  if (
    pointerId === suppressedPointerId &&
    (event === 'up' || event === 'cancel')
  ) {
    return { shouldIgnore: true, suppressedPointerId: null };
  }

  return { shouldIgnore: true, suppressedPointerId };
}

export function createLiveGamestatesReader(
  getState: () => RootState,
): () => GamestatesAccessor {
  return () => selectGamestatesAccessor(getState());
}

export function isPointerDragHotspot(hotspot: Hotspot): boolean {
  if (
    or(
      actionType.isHorizSlider,
      actionType.isVertSlider,
      actionType.isTwoAxisSlider,
    )(hotspot)
  ) {
    return true;
  }

  return (
    actionType.isRotate(hotspot) &&
    or(
      gesture.isMouseClick,
      gesture.isMouseUp,
      gesture.isMouseDown,
    )(hotspot)
  );
}

export function isDirectPointerActionHotspot(hotspot: Hotspot): boolean {
  return !or(
    actionType.isRotate,
    actionType.isHorizSlider,
    actionType.isVertSlider,
    actionType.isTwoAxisSlider,
  )(hotspot);
}

export function useInputHandler(params: {
  scene: Scene;
  gamestates: GamestatesAccessor;
  isPanoScene: boolean;
  camera: Camera | undefined;
  panoObject: Object3D | undefined;
  offsetX: number;
  screenLeft: number;
  screenTop: number;
  screenWidth: number;
  screenHeight: number;
  previousSceneId?: number;
  inputEnabled?: boolean;
  onTransition?: (transition: SceneTransitionRequest) => Promise<boolean>;
  onActionSettled?: () => void;
  skipSceneEntryGeneration?: number | null;
}): InputReturn {
  const {
    scene,
    gamestates,
    isPanoScene,
    camera,
    panoObject,
    offsetX,
    screenLeft,
    screenTop,
    screenWidth,
    screenHeight,
    previousSceneId,
    inputEnabled = true,
    onTransition,
    onActionSettled,
    skipSceneEntryGeneration = null,
  } = params;

  const dispatch = useAppDispatch();
  const appStore = useAppStore();
  const rotation = useAppSelector(selectRotation);
  const readLiveGamestates = useMemo(
    () => createLiveGamestatesReader(appStore.getState),
    [appStore],
  );

  // Keep callback inputs in refs so callbacks stay stable.
  const previousSceneIdRef = useRef(previousSceneId);
  const onTransitionRef = useRef(onTransition);
  const onActionSettledRef = useRef(onActionSettled);
  const inputEnabledRef = useRef(inputEnabled);
  useEffect(() => {
    previousSceneIdRef.current = previousSceneId;
  }, [previousSceneId]);
  useEffect(() => {
    onTransitionRef.current = onTransition;
  }, [onTransition]);
  useEffect(() => {
    onActionSettledRef.current = onActionSettled;
  }, [onActionSettled]);
  useEffect(() => {
    inputEnabledRef.current = inputEnabled;
  }, [inputEnabled]);

  const [cursor, setCursor] = useState<HTMLImageElement>();
  const [pointer, setPointer] = useState<PointerState>({
    screenX: screenLeft,
    screenY: screenTop,
    isDown: false,
    downTime: 0,
    startScreenX: 0,
    startScreenY: 0,
    startGameX: 0,
    startGameY: 0,
  });

  // Mirror pointer state in a ref for synchronous reads in event handlers
  const pointerRef = useRef(pointer);
  useEffect(() => {
    pointerRef.current = pointer;
  }, [pointer]);

  const rotationRef = useRef(rotation);
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // Raycaster for pano coordinate conversion
  const raycaster = useMemo(() => new Raycaster(), []);

  // Convert screen coords to game coords
  const gamePosition = useMemo(() => {
    const cursorTop = pointer.screenY - screenTop;
    const cursorLeft = pointer.screenX - screenLeft;

    if (isPanoScene && camera && panoObject && !document.hidden) {
      const y = ((screenHeight - cursorTop) / screenHeight) * 2 - 1;
      const x = ((cursorLeft - screenWidth) / screenWidth) * 2 + 1;

      raycaster.setFromCamera(new Vector2(x, y), camera);
      const panoIntersects = raycaster.intersectObject(panoObject);
      const panoIntersect = panoIntersects.find(
        (intersect) => intersect.uv !== undefined,
      );
      if (panoIntersect?.uv) {
        const { uv } = panoIntersect;
        const top = uv.y * -512 + 256;
        let left =
          (((8 / 7) * (1.0 - uv.x) - 0.5) * DST_WIDTH + offsetX) * DST_RATIO;
        if (left < 0) {
          left += 3600;
        } else if (left > 3600) {
          left -= 3600;
        }
        return { top, left };
      }
    }

    return screenToGameCoords({
      top: cursorTop,
      left: cursorLeft,
      height: screenHeight,
      width: screenWidth,
    });
  }, [
    pointer.screenX,
    pointer.screenY,
    screenTop,
    screenLeft,
    isPanoScene,
    camera,
    panoObject,
    offsetX,
    raycaster,
    screenWidth,
    screenHeight,
  ]);

  // Keep every hotspot as a candidate. Comparator state can change during a
  // pointer event, so filtering here would freeze eligibility until scene exit.
  const hotspots = useMemo(() => {
    return getHotspotCandidates(scene);
  }, [scene]);

  // Cursor index based on position and hotspots
  const cursorIndex = useMemo(() => {
    return resolveCursor(
      hotspots,
      gamestates,
      gamePosition,
      { top: pointer.startGameY, left: pointer.startGameX },
      pointer.isDown,
    );
  }, [
    hotspots,
    gamePosition,
    pointer.startGameX,
    pointer.startGameY,
    pointer.isDown,
    gamestates,
  ]);

  // Load cursor image when index changes
  useEffect(() => {
    if (cursorIndex !== 0) {
      loadCursorImage(cursorIndex).then((img) => {
        if (img) {
          setCursor(img);
        }
      });
    }
  }, [cursorIndex]);

  // Slider hotspots frequently share castId 0, so preserve drag origins by state ID.
  const sliderOldValuesRef = useRef<Map<number, number>>(new Map());
  const gestureStartValuesRef = useRef<Map<number, number>>(new Map());
  const gestureStartRotationRef = useRef<Rotation | null>(null);
  const stableActionChangedRef = useRef(false);
  const transitionPendingRef = useRef(false);
  const skippedSceneEntryGenerationRef = useRef<number | null>(null);
  const suppressedPointerIdRef = useRef<number | null>(null);
  const wasInHotspotsRef = useRef<Set<Hotspot>>(new Set());
  const capturedPointerRef = useRef<{
    target: HTMLCanvasElement;
    pointerId: number;
  } | null>(null);

  // Process a hotspot action and dispatch results
  const pendingTransitionRef = useRef<{
    transition: { sceneId: number; dissolve: boolean; startAngle?: number };
    targetRotation: Rotation;
    startRotation: Rotation;
    startedAt: number;
    durationMs: number;
  } | null>(null);
  const sweepRafRef = useRef<number | null>(null);

  const finishCurrentPointerInteraction = useCallback(
    (suppressUntilRelease = true) => {
      const captured = capturedPointerRef.current;
      if (suppressUntilRelease && pointerRef.current.isDown && captured) {
        suppressedPointerIdRef.current = captured.pointerId;
      }
      sliderOldValuesRef.current.clear();
      gestureStartValuesRef.current.clear();
      gestureStartRotationRef.current = null;

      if (captured && captured.target.hasPointerCapture(captured.pointerId)) {
        captured.target.releasePointerCapture(captured.pointerId);
      }
      capturedPointerRef.current = null;

      const finishedPointer = finishPointerInteraction(pointerRef.current);
      pointerRef.current = finishedPointer;
      setPointer(finishedPointer);
    },
    [],
  );

  const settleRejectedTransition = useCallback(() => {
    transitionPendingRef.current = false;
    if (stableActionChangedRef.current) {
      stableActionChangedRef.current = false;
      onActionSettledRef.current?.();
    }
  }, []);

  const requestTransition = useCallback(
    (transition: SceneTransitionRequest) => {
      const transitionHandler = onTransitionRef.current;
      if (!transitionHandler) {
        settleRejectedTransition();
        return;
      }
      void transitionHandler(transition)
        .then((accepted) => {
          if (!accepted) {
            settleRejectedTransition();
          }
        })
        .catch(settleRejectedTransition);
    },
    [settleRejectedTransition],
  );

  const normalizeYaw = useCallback((yaw: number) => {
    let next = yaw;
    while (next < 0) {
      next += 3600;
    }
    while (next >= 3600) {
      next -= 3600;
    }
    return next;
  }, []);

  const shortestYawDelta = useCallback((from: number, to: number) => {
    const raw = ((to - from + 5400) % 3600) - 1800;
    return raw;
  }, []);

  const startSweepTo = useCallback(
    (
      transition: { sceneId: number; dissolve: boolean; startAngle?: number },
      target: Rotation,
    ) => {
      const startRotation = rotationRef.current;
      const deltaYaw = shortestYawDelta(startRotation.yaw3600, target.yaw3600);
      const distanceRad = Math.abs(deltaYaw) * ((Math.PI * 2) / 3600);
      const durationMs = Math.max(
        SWEEP_MIN_DURATION_MS,
        Math.sqrt(distanceRad) * 1000,
      );

      pendingTransitionRef.current = {
        transition,
        targetRotation: target,
        startRotation,
        startedAt: performance.now(),
        durationMs,
      };

      if (sweepRafRef.current !== null) {
        cancelAnimationFrame(sweepRafRef.current);
      }
      const tick = (time: number) => {
        const sweep = pendingTransitionRef.current;
        if (!sweep) {
          sweepRafRef.current = null;
          return;
        }
        const elapsed = time - sweep.startedAt;
        const t = Math.min(1, elapsed / sweep.durationMs);
        const eased = t * (2 - t);
        const nextYaw =
          sweep.startRotation.yaw3600 +
          shortestYawDelta(
            sweep.startRotation.yaw3600,
            sweep.targetRotation.yaw3600,
          ) *
            eased;
        const nextPitch =
          sweep.startRotation.pitch +
          (sweep.targetRotation.pitch - sweep.startRotation.pitch) * eased;

        dispatch(
          setRotation({
            yaw3600: normalizeYaw(nextYaw),
            pitch: nextPitch,
          }),
        );

        if (t >= 1) {
          sweepRafRef.current = null;
          if (pendingTransitionRef.current) {
            const { transition: pending } = pendingTransitionRef.current;
            pendingTransitionRef.current = null;
            requestTransition(pending);
          }
          return;
        }
        sweepRafRef.current = requestAnimationFrame(tick);
      };
      sweepRafRef.current = requestAnimationFrame(tick);
    },
    [dispatch, normalizeYaw, requestTransition, shortestYawDelta],
  );

  const applyHotspotActionResult = useCallback(
    (result: HotspotActionResult) => {
      for (const update of result.gamestateUpdates) {
        if (
          pointerRef.current.isDown &&
          !gestureStartValuesRef.current.has(update.stateId)
        ) {
          gestureStartValuesRef.current.set(
            update.stateId,
            readLiveGamestates().byId(update.stateId).value,
          );
        }
        dispatch(updateGamestate(update));
      }
      if (result.gamestateUpdates.length > 0) {
        stableActionChangedRef.current = true;
      }

      if (result.sceneTransition) {
        // Scene changes must consume the gesture that triggered them. Otherwise
        // a held pointer can arrive over an overlapping slider in the next
        // scene and activate it without a new pointer-down event.
        finishCurrentPointerInteraction();
      }

      if (
        result.sceneTransition &&
        result.preTransitionRotation &&
        isPanoScene
      ) {
        transitionPendingRef.current = true;
        startSweepTo(result.sceneTransition, result.preTransitionRotation);
        return result.allDone;
      }

      if (result.sceneTransition && onTransitionRef.current) {
        transitionPendingRef.current = true;
        requestTransition(result.sceneTransition);
      }

      return result.allDone;
    },
    [
      dispatch,
      finishCurrentPointerInteraction,
      isPanoScene,
      readLiveGamestates,
      requestTransition,
      startSweepTo,
    ],
  );

  const settlePendingAction = useCallback(() => {
    if (stableActionChangedRef.current && !transitionPendingRef.current) {
      stableActionChangedRef.current = false;
      onActionSettledRef.current?.();
    }
  }, []);

  const resolveHotspotAction = useCallback(
    (
      hotspot: Hotspot,
      currentPosition: { top: number; left: number },
      startingPosition: { top: number; left: number },
      eventGamestates: GamestatesAccessor = readLiveGamestates(),
    ) => {
      const oldValue = sliderOldValuesRef.current.get(hotspot.param1);
      return handleHotspotAction({
        hotspot,
        gamestates: eventGamestates,
        currentPosition,
        startingPosition,
        previousSceneId: previousSceneIdRef.current,
        isPanoScene,
        oldValue,
      });
    },
    [isPanoScene, readLiveGamestates],
  );

  const processHotspotAction = useCallback(
    (
      hotspot: Hotspot,
      currentPosition: { top: number; left: number },
      startingPosition: { top: number; left: number },
      eventGamestates: GamestatesAccessor = readLiveGamestates(),
    ) =>
      applyHotspotActionResult(
        resolveHotspotAction(
          hotspot,
          currentPosition,
          startingPosition,
          eventGamestates,
        ),
      ),
    [applyHotspotActionResult, resolveHotspotAction],
  );

  const clickHotspot = useCallback(
    (hotspot: ClickHotspotMatchedHotspot) => {
      const result = executeHarnessHotspotClick({
        scene,
        gamestates: readLiveGamestates(),
        hotspot,
        previousSceneId: previousSceneIdRef.current,
        isPanoScene,
      });

      if (result.outcome === 'applied') {
        applyHotspotActionResult(result.actionResult);
        settlePendingAction();
      }

      return result;
    },
    [
      applyHotspotActionResult,
      isPanoScene,
      readLiveGamestates,
      scene,
      settlePendingAction,
    ],
  );

  // Reset pointer state on scene change
  const sceneIdRef = useRef(scene.sceneId);
  useEffect(() => {
    if (sceneIdRef.current !== scene.sceneId) {
      sceneIdRef.current = scene.sceneId;
      finishCurrentPointerInteraction();
      pendingTransitionRef.current = null;
      transitionPendingRef.current = false;
      stableActionChangedRef.current = false;
      wasInHotspotsRef.current.clear();
      if (sweepRafRef.current !== null) {
        cancelAnimationFrame(sweepRafRef.current);
        sweepRafRef.current = null;
      }
      const resetPointer = {
        screenX: screenLeft,
        screenY: screenTop,
        isDown: false,
        downTime: 0,
        startScreenX: 0,
        startScreenY: 0,
        startGameX: 0,
        startGameY: 0,
      };
      pointerRef.current = resetPointer;
      setPointer(resetPointer);
    }
  }, [finishCurrentPointerInteraction, scene.sceneId, screenLeft, screenTop]);

  // Run entry rules for new scenes; replay Always settlement after a restore.
  const processedSceneIdRef = useRef<number | null>(null);
  useEffect(() => {
    const shouldSkipSceneEntry =
      skipSceneEntryGeneration !== null &&
      skippedSceneEntryGenerationRef.current !== skipSceneEntryGeneration;

    const isNewScene = processedSceneIdRef.current !== scene.sceneId;
    if (!isNewScene && !shouldSkipSceneEntry) {
      return;
    }
    processedSceneIdRef.current = scene.sceneId;

    if (shouldSkipSceneEntry) {
      skippedSceneEntryGenerationRef.current = skipSceneEntryGeneration;
    }

    const results = resolveSceneEntryHotspotActions({
      hotspots,
      gamestates: readLiveGamestates(),
      skipSceneEnter: shouldSkipSceneEntry,
      execute: (hotspot, currentGamestates) =>
        resolveHotspotAction(
          hotspot,
          { top: 0, left: 0 },
          { top: 0, left: 0 },
          currentGamestates,
        ),
    });
    for (const result of results) {
      applyHotspotActionResult(result);
    }
    settlePendingAction();
  }, [
    applyHotspotActionResult,
    scene.sceneId,
    hotspots,
    resolveHotspotAction,
    readLiveGamestates,
    settlePendingAction,
    skipSceneEntryGeneration,
  ]);

  // Process pointer events - called from handlers
  const processPointerEvent = useCallback(
    (opts: {
      gamePos: { top: number; left: number };
      startPos: { top: number; left: number };
      isDown: boolean;
      wasDown: boolean;
      wasMoved: boolean;
      wasUpped: boolean;
    }) => {
      const { gamePos, startPos, isDown, wasDown, wasMoved, wasUpped } = opts;
      const gs = readLiveGamestates();
      let eventGamestates = gs;
      const activeHotspots = getActiveHotspots(hotspots, eventGamestates);

      // Determine which hotspots the pointer is currently in
      const nowInHotspots = new Set<Hotspot>();
      for (const hotspot of activeHotspots) {
        if (hotspotRectMatchesPosition(gamePos)(hotspot)) {
          nowInHotspots.add(hotspot);
        }
      }

      // Compute entering/leaving
      const wasIn = wasInHotspotsRef.current;
      const enteringHotspots = new Set<Hotspot>();
      const leavingHotspots = new Set<Hotspot>();

      for (const hotspot of nowInHotspots) {
        if (!wasIn.has(hotspot)) {
          enteringHotspots.add(hotspot);
        }
      }
      for (const hotspot of wasIn) {
        if (!nowInHotspots.has(hotspot)) {
          leavingHotspots.add(hotspot);
        }
      }

      wasInHotspotsRef.current = nowInHotspots;

      // Process mouse leave hotspots
      if (wasMoved && leavingHotspots.size > 0) {
        for (const hotspot of activeHotspots) {
          if (
            leavingHotspots.has(hotspot) &&
            gesture.isMouseLeave(hotspot) &&
            isDirectPointerActionHotspot(hotspot)
          ) {
            processHotspotAction(hotspot, gamePos, startPos);
          }
        }
      }

      // Process mouse enter hotspots
      if (wasMoved && enteringHotspots.size > 0) {
        for (const hotspot of activeHotspots) {
          if (
            enteringHotspots.has(hotspot) &&
            gesture.isMouseEnter(hotspot) &&
            isDirectPointerActionHotspot(hotspot)
          ) {
            processHotspotAction(hotspot, gamePos, startPos);
          }
        }
      }

      // Process mouse up hotspots
      // Note: Click detection is handled in onPointerUp which has access to downTime
      if (wasUpped) {
        for (const hotspot of activeHotspots) {
          if (
            nowInHotspots.has(hotspot) &&
            hotspotRectMatchesPosition(startPos)(hotspot) &&
            gesture.isMouseUp(hotspot) &&
            isDirectPointerActionHotspot(hotspot)
          ) {
            if (processHotspotAction(hotspot, gamePos, startPos)) {
              break;
            }
          }
        }
      }

      // Process drag hotspots (mouse moved while down)
      if (wasMoved && isDown) {
        const sliderHotspots: Hotspot[] = [];
        const rotateHotspots: Hotspot[] = [];
        for (const hotspot of activeHotspots) {
          if (
            !hotspotRectMatchesPosition(startPos)(hotspot) ||
            !isPointerDragHotspot(hotspot)
          ) {
            continue;
          }

          if (
            or(
              actionType.isHorizSlider,
              actionType.isVertSlider,
              actionType.isTwoAxisSlider,
            )(hotspot)
          ) {
            sliderHotspots.push(hotspot);
          } else if (actionType.isRotate(hotspot)) {
            rotateHotspots.push(hotspot);
          }
        }

        if (sliderHotspots.length > 0) {
          const gamestateUpdates = handleSliderDrag({
            hotspots: sliderHotspots,
            gamestates: eventGamestates,
            currentPosition: gamePos,
            startingPosition: startPos,
            oldValues: sliderOldValuesRef.current,
            isPanoScene,
          });
          eventGamestates = withGamestateUpdates(
            eventGamestates,
            gamestateUpdates,
          );
          applyHotspotActionResult({ gamestateUpdates, allDone: false });
        }

        for (const hotspot of rotateHotspots) {
          processHotspotAction(hotspot, gamePos, startPos);
        }
      }

      // Process mouse down hotspots
      if (wasDown) {
        for (const hotspot of activeHotspots) {
          if (
            nowInHotspots.has(hotspot) &&
            gesture.isMouseDown(hotspot) &&
            isDirectPointerActionHotspot(hotspot)
          ) {
            if (processHotspotAction(hotspot, gamePos, startPos)) {
              break;
            }
          }
        }

        // Store oldValue for slider hotspots in the ref (not on the frozen hotspot object)
        for (const hotspot of activeHotspots) {
          if (
            nowInHotspots.has(hotspot) &&
            or(
              actionType.isRotate,
              actionType.isHorizSlider,
              actionType.isVertSlider,
              actionType.isTwoAxisSlider,
            )(hotspot)
          ) {
            const gsState = gs.byId(hotspot.param1);
            if (gsState) {
              sliderOldValuesRef.current.set(hotspot.param1, gsState.value);
            }
          }
        }
      }

      // Process "Always" hotspots with castId === 0 on every event
      // This is how the original game triggers scene changes based on gamestate
      const alwaysResults = resolveAlwaysHotspotActions({
        hotspots,
        gamestates: eventGamestates,
        execute: (hotspot, currentGamestates) =>
          resolveHotspotAction(
            hotspot,
            gamePos,
            startPos,
            currentGamestates,
          ),
      });
      for (const result of alwaysResults) {
        applyHotspotActionResult(result);
      }
    },
    [
      applyHotspotActionResult,
      hotspots,
      isPanoScene,
      processHotspotAction,
      readLiveGamestates,
      resolveHotspotAction,
    ],
  );

  // Pointer handlers
  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const suppression = resolvePointerSuppression(
        suppressedPointerIdRef.current,
        event.pointerId,
        'down',
      );
      suppressedPointerIdRef.current = suppression.suppressedPointerId;
      if (suppression.shouldIgnore) return;
      if (!inputEnabledRef.current) return;
      const { clientX, clientY } = event;

      // Compute game position immediately for startPos
      const cursorTop = clientY - screenTop;
      const cursorLeft = clientX - screenLeft;
      let startGamePos = screenToGameCoords({
        top: cursorTop,
        left: cursorLeft,
        height: screenHeight,
        width: screenWidth,
      });

      if (isPanoScene && camera && panoObject && !document.hidden) {
        const y = ((screenHeight - cursorTop) / screenHeight) * 2 - 1;
        const x = ((cursorLeft - screenWidth) / screenWidth) * 2 + 1;
        raycaster.setFromCamera(new Vector2(x, y), camera);
        const panoIntersects = raycaster.intersectObject(panoObject);
        const panoIntersect = panoIntersects.find((i) => i.uv !== undefined);
        if (panoIntersect?.uv) {
          const { uv } = panoIntersect;
          const top = uv.y * -512 + 256;
          let left =
            (((8 / 7) * (1.0 - uv.x) - 0.5) * DST_WIDTH + offsetX) * DST_RATIO;
          if (left < 0) left += 3600;
          else if (left > 3600) left -= 3600;
          startGamePos = { top, left };
        }
      }

      const now = Date.now();
      const newPointerState = {
        screenX: clientX,
        screenY: clientY,
        isDown: true,
        downTime: now,
        startScreenX: clientX,
        startScreenY: clientY,
        startGameX: startGamePos.left,
        startGameY: startGamePos.top,
      };
      // Update ref synchronously so subsequent events see correct state
      pointerRef.current = newPointerState;
      setPointer(newPointerState);
      gestureStartRotationRef.current = { ...rotationRef.current };
      gestureStartValuesRef.current.clear();
      capturedPointerRef.current = {
        target: event.currentTarget,
        pointerId: event.pointerId,
      };
      event.currentTarget.setPointerCapture(event.pointerId);

      processPointerEvent({
        gamePos: startGamePos,
        startPos: startGamePos,
        isDown: true,
        wasDown: true,
        wasMoved: false,
        wasUpped: false,
      });
      settlePendingAction();
    },
    [
      screenTop,
      screenLeft,
      screenHeight,
      screenWidth,
      isPanoScene,
      camera,
      panoObject,
      offsetX,
      raycaster,
      processPointerEvent,
      settlePendingAction,
    ],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const suppression = resolvePointerSuppression(
        suppressedPointerIdRef.current,
        event.pointerId,
        'move',
      );
      suppressedPointerIdRef.current = suppression.suppressedPointerId;
      if (suppression.shouldIgnore) return;
      if (!inputEnabledRef.current) return;
      const { clientX, clientY } = event;
      const prev = pointerRef.current;

      // Skip if position unchanged
      if (prev.screenX === clientX && prev.screenY === clientY) {
        return;
      }

      // Update ref synchronously and state
      const newPointerState = {
        ...prev,
        screenX: clientX,
        screenY: clientY,
      };
      pointerRef.current = newPointerState;
      setPointer(newPointerState);

      // Compute current game position
      const cursorTop = clientY - screenTop;
      const cursorLeft = clientX - screenLeft;
      let currentGamePos = screenToGameCoords({
        top: cursorTop,
        left: cursorLeft,
        height: screenHeight,
        width: screenWidth,
      });

      if (isPanoScene && camera && panoObject && !document.hidden) {
        const y = ((screenHeight - cursorTop) / screenHeight) * 2 - 1;
        const x = ((cursorLeft - screenWidth) / screenWidth) * 2 + 1;
        raycaster.setFromCamera(new Vector2(x, y), camera);
        const panoIntersects = raycaster.intersectObject(panoObject);
        const panoIntersect = panoIntersects.find((i) => i.uv !== undefined);
        if (panoIntersect?.uv) {
          const { uv } = panoIntersect;
          const top = uv.y * -512 + 256;
          let left =
            (((8 / 7) * (1.0 - uv.x) - 0.5) * DST_WIDTH + offsetX) * DST_RATIO;
          if (left < 0) left += 3600;
          else if (left > 3600) left -= 3600;
          currentGamePos = { top, left };
        }
      }

      // Process event (side effect, outside state updater)
      processPointerEvent({
        gamePos: currentGamePos,
        startPos: { top: prev.startGameY, left: prev.startGameX },
        isDown: prev.isDown,
        wasDown: false,
        wasMoved: true,
        wasUpped: false,
      });
      if (!prev.isDown) {
        settlePendingAction();
      }
    },
    [
      screenTop,
      screenLeft,
      screenHeight,
      screenWidth,
      isPanoScene,
      camera,
      panoObject,
      offsetX,
      raycaster,
      processPointerEvent,
      settlePendingAction,
    ],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const suppression = resolvePointerSuppression(
        suppressedPointerIdRef.current,
        event.pointerId,
        'up',
      );
      suppressedPointerIdRef.current = suppression.suppressedPointerId;
      if (suppression.shouldIgnore) return;
      if (!inputEnabledRef.current) return;
      const { clientX, clientY } = event;
      const prev = pointerRef.current;

      // Compute current game position
      const cursorTop = clientY - screenTop;
      const cursorLeft = clientX - screenLeft;
      let currentGamePos = screenToGameCoords({
        top: cursorTop,
        left: cursorLeft,
        height: screenHeight,
        width: screenWidth,
      });

      if (isPanoScene && camera && panoObject && !document.hidden) {
        const y = ((screenHeight - cursorTop) / screenHeight) * 2 - 1;
        const x = ((cursorLeft - screenWidth) / screenWidth) * 2 + 1;
        raycaster.setFromCamera(new Vector2(x, y), camera);
        const panoIntersects = raycaster.intersectObject(panoObject);
        const panoIntersect = panoIntersects.find((i) => i.uv !== undefined);
        if (panoIntersect?.uv) {
          const { uv } = panoIntersect;
          const top = uv.y * -512 + 256;
          let left =
            (((8 / 7) * (1.0 - uv.x) - 0.5) * DST_WIDTH + offsetX) * DST_RATIO;
          if (left < 0) left += 3600;
          else if (left > 3600) left -= 3600;
          currentGamePos = { top, left };
        }
      }

      const timeSinceDown = Date.now() - prev.downTime;
      const dx = clientX - prev.startScreenX;
      const dy = clientY - prev.startScreenY;
      const distanceMoved = Math.sqrt(dx * dx + dy * dy);
      const isClick =
        timeSinceDown < CLICK_THRESHOLD_MS &&
        distanceMoved < CLICK_DISTANCE_THRESHOLD;
      const startPos = { top: prev.startGameY, left: prev.startGameX };

      // Update ref synchronously and state - reset start positions so cursor doesn't match old drag start
      const newPointerState = {
        ...prev,
        screenX: clientX,
        screenY: clientY,
        isDown: false,
        startScreenX: 0,
        startScreenY: 0,
        startGameX: 0,
        startGameY: 0,
      };
      pointerRef.current = newPointerState;
      setPointer(newPointerState);

      // Process up event (side effect, outside state updater)
      processPointerEvent({
        gamePos: currentGamePos,
        startPos,
        isDown: false,
        wasDown: false,
        wasMoved: false,
        wasUpped: true,
      });

      // Process click if applicable
      if (isClick) {
        const gs = readLiveGamestates();
        const activeHotspots = getActiveHotspots(hotspots, gs);

        for (const hotspot of activeHotspots) {
          if (
            hotspotRectMatchesPosition(currentGamePos)(hotspot) &&
            hotspotRectMatchesPosition(startPos)(hotspot) &&
            gesture.isMouseClick(hotspot) &&
            isDirectPointerActionHotspot(hotspot)
          ) {
            if (processHotspotAction(hotspot, currentGamePos, startPos)) {
              break;
            }
          }
        }
      }

      settlePendingAction();
      sliderOldValuesRef.current.clear();
      gestureStartValuesRef.current.clear();
      gestureStartRotationRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      capturedPointerRef.current = null;
    },
    [
      screenTop,
      screenLeft,
      screenHeight,
      screenWidth,
      isPanoScene,
      camera,
      panoObject,
      offsetX,
      raycaster,
      processPointerEvent,
      hotspots,
      processHotspotAction,
      readLiveGamestates,
      settlePendingAction,
      finishCurrentPointerInteraction,
    ],
  );

  const onPointerLeave = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!inputEnabledRef.current) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        return;
      }
      const { clientX, clientY } = event;
      const prev = pointerRef.current;
      const newPointerState = {
        ...prev,
        screenX: clientX,
        screenY: clientY,
        isDown: false,
        startScreenX: 0,
        startScreenY: 0,
        startGameX: 0,
        startGameY: 0,
      };
      pointerRef.current = newPointerState;
      setPointer(newPointerState);
    },
    [],
  );

  const cancelGesture = useCallback(() => {
    if (transitionPendingRef.current) {
      return false;
    }
    const startValues = Object.fromEntries(
      gestureStartValuesRef.current.entries(),
    );
    if (Object.keys(startValues).length > 0) {
      dispatch(replaceGamestateValues(startValues));
    }
    if (gestureStartRotationRef.current) {
      dispatch(setRotation(gestureStartRotationRef.current));
    }
    if (sweepRafRef.current !== null) {
      cancelAnimationFrame(sweepRafRef.current);
      sweepRafRef.current = null;
    }
    pendingTransitionRef.current = null;
    stableActionChangedRef.current = false;
    sliderOldValuesRef.current.clear();
    gestureStartValuesRef.current.clear();
    gestureStartRotationRef.current = null;
    const captured = capturedPointerRef.current;
    if (captured && captured.target.hasPointerCapture(captured.pointerId)) {
      captured.target.releasePointerCapture(captured.pointerId);
    }
    capturedPointerRef.current = null;
    const resetPointer = {
      ...pointerRef.current,
      isDown: false,
      startScreenX: 0,
      startScreenY: 0,
      startGameX: 0,
      startGameY: 0,
    };
    pointerRef.current = resetPointer;
    setPointer(resetPointer);
    return true;
  }, [dispatch]);

  const onPointerCancel = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const suppression = resolvePointerSuppression(
        suppressedPointerIdRef.current,
        event.pointerId,
        'cancel',
      );
      suppressedPointerIdRef.current = suppression.suppressedPointerId;
      if (suppression.shouldIgnore) return;
      cancelGesture();
    },
    [cancelGesture],
  );

  const inputController = useMemo(() => ({ cancelGesture }), [cancelGesture]);

  return [
    {
      image: cursor,
      top: pointer.screenY - screenTop,
      left: pointer.screenX - screenLeft,
    },
    {
      onPointerUp,
      onPointerMove,
      onPointerDown,
      onPointerCancel,
      onPointerLeave,
    },
    clickHotspot,
    inputController,
  ];
}
