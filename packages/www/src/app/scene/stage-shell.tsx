'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  Cast,
  Hotspot,
  Scene,
} from '@soapbubble/morpheus-client/morpheus/casts/types';
import { fetch as fetchScene } from '@soapbubble/morpheus-client/service/scene';

import InteractiveStage, {
  ExternalRotation,
} from '@/morpheus-app/components/InteractiveStage';
import useResponsiveSize from '@/morpheus-app/hooks/useResponsiveSize';
import useGameControl, {
  HotspotState,
} from '@/morpheus-app/hooks/useGameControl';
import type { HarnessClickHandler } from '@/morpheus-app/hooks/useInputHandler';
import type {
  ClickHotspotRequest,
  ClickHotspotResult,
} from '@/lib/game-control-protocol';
import { useAppDispatch, useAppSelector } from '@/morpheus-app/store/hooks';
import type { AppDispatch } from '@/morpheus-app/store/store';
import { selectGamestatesAccessor } from '@/morpheus-app/store/slices/gamestateSlice';
import {
  activateScene,
  activateScenePrune,
  scenePrefetched,
  selectActiveSceneId,
  selectSceneById,
  selectStageScenes,
} from '@/morpheus-app/store/slices/sceneSlice';
import {
  clearRotationSeed,
  seedRotationFromTransition,
  selectRotation,
  selectRotationSeeded,
  setRotation,
} from '@/morpheus-app/store/slices/rotationSlice';
import { selectLivingSaves } from '@/morpheus-app/store/slices/livingSavesSlice';

import '@/morpheus-app/runtime';

type PendingTransition = {
  sceneId: number;
  scene: Scene;
  dissolve: boolean;
  startAngle?: number;
  mode?: 'goBack';
};

const DISSOLVE_DURATION_MS = 600;

