'use client';

import { FC, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Object3D } from 'three';
import { Observable } from 'rxjs';
import type { SceneTransitionRequest } from 'morpheus/scene/types';

import WebGl from 'morpheus/casts/components/WebGl';
import Special from 'morpheus/casts/components/Special';
import usePanoMomentum from 'morpheus/casts/hooks/panoMomentum';
import { composePointer } from 'morpheus/hotspot/eventInterface';
import { isPano, forMorpheusType } from 'morpheus/casts/matchers';
import { isCastActive, Gamestates } from '@soapbubble/morpheus-client';
import type { Scene, PanoCast, Cast, MovieCast } from 'morpheus/casts/types';

import { and, Matcher } from '@/utils/matchers';
import useCursorHandler from '../hooks/useCursorHandler';

export interface RotationState {
  x: number;
  y: number;
  offsetX: number;
}

export type ExternalRotation = {
  yaw3600: number;
  pitch: number;
};

interface InteractiveStageProps {
  stageScenes: Scene[];
  activeScene: Scene;
  gamestates: Gamestates;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  volume?: number;
  onRotationChange?: (rotation: ExternalRotation) => void;
  rotation: ExternalRotation;
  onTransition?: (transition: SceneTransitionRequest) => void;
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates });
}

// Convert external coordinates (0-3600) to internal coordinates (0-3072)
function externalToInternal(x: number): number {
  return (x / 3600) * 3072;
}

// Convert internal coordinates (0-3072) to external (0-3600)
function internalToExternal(x: number): number {
  return (x / 3072) * 3600;
}

// Compute offsetX from x coordinate
function computeOffsetX(x: number): number {
  return Math.floor((x % 3072) / 24) * 24;
}

const InteractiveStage: FC<InteractiveStageProps> = ({
  stageScenes,
  activeScene,
  gamestates,
  width = 800,
  height = 600,
  top = 0,
  left = 0,
  volume = 0.5,
  onRotationChange,
  rotation,
  onTransition,
}) => {
  const active = activeScene;

  const isPanoScene = useMemo(() => {
    return active ? isPano(active) : false;
  }, [active]);

  const [camera, setCamera] = useState<Camera | undefined>();
  const [panoObject, setPanoObject] = useState<Object3D | undefined>();
  const [, setSpecialMovieCast] = useState<Observable<MovieCast> | null>(null);

  const targetInternal = useMemo(() => {
    const internalX = externalToInternal(rotation.yaw3600);
    return {
      x: internalX,
      y: rotation.pitch,
      offsetX: computeOffsetX(internalX),
    };
  }, [rotation]);

  const [internalRotation, momentumPointerHandler, setInternalRotation] =
    usePanoMomentum(5, 100, targetInternal);

  // Track whether we're syncing from Redux to avoid dispatch loops
  const syncingFromReduxRef = useRef(false);
  const internalRotationRef = useRef(internalRotation);

  useEffect(() => {
    internalRotationRef.current = internalRotation;
  }, [internalRotation]);

  // Sync from Redux → internal (only when Redux changed externally)
  useEffect(() => {
    const diffX = Math.abs(internalRotationRef.current.x - targetInternal.x);
    const diffY = Math.abs(internalRotationRef.current.y - targetInternal.y);
    if (diffX > 0.5 || diffY > 0.001) {
      syncingFromReduxRef.current = true;
      setInternalRotation(targetInternal);
    }
  }, [targetInternal, setInternalRotation]);

  // Notify parent of rotation changes (but skip when syncing from Redux)
  const prevRotationRef = useRef({ x: internalRotation.x, y: internalRotation.y });
  useEffect(() => {
    // Skip if we just synced from Redux
    if (syncingFromReduxRef.current) {
      syncingFromReduxRef.current = false;
      prevRotationRef.current = { x: internalRotation.x, y: internalRotation.y };
      return;
    }
    if (
      onRotationChange &&
      (prevRotationRef.current.x !== internalRotation.x ||
        prevRotationRef.current.y !== internalRotation.y)
    ) {
      prevRotationRef.current = { x: internalRotation.x, y: internalRotation.y };
      onRotationChange({
        yaw3600: internalToExternal(internalRotation.x),
        pitch: internalRotation.y,
      });
    }
  }, [internalRotation, onRotationChange]);

  const [cursor, hotspotPointerHandler] = useCursorHandler(
    active,
    gamestates,
    isPanoScene,
    camera,
    panoObject,
    internalRotation.offsetX,
    left,
    top,
    width,
    height,
  );

  const pointerHandler = composePointer([
    momentumPointerHandler,
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
        rotation={internalRotation}
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
        onTransition={onTransition}
      />
    </div>
  );
};

export default InteractiveStage;
