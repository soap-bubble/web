'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Scene, Hotspot } from '@soapbubble/morpheus-client/morpheus/casts/types';
import InteractiveStage, {
  RotationState,
} from '@/morpheus-app/components/InteractiveStage';
import useInitialGamestates from '@/morpheus-app/hooks/useInitialGamestate';
import useResponsiveSize from '@/morpheus-app/hooks/useResponsiveSize';
import useGameControl, {
  HotspotState,
} from '@/morpheus-app/hooks/useGameControl';

import '@/morpheus-app/runtime';

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

  // Get MCP session name from URL query param ?mcp=sessionName
  const mcpSessionName = searchParams.get('mcp');

  // State for external rotation control
  const [rotationOverride, setRotationOverride] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Track current rotation for state reporting
  const [currentRotation, setCurrentRotation] = useState<RotationState>({
    x: 0,
    y: 0,
    offsetX: 0,
  });

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

  const handleRotateTo = useCallback((x: number, y: number) => {
    setRotationOverride({ x, y });
    // Also update currentRotation for state reporting (using external coordinates)
    // InteractiveStage uses internal coords (0-3072), but we report external (0-3600)
    setCurrentRotation({ x, y, offsetX: 0 });
  }, []);

  // State getter for game control hook
  const getState = useCallback(() => {
    return {
      sceneId: scene.sceneId,
      rotation: currentRotation,
      hotspots,
    };
  }, [scene.sceneId, currentRotation, hotspots]);

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
  const handleRotationChange = useCallback((rotation: RotationState) => {
    const externalX = (rotation.x / 3072) * 3600;
    setCurrentRotation({
      x: externalX,
      y: rotation.y,
      offsetX: rotation.offsetX,
    });
  }, []);

  if (!gamestates) {
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
      <InteractiveStage
        scene={scene}
        gamestates={gamestates}
        width={width}
        height={height}
        left={left}
        top={top}
        onRotationChange={handleRotationChange}
        rotationOverride={rotationOverride}
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
