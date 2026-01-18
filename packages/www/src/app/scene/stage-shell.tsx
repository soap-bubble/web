'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Scene, Hotspot } from '@soapbubble/morpheus-client/morpheus/casts/types';
import { fetch as fetchScene } from '@soapbubble/morpheus-client/service/scene';

import InteractiveStage, {
  ExternalRotation,
} from '@/morpheus-app/components/InteractiveStage';
import SettingsOverlay from '@/morpheus-app/components/SettingsOverlay';
import useResponsiveSize from '@/morpheus-app/hooks/useResponsiveSize';
import useGameControl, { HotspotState } from '@/morpheus-app/hooks/useGameControl';
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
import { commitSceneUpdates } from '@/morpheus-app/store/slices/gamestateSlice';
import { useGamestateHistory } from '@/morpheus-app/hooks/useGamestateHistory';

import '@/morpheus-app/runtime';

type PendingTransition = {
  sceneId: number;
  scene: Scene;
  startAngle?: number;
  mode?: 'goBack';
};

function isHotspot(cast: unknown): cast is Hotspot {
  return (
    typeof cast === 'object' &&
    cast !== null &&
    'rectLeft' in cast &&
    'rectRight' in cast &&
    'rectTop' in cast &&
    'rectBottom' in cast &&
    'gesture' in cast
  );
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
  const { width, height, left, top } = useResponsiveSize();
  const dispatch: AppDispatch = useAppDispatch();
  useGamestateHistory();

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

  const pendingScenes = useMemo(() => {
    return pendingTransition ? [pendingTransition.scene] : [];
  }, [pendingTransition]);

  const handleRotateTo = useCallback(
    (x: number, y: number) => {
      dispatch(setRotation({ yaw3600: x, pitch: y }));
    },
    [dispatch],
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
        setPendingTransition({ sceneId, scene: targetScene, startAngle, mode });
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
      const currentUrl = currentSearch ? `${pathname}?${currentSearch}` : pathname;
      if (currentUrl === url) {
        lastPushedSceneIdRef.current = sceneId;
        return;
      }
      lastPushedSceneIdRef.current = sceneId;
      router.push(url);
    },
    [mcpSessionName, pathname, router, searchParams],
  );

  const handleSceneReady = useCallback(
    (readySceneId: number) => {
      if (!pendingTransition || pendingTransition.sceneId !== readySceneId) {
        return;
      }
      // `onSceneReady` can fire more than once (WebGl + Special, or duplicated events).
      // Ensure we only commit/push once per transition.
      if (committedTransitionSceneIdRef.current === readySceneId) {
        return;
      }
      committedTransitionSceneIdRef.current = readySceneId;

      const previousSceneId = activeSceneIdRef.current ?? readySceneId;
      dispatch(commitSceneUpdates({ sceneId: previousSceneId }));
      dispatch(scenePrefetched(pendingTransition.scene));
      if (pendingTransition.mode === 'goBack') {
        dispatch(activateScenePrune(readySceneId));
      } else {
        dispatch(activateScene(readySceneId));
      }
      setPendingTransition(null);
      transitionInProgressRef.current = false;

      // Now that the stage has already switched, update the URL/history "the Next way".
      pushSceneRoute(readySceneId);
    },
    [dispatch, pendingTransition, pushSceneRoute],
  );

  // Fallback: don't block forever if a cast never reaches "ready"
  useEffect(() => {
    if (!pendingTransition) return;

    const timeoutId = setTimeout(() => {
      if (committedTransitionSceneIdRef.current === pendingTransition.sceneId) {
        return;
      }
      committedTransitionSceneIdRef.current = pendingTransition.sceneId;
      const previousSceneId = activeSceneIdRef.current ?? pendingTransition.sceneId;
      dispatch(commitSceneUpdates({ sceneId: previousSceneId }));
      dispatch(scenePrefetched(pendingTransition.scene));
      if (pendingTransition.mode === 'goBack') {
        dispatch(activateScenePrune(pendingTransition.sceneId));
      } else {
        dispatch(activateScene(pendingTransition.sceneId));
      }
      setPendingTransition(null);
      transitionInProgressRef.current = false;
      pushSceneRoute(pendingTransition.sceneId);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [dispatch, pendingTransition, pushSceneRoute]);

  const handleLoadScene = useCallback(
    async (sceneId: number) => {
      // Treat external "load scene" the same as an in-game transition
      await handleSceneTransition({ sceneId, dissolve: false });
    },
    [handleSceneTransition],
  );

  const { state: gameControlState } = useGameControl({
    enabled: true,
    sessionName: mcpSessionName,
    callbacks: useMemo(
      () => ({
        onLoadScene: handleLoadScene,
        onRotateTo: handleRotateTo,
      }),
      [handleLoadScene, handleRotateTo],
    ),
    getState,
  });

  if (!gamestates || stageScenes.length === 0 || !activeScene) {
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
      <SettingsOverlay />
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