function captureStageFrame(
  source: HTMLDivElement,
  target: HTMLCanvasElement,
): boolean {
  const sourceRect = source.getBoundingClientRect();
  const canvases = source.querySelectorAll('canvas');
  if (
    sourceRect.width <= 0 ||
    sourceRect.height <= 0 ||
    canvases.length === 0
  ) {
    return false;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const pixelWidth = Math.max(1, Math.round(sourceRect.width * pixelRatio));
  const pixelHeight = Math.max(1, Math.round(sourceRect.height * pixelRatio));
  if (target.width !== pixelWidth) {
    target.width = pixelWidth;
  }
  if (target.height !== pixelHeight) {
    target.height = pixelHeight;
  }
  target.style.width = `${sourceRect.width}px`;
  target.style.height = `${sourceRect.height}px`;

  const context = target.getContext('2d');
  if (!context) {
    return false;
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.fillStyle = '#000';
  context.fillRect(0, 0, sourceRect.width, sourceRect.height);

  let capturedCanvas = false;
  for (const canvas of canvases) {
    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width <= 0 || canvasRect.height <= 0) {
      continue;
    }
    try {
      context.drawImage(
        canvas,
        canvasRect.left - sourceRect.left,
        canvasRect.top - sourceRect.top,
        canvasRect.width,
        canvasRect.height,
      );
      capturedCanvas = true;
    } catch {
      // A single unavailable WebGL frame should not block the scene change.
    }
  }

  return capturedCanvas;
}

function isHotspot(cast: Cast): cast is Hotspot {
  return cast.__t === 'Hotspot';
}

function getActionTypeName(type: number): string {
  const ACTION_TYPES: Record<number, string> = {
    0: 'ChangeScene',
    1: 'DissolveTo',
    2: 'IncrementState',
    3: 'DecrementState',
    4: 'GoBack',
    5: 'Rotate',
    6: 'HorizSlider',
    7: 'VertSlider',
    8: 'TwoAxisSlider',
    9: 'SetStateTo',
    10: 'ExchangeState',
    11: 'CopyState',
    12: 'ChangeCursor',
    13: 'ReturnFromHelp',
    14: 'NoAction',
    15: 'Menu',
    99: 'DoGameAction',
  };
  return ACTION_TYPES[type] ?? `Unknown(${type})`;
}

function getGestureName(gesture: number): string {
  const GESTURES = [
    'MouseDown',
    'MouseUp',
    'MouseClick',
    'MouseEnter',
    'MouseLeave',
    'MouseNone',
    'Always',
    'SceneEnter',
    'SceneExit',
    'Rotation',
  ];
  return GESTURES[gesture] ?? `Unknown(${gesture})`;
}

export const SceneStageShell = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mcpSessionName = searchParams.get('mcp');

  const gamestates = useAppSelector(selectGamestatesAccessor);
  const livingSaves = useAppSelector(selectLivingSaves);
  const { width, height, left, top } = useResponsiveSize();
  const dispatch: AppDispatch = useAppDispatch();

  const rotation = useAppSelector(selectRotation);
  const rotationSeeded = useAppSelector(selectRotationSeeded);
  const stageScenes = useAppSelector(selectStageScenes);
  const activeSceneId = useAppSelector(selectActiveSceneId);
  const activeScene =
    useAppSelector((state) =>
      activeSceneId ? selectSceneById(state, activeSceneId) : undefined,
    ) ?? stageScenes[0];
  const activeSceneIdRef = useRef<number | null>(activeSceneId ?? null);
  useEffect(() => {
    activeSceneIdRef.current = activeSceneId ?? null;
  }, [activeSceneId]);
  const harnessClickRef = useRef<HarnessClickHandler | null>(null);

  // Clear the rotation seed after it has been applied once.
  useEffect(() => {
    if (rotationSeeded) {
      dispatch(clearRotationSeed());
    }
  }, [dispatch, rotationSeeded]);

  const hotspots = useMemo((): HotspotState[] => {
    if (!activeScene) return [];
    return activeScene.casts.filter(isHotspot).map((hotspot: Hotspot) => {
      const actionType = getActionTypeName(hotspot.type);
      const isSceneChange = hotspot.type === 0 || hotspot.type === 1;

      return {
        castId: hotspot.castId,
        bounds: {
          left: hotspot.rectLeft,
          right: hotspot.rectRight,
          top: hotspot.rectTop,
          bottom: hotspot.rectBottom,
        },
        actionType,
        gesture: getGestureName(hotspot.gesture),
        targetSceneId: isSceneChange ? hotspot.param1 : null,
      };
    });
  }, [activeScene]);

  const [pendingTransition, setPendingTransition] =
    useState<PendingTransition | null>(null);
  const transitionInProgressRef = useRef(false);
  const committedTransitionSceneIdRef = useRef<number | null>(null);
  const lastPushedSceneIdRef = useRef<number | null>(null);
  const stageCaptureSourceRef = useRef<HTMLDivElement>(null);
  const dissolveOverlayRef = useRef<HTMLCanvasElement>(null);
  const dissolveFrameRef = useRef<number | null>(null);
  const dissolveCleanupRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (dissolveFrameRef.current !== null) {
        window.cancelAnimationFrame(dissolveFrameRef.current);
      }
      if (dissolveCleanupRef.current !== null) {
        window.clearTimeout(dissolveCleanupRef.current);
      }
    },
    [],
  );

  const pendingScenes = useMemo(() => {
    return pendingTransition ? [pendingTransition.scene] : [];
  }, [pendingTransition]);

  const handleRotateTo = useCallback(
    (x: number, y: number) => {
      dispatch(setRotation({ yaw3600: x, pitch: y }));
    },
    [dispatch],
  );

  const handleHarnessClickReady = useCallback(
    (handler: HarnessClickHandler | null) => {
      harnessClickRef.current = handler;
    },
    [],
  );

  const handleRotationChange = useCallback(
    (nextRotation: ExternalRotation) => {
      dispatch(setRotation(nextRotation));
    },
    [dispatch],
  );

  const getState = useCallback(() => {
    const internalX = (rotation.yaw3600 / 3600) * 3072;
    const offsetX = Math.floor((internalX % 3072) / 24) * 24;
    return {
      sceneId: activeScene?.sceneId ?? 0,
      rotation: {
        x: rotation.yaw3600,
        y: rotation.pitch,
        offsetX,
      },
      hotspots,
    };
  }, [activeScene?.sceneId, rotation, hotspots]);

  const handleSceneTransition = useCallback(
    async ({
      sceneId,
      dissolve,
      startAngle,
      mode,
    }: {
      sceneId: number;
      dissolve: boolean;
      startAngle?: number;
      mode?: 'goBack';
    }) => {
      if (transitionInProgressRef.current) {
        return;
      }
      transitionInProgressRef.current = true;
      committedTransitionSceneIdRef.current = null;

      if (startAngle !== undefined) {
        dispatch(seedRotationFromTransition({ yaw3600: startAngle, pitch: 0 }));
      }

      try {
        const targetScene = await fetchScene(sceneId);
        if (!targetScene) {
          transitionInProgressRef.current = false;
          return;
        }
        setPendingTransition({
          sceneId,
          scene: targetScene,
          dissolve,
          startAngle,
          mode,
        });
      } catch {
        transitionInProgressRef.current = false;
      }
    },
    [dispatch],
  );

  const pushSceneRoute = useCallback(
    (sceneId: number) => {
      if (lastPushedSceneIdRef.current === sceneId) {
        return;
      }
      const url = mcpSessionName
        ? `/scene/${sceneId}?mcp=${encodeURIComponent(mcpSessionName)}`
        : `/scene/${sceneId}`;
      // Avoid pushing the same URL we're already on (prevents duplicate history entries)
      const currentSearch = searchParams.toString();
      const currentUrl = currentSearch
        ? `${pathname}?${currentSearch}`
        : pathname;
      if (currentUrl === url) {
        lastPushedSceneIdRef.current = sceneId;
        return;
      }
      lastPushedSceneIdRef.current = sceneId;
      router.push(url);
    },
    [mcpSessionName, pathname, router, searchParams],
  );

  const commitPendingTransition = useCallback(
    (transition: PendingTransition) => {
      if (committedTransitionSceneIdRef.current === transition.sceneId) {
        return;
      }
      committedTransitionSceneIdRef.current = transition.sceneId;

      const overlay = dissolveOverlayRef.current;
      const source = stageCaptureSourceRef.current;
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      const shouldDissolve =
        transition.dissolve &&
        !reduceMotion &&
        overlay !== null &&
        source !== null &&
        captureStageFrame(source, overlay);

      if (shouldDissolve && overlay) {
        if (dissolveFrameRef.current !== null) {
          window.cancelAnimationFrame(dissolveFrameRef.current);
          dissolveFrameRef.current = null;
        }
        if (dissolveCleanupRef.current !== null) {
          window.clearTimeout(dissolveCleanupRef.current);
          dissolveCleanupRef.current = null;
        }
        overlay.dataset.transitionState = 'captured';
        overlay.style.transition = 'none';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      } else if (overlay) {
        if (dissolveFrameRef.current !== null) {
          window.cancelAnimationFrame(dissolveFrameRef.current);
          dissolveFrameRef.current = null;
        }
        if (dissolveCleanupRef.current !== null) {
          window.clearTimeout(dissolveCleanupRef.current);
          dissolveCleanupRef.current = null;
        }
        overlay.dataset.transitionState = 'idle';
        overlay.style.transition = 'none';
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
      }

      dispatch(scenePrefetched(transition.scene));
      if (transition.mode === 'goBack') {
        dispatch(activateScenePrune(transition.sceneId));
      } else {
        dispatch(activateScene(transition.sceneId));
      }
      setPendingTransition(null);
      pushSceneRoute(transition.sceneId);
      // The incoming scene may immediately author another transition. The fade
      // is visual cleanup, not part of transition admission.
      transitionInProgressRef.current = false;

      if (!shouldDissolve || !overlay) {
        return;
      }

      dissolveFrameRef.current = window.requestAnimationFrame(() => {
        dissolveFrameRef.current = window.requestAnimationFrame(() => {
          dissolveFrameRef.current = null;
          overlay.dataset.transitionState = 'fading';
          overlay.style.transition = `opacity ${DISSOLVE_DURATION_MS}ms ease-in-out`;
          overlay.style.opacity = '0';
          dissolveCleanupRef.current = window.setTimeout(() => {
            overlay.dataset.transitionState = 'idle';
            overlay.style.pointerEvents = 'none';
            overlay.style.transition = 'none';
            dissolveCleanupRef.current = null;
          }, DISSOLVE_DURATION_MS);
        });
      });
    },
    [dispatch, pushSceneRoute],
  );

  const handleSceneReady = useCallback(
    (readySceneId: number) => {
      if (!pendingTransition || pendingTransition.sceneId !== readySceneId) {
        return;
      }
      commitPendingTransition(pendingTransition);
    },
    [commitPendingTransition, pendingTransition],
  );

  // Fallback: don't block forever if a cast never reaches "ready"
  useEffect(() => {
    if (!pendingTransition) return;

    const timeoutId = setTimeout(() => {
      commitPendingTransition(pendingTransition);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [commitPendingTransition, pendingTransition]);

  const handleLoadScene = useCallback(
    async (sceneId: number) => {
      // Treat external "load scene" the same as an in-game transition
      await handleSceneTransition({ sceneId, dissolve: false });
    },
    [handleSceneTransition],
  );

  const waitForScene = useCallback((sceneId: number) => {
    if (activeSceneIdRef.current === sceneId) {
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      const startedAt = Date.now();
      const intervalId = window.setInterval(() => {
        if (activeSceneIdRef.current === sceneId) {
          window.clearInterval(intervalId);
          resolve(true);
          return;
        }
        if (Date.now() - startedAt >= 6500) {
          window.clearInterval(intervalId);
          resolve(false);
        }
      }, 50);
    });
  }, []);

  const handleClickHotspot = useCallback(
    async (request: ClickHotspotRequest): Promise<ClickHotspotResult> => {
      const clickHotspot = harnessClickRef.current;
      const currentSceneId =
        activeSceneIdRef.current ?? activeScene?.sceneId ?? 0;

      if (!clickHotspot) {
        return {
          requestId: request.requestId,
          outcome: 'stage_not_ready',
          castId: request.hotspot.castId,
          currentSceneId,
          expectedSourceSceneId: request.expectedSourceSceneId,
          expectedSceneId: request.expectedSceneId,
          message: 'Game stage is not ready for hotspot clicks.',
        };
      }

      if (currentSceneId !== request.expectedSourceSceneId) {
        return {
          requestId: request.requestId,
          outcome: 'source_scene_mismatch',
          castId: request.hotspot.castId,
          currentSceneId,
          expectedSourceSceneId: request.expectedSourceSceneId,
          expectedSceneId: request.expectedSceneId,
          message: `Browser is on scene ${currentSceneId}, but the click request targets scene ${request.expectedSourceSceneId}.`,
        };
      }

      const result = clickHotspot(request.hotspot);

      if (result.outcome !== 'applied') {
        return {
          requestId: request.requestId,
          outcome: result.outcome,
          castId: request.hotspot.castId,
          currentSceneId: activeSceneIdRef.current ?? result.sceneId,
          expectedSourceSceneId: request.expectedSourceSceneId,
          expectedSceneId: request.expectedSceneId,
          matchedHotspot: result.matchedHotspot,
          message: result.message,
        };
      }

      const expectedSceneId =
        request.expectedSceneId ??
        result.actionResult.sceneTransition?.sceneId ??
        result.matchedHotspot.targetSceneId;
      let reachedExpectedScene = true;
      if (typeof expectedSceneId === 'number' && expectedSceneId > 0) {
        reachedExpectedScene = await waitForScene(expectedSceneId);
      }

      const observedSceneId = activeSceneIdRef.current ?? result.sceneId;
      if (!reachedExpectedScene) {
        return {
          requestId: request.requestId,
          outcome: 'expected_state_not_reached',
          castId: request.hotspot.castId,
          currentSceneId: observedSceneId,
          expectedSourceSceneId: request.expectedSourceSceneId,
          expectedSceneId,
          matchedHotspot: result.matchedHotspot,
          gamestateUpdates: result.actionResult.gamestateUpdates,
          sceneTransition: result.actionResult.sceneTransition,
          message: `Browser did not reach expected scene ${expectedSceneId}.`,
        };
      }

      return {
        requestId: request.requestId,
        outcome: 'applied',
        castId: request.hotspot.castId,
        currentSceneId: observedSceneId,
        expectedSourceSceneId: request.expectedSourceSceneId,
        expectedSceneId,
        matchedHotspot: result.matchedHotspot,
        gamestateUpdates: result.actionResult.gamestateUpdates,
        sceneTransition: result.actionResult.sceneTransition,
      };
    },
    [activeScene?.sceneId, waitForScene],
  );

  const { state: gameControlState } = useGameControl({
    enabled: true,
    sessionName: mcpSessionName,
    callbacks: useMemo(
      () => ({
        onLoadScene: handleLoadScene,
        onRotateTo: handleRotateTo,
        onClickHotspot: handleClickHotspot,
      }),
      [handleClickHotspot, handleLoadScene, handleRotateTo],
    ),
    getState,
  });

  if (
    livingSaves.bootstrapPhase !== 'ready' ||
    !gamestates ||
    stageScenes.length === 0 ||
    !activeScene
  ) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          color: '#fff',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        ref={stageCaptureSourceRef}
        style={{ position: 'absolute', inset: 0 }}
      >
        <InteractiveStage
          stageScenes={stageScenes}
          activeScene={activeScene}
          pendingScenes={pendingScenes}
          gamestates={gamestates}
          width={width}
          height={height}
          left={left}
          top={top}
          onRotationChange={handleRotationChange}
          rotation={rotation}
          onTransition={handleSceneTransition}
          onSceneReady={handleSceneReady}
          onHarnessClickReady={handleHarnessClickReady}
        />
      </div>
      <canvas
        ref={dissolveOverlayRef}
        data-testid="scene-dissolve-overlay"
        data-transition-state="idle"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            padding: '4px 8px',
            backgroundColor: gameControlState.isConnected
              ? 'rgba(0, 255, 0, 0.3)'
              : 'rgba(255, 0, 0, 0.3)',
            color: '#fff',
            fontSize: '10px',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        >
          {gameControlState.isConnected
            ? `WS: ${gameControlState.sessionId ?? 'connected'}`
            : 'WS: disconnected'}
        </div>
      )}
    </div>
  );
};
