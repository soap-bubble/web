'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Scene, Hotspot } from '@soapbubble/morpheus-client/morpheus/casts/types';
import { fetch as fetchScene } from '@soapbubble/morpheus-client/service/scene';
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
  activateScene,
  scenePrefetched,
  selectActiveSceneId,
  selectStageScenes,
} from '@/morpheus-app/store/slices/sceneSlice';
import {
  seedRotationFromTransition,
  selectRotation,
  setRotation,
} from '@/morpheus-app/store/slices/rotationSlice';

import '@/morpheus-app/runtime';

type PendingTransition = {
  sceneId: number;
  scene: Scene;
  startAngle?: number;
};

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
    return scene.casts.filter(isHotspot).map((hotspot: Hotspot) => {
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

  // Game control callbacks - use in-app transition (no navigation)
  const handleLoadScene = useCallback(
    async (sceneId: number) => {
      if (transitionInProgressRef.current) return;
      transitionInProgressRef.current = true;

      try {
        const targetScene = await fetchScene(sceneId);
        if (targetScene) {
          dispatch(scenePrefetched(targetScene));
          dispatch(activateScene(sceneId));
          
          const url = mcpSessionName
            ? `/scene/${sceneId}?mcp=${encodeURIComponent(mcpSessionName)}`
            : `/scene/${sceneId}`;
          window.history.replaceState(null, '', url);
        }
      } catch (error) {
        console.error('Failed to load scene:', error);
      } finally {
        transitionInProgressRef.current = false;
      }
    },
    [dispatch, mcpSessionName]
  );

  const handleRotateTo = useCallback(
    (x: number, y: number) => {
      dispatch(setRotation({ yaw3600: x, pitch: y }));
    },
    [dispatch]
  );

  // Track pending transition and scenes to preload
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const transitionInProgressRef = useRef(false);

  // Pending scenes for asset preloading
  const pendingScenes = useMemo(() => {
    return pendingTransition ? [pendingTransition.scene] : [];
  }, [pendingTransition]);

  // Scene transition: fetch scene data, add to pending for preload
  const handleSceneTransition = useCallback(
    async ({
      sceneId,
      startAngle,
    }: {
      sceneId: number;
      dissolve: boolean;
      startAngle?: number;
    }) => {
      // Prevent double-transition
      if (transitionInProgressRef.current) {
        return;
      }
      transitionInProgressRef.current = true;

      // Seed rotation so new scene starts at correct angle
      if (startAngle !== undefined) {
        dispatch(seedRotationFromTransition({ yaw3600: startAngle, pitch: 0 }));
      }

      // Fetch scene data and add to pending for preloading
      try {
        const targetScene = await fetchScene(sceneId);
        if (targetScene) {
          setPendingTransition({ sceneId, scene: targetScene, startAngle });
        } else {
          // Scene not found - reset transition flag
          transitionInProgressRef.current = false;
          console.error(`Scene ${sceneId} not found`);
        }
      } catch (error) {
        // If fetch fails, reset transition flag
        transitionInProgressRef.current = false;
        console.error('Failed to fetch scene:', error);
      }
    },
    [dispatch]
  );

  // Called when all assets for a pending scene are ready
  const handleSceneReady = useCallback(
    (readySceneId: number) => {
      if (pendingTransition && pendingTransition.sceneId === readySceneId) {
        // Assets are ready - activate scene in Redux (no navigation!)
        dispatch(scenePrefetched(pendingTransition.scene));
        dispatch(activateScene(readySceneId));
        
        // Update URL without triggering navigation (keeps WebGL context alive)
        const url = mcpSessionName
          ? `/scene/${readySceneId}?mcp=${encodeURIComponent(mcpSessionName)}`
          : `/scene/${readySceneId}`;
        window.history.replaceState(null, '', url);
        
        setPendingTransition(null);
        transitionInProgressRef.current = false;
      }
    },
    [pendingTransition, mcpSessionName, dispatch]
  );

  // Timeout fallback: activate scene even if assets don't fully load within 5s
  useEffect(() => {
    if (!pendingTransition) return;

    const timeoutId = setTimeout(() => {
      // Activate scene anyway after timeout
      dispatch(scenePrefetched(pendingTransition.scene));
      dispatch(activateScene(pendingTransition.sceneId));
      
      const url = mcpSessionName
        ? `/scene/${pendingTransition.sceneId}?mcp=${encodeURIComponent(mcpSessionName)}`
        : `/scene/${pendingTransition.sceneId}`;
      window.history.replaceState(null, '', url);
      
      setPendingTransition(null);
      transitionInProgressRef.current = false;
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [pendingTransition, mcpSessionName, dispatch]);

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
