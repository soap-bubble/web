'use client';

import { FC, useMemo, useState, useEffect, useCallback } from 'react';
import { Camera, Object3D } from 'three';
import { Observable } from 'rxjs';

import WebGl from 'morpheus/casts/components/WebGl';
import Special from 'morpheus/casts/components/Special';
import usePanoMomentum from 'morpheus/casts/hooks/panoMomentum';
import { composePointer } from 'morpheus/hotspot/eventInterface';
import { isPano, forMorpheusType } from 'morpheus/casts/matchers';
import { isCastActive, Gamestates } from '@soapbubble/morpheus-client';
import type { Scene, PanoCast, Cast, MovieCast } from 'morpheus/casts/types';

import { and, not, Matcher } from '@/utils/matchers';
import useCursorHandler from '../hooks/useCursorHandler';

export interface RotationState {
  x: number;
  y: number;
  offsetX: number;
}

interface InteractiveStageProps {
  scene: Scene;
  gamestates: Gamestates;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  volume?: number;
  onSceneChange?: (sceneId: number) => void;
  onRotationChange?: (rotation: RotationState) => void;
  rotationOverride?: { x: number; y: number } | null;
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates });
}

// Convert external coordinates (0-3600) to internal coordinates (0-3072)
function externalToInternal(x: number): number {
  return (x / 3600) * 3072;
}

// Compute offsetX from x coordinate
function computeOffsetX(x: number): number {
  return Math.floor((x % 3072) / 24) * 24;
}

const InteractiveStage: FC<InteractiveStageProps> = ({
  scene,
  gamestates,
  width = 800,
  height = 600,
  top = 0,
  left = 0,
  volume = 0.5,
  onRotationChange,
  rotationOverride,
}) => {
  const stageScenes = useMemo(() => [scene], [scene]);

  const isPanoScene = useMemo(() => {
    return scene && isPano(scene);
  }, [scene]);

  const [camera, setCamera] = useState<Camera | undefined>();
  const [panoObject, setPanoObject] = useState<Object3D | undefined>();
  const [specialMovieCast, setSpecialMovieCast] = useState<Observable<MovieCast> | null>(null);

  const [internalRotation, momentumPointerHandler] = usePanoMomentum(5, 100);

  // State for external rotation override
  const [overrideRotation, setOverrideRotation] = useState<RotationState | null>(null);

  // Apply rotation override when prop changes
  useEffect(() => {
    if (rotationOverride) {
      const internalX = externalToInternal(rotationOverride.x);
      setOverrideRotation({
        x: internalX,
        y: rotationOverride.y,
        offsetX: computeOffsetX(internalX),
      });
    } else {
      setOverrideRotation(null);
    }
  }, [rotationOverride]);

  // Use override rotation if set, otherwise use internal momentum rotation
  const rotation = overrideRotation ?? internalRotation;

  // Notify parent of rotation changes
  const prevRotationRef = useMemo(() => ({ current: rotation }), []);
  useEffect(() => {
    if (
      onRotationChange &&
      (prevRotationRef.current.x !== rotation.x ||
        prevRotationRef.current.y !== rotation.y)
    ) {
      prevRotationRef.current = rotation;
      onRotationChange(rotation);
    }
  }, [rotation, onRotationChange, prevRotationRef]);

  // Clear override when user starts interacting
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      setOverrideRotation(null);
      momentumPointerHandler.onPointerDown?.(event);
    },
    [momentumPointerHandler]
  );

  // Wrap momentum pointer handler to clear override on interaction
  const wrappedMomentumHandler = useMemo(
    () => ({
      ...momentumPointerHandler,
      onPointerDown: handlePointerDown,
    }),
    [momentumPointerHandler, handlePointerDown]
  );

  const [cursor, hotspotPointerHandler] = useCursorHandler(
    scene,
    gamestates,
    isPanoScene,
    camera,
    panoObject,
    rotation.offsetX,
    left,
    top,
    width,
    height,
  );

  const pointerHandler = composePointer([
    wrappedMomentumHandler,
    hotspotPointerHandler,
  ]);

  const { onPointerUp, onPointerMove, onPointerDown, onPointerLeave } = pointerHandler;

  const [webGlScenes, specialScenes] = useMemo(() => {
    const matchActive = matchActiveCast(gamestates);
    const isPanoCast = forMorpheusType('PanoCast');
    const matchPanoCast = and<PanoCast>(isPanoCast, matchActive);
    const matchActivePanoScene = (s: Scene) =>
      s.casts.some((cast: Cast) => matchPanoCast(cast as MovieCast));

    return stageScenes.reduce(
      ([webGl, special], s) => {
        if (matchActivePanoScene(s)) {
          webGl.push(s);
        } else if (!webGl.length && !isPano(s)) {
          special.push(s);
        }
        return [webGl, special];
      },
      [[], []] as [Scene[], Scene[]],
    );
  }, [gamestates, stageScenes]);

  return (
    <div
      style={{
        position: 'absolute',
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'hidden',
        pointerEvents: 'auto',
        cursor: 'none',
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      <WebGl
        stageScenes={webGlScenes}
        gamestates={gamestates}
        setCamera={setCamera}
        setPanoObject={setPanoObject}
        rotation={rotation}
        volume={volume}
        top={0}
        left={0}
        width={width}
        height={height}
      />
      <Special
        cursor={cursor}
        setDoneObserver={setSpecialMovieCast}
        stageScenes={specialScenes}
        gamestates={gamestates}
        volume={volume}
        top={0}
        left={0}
        width={width}
        height={height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
    </div>
  );
};

export default InteractiveStage;
