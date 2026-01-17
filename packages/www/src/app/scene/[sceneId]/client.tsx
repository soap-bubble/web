'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Scene, Hotspot, PanoCast, Cast } from '@soapbubble/morpheus-client/morpheus/casts/types';
import { fetch as fetchScene } from '@soapbubble/morpheus-client/service/scene';
import { getAssetUrl } from '@soapbubble/morpheus-client/service/gamedb';
import { isPano } from '@soapbubble/morpheus-client/morpheus/casts/matchers';
import InteractiveStage, {
  ExternalRotation,
} from '@/morpheus-app/components/InteractiveStage';
import useInitialGamestates from '@/morpheus-app/hooks/useInitialGamestate';
import useResponsiveSize from '@/morpheus-app/hooks/useResponsiveSize';
import useGameControl, {
  HotspotState,
} from '@/morpheus-app/hooks/useGameControl';
import { useSceneSystem } from '@/morpheus-app/systems/useSceneSystem';
import { useAppDispatch, useAppSelector } from '@/morpheus-app/store/hooks';
import {
  selectActiveSceneId,
  selectStageScenes,
} from '@/morpheus-app/store/slices/sceneSlice';
import {
  seedRotationFromTransition,
  selectRotation,
  setRotation,
} from '@/morpheus-app/store/slices/rotationSlice';

import '@/morpheus-app/runtime';

function isPanoCast(cast: Cast): cast is PanoCast {
  return cast.__t === 'PanoCast';
}

function prefetchPanoTexture(scene: Scene): Promise<void> {
  const panoCast = scene.casts.find(isPanoCast);
  if (!panoCast) {
    return Promise.resolve();
  }
  const panoUrl = getAssetUrl(panoCast.fileName, 'png');
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = panoUrl;
  });
}

interface ClientProps {
  scene: Scene;
}

function isHotspot(cast: unknown): cast is Hotspot {
  return (
    typeof cast === 'object' &&
    cast !== null &&
    'rectLeft' in cast &&
    'rectRight' in cast &&
    'rectTop' in cast &&
    'rectBottom' in cast &&
    'gesture' in cast
  )
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
  }
  return ACTION_TYPES[type] ?? `Unknown(${type})`
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
  ]
  return GESTURES[gesture] ?? `Unknown(${gesture})`
}

export const Client = ({ scene }: ClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gamestates = useInitialGamestates();
  const { width, height, left, top } = useResponsiveSize();
  const dispatch = useAppDispatch();

  // Get MCP session name from URL query param ?mcp=sessionName
  const mcpSessionName = searchParams.get('mcp');

  const rotation = useAppSelector(selectRotation);
  const stageScenes = useAppSelector(selectStageScenes);
  const activeSceneId = useAppSelector(selectActiveSceneId);

  // Extract hotspot info from scene for state reporting
  const hotspots = useMemo((): HotspotState[] => {
    return scene.casts.filter(isHotspot).map((hotspot) => {
      const actionType = getActionTypeName(hotspot.type)
      const isSceneChange = hotspot.type === 0 || hotspot.type === 1

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
      }
    })
  }, [scene])

  // Game control callbacks - preserve mcp session when navigating
  const handleLoadScene = useCallback(
    (sceneId: number) => {
      const url = mcpSessionName
        ? `/scene/${sceneId}?mcp=${encodeURIComponent(mcpSessionName)}`
        : `/scene/${sceneId}`;
      router.push(url);
    },
    [router, mcpSessionName]
  );

  const handleRotateTo = useCallback(
    (x: number, y: number) => {
      dispatch(setRotation({ yaw3600: x, pitch: y }));
    },
    [dispatch]
  );

  // Track if a transition is in progress to prevent double-navigation
  const transitionInProgressRef = useRef(false);

  // Scene transition: prefetch pano texture, seed rotation, then navigate
  const handleSceneTransition = useCallback(
    async ({
      sceneId,
      startAngle,
    }: {
      sceneId: number;
      dissolve: boolean;
      startAngle?: number;
    }) => {
      // Prevent double-navigation
      if (transitionInProgressRef.current) {
        return;
      }
      transitionInProgressRef.current = true;

      // Seed rotation so new page starts at correct angle
      if (startAngle !== undefined) {
        dispatch(seedRotationFromTransition({ yaw3600: startAngle, pitch: 0 }));
      }

      // Fetch scene data and prefetch pano texture before navigating
      // This ensures the texture is in browser cache when the new page loads
      try {
        const targetScene = await fetchScene(sceneId);
        if (targetScene && isPano(targetScene)) {
          // Wait for texture to load (with 3s timeout)
          await Promise.race([
            prefetchPanoTexture(targetScene),
            new Promise((resolve) => setTimeout(resolve, 3000)),
          ]);
        }
      } catch {
        // If prefetch fails, continue with navigation anyway
      }

      // Navigate
      const url = mcpSessionName
        ? `/scene/${sceneId}?mcp=${encodeURIComponent(mcpSessionName)}`
        : `/scene/${sceneId}`;
      router.push(url);
    },
    [dispatch, mcpSessionName, router]
  );

  // State getter for game control hook
  const getState = useCallback(() => {
    const internalX = (rotation.yaw3600 / 3600) * 3072;
    const offsetX = Math.floor((internalX % 3072) / 24) * 24;
    return {
      sceneId: scene.sceneId,
      rotation: {
        x: rotation.yaw3600,
        y: rotation.pitch,
        offsetX,
      },
      hotspots,
    };
  }, [scene.sceneId, rotation, hotspots]);

  // Game control hook - use mcp session name from URL if present
  const { state: gameControlState } = useGameControl({
    enabled: true,
    sessionName: mcpSessionName,
    callbacks: useMemo(
      () => ({
        onLoadScene: handleLoadScene,
        onRotateTo: handleRotateTo,
      }),
      [handleLoadScene, handleRotateTo]
    ),
    getState,
  });

  // Handle rotation changes from InteractiveStage
  // InteractiveStage uses internal coordinates (0-3072), convert to external (0-3600)
  const handleRotationChange = useCallback(
    (nextRotation: ExternalRotation) => {
      dispatch(setRotation(nextRotation));
    },
    [dispatch]
  );

  useSceneSystem({
    scene,
    sceneId: scene.sceneId,
    mcpSessionName,
  });

  if (!gamestates || stageScenes.length === 0 || !activeSceneId) {
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

  const activeScene =
    stageScenes.find((stageScene) => stageScene.sceneId === activeSceneId) ??
    stageScenes[0];

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
      <InteractiveStage
        stageScenes={stageScenes}
        activeScene={activeScene}
        gamestates={gamestates}
        width={width}
        height={height}
        left={left}
        top={top}
        onRotationChange={handleRotationChange}
        rotation={rotation}
        onTransition={handleSceneTransition}
      />
      {/* Connection indicator for debugging */}
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
