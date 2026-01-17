'use client';

import { FC, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Object3D } from 'three';
import { Observable } from 'rxjs';
import type { SceneTransitionRequest } from 'morpheus/scene/types';

import WebGl from 'morpheus/casts/components/WebGl';
import Special from 'morpheus/casts/components/Special';
import Sounds, { AudioController } from 'morpheus/casts/components/Sounds';
import useCastRefNoticer from 'morpheus/casts/hooks/useCastRefNoticer';
import usePanoMomentum from 'morpheus/casts/hooks/panoMomentum';
import { composePointer } from 'morpheus/hotspot/eventInterface';
import { isPano, forMorpheusType, isAudio } from 'morpheus/casts/matchers';
import { isCastActive, Gamestates } from '@soapbubble/morpheus-client';
import type {
  Scene,
  PanoCast,
  Cast,
  MovieCast,
  MovieSpecialCast,
  SoundCast,
  SupportedSoundCasts,
} from 'morpheus/casts/types';

import { and, Matcher } from '@/utils/matchers';
import { useInputHandler } from '../hooks/useInputHandler';

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
  pendingScenes?: Scene[];
  gamestates: Gamestates;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  volume?: number;
  onRotationChange?: (rotation: ExternalRotation) => void;
  rotation: ExternalRotation;
  onTransition?: (transition: SceneTransitionRequest) => void;
  onSceneReady?: (sceneId: number) => void;
}

const TRANSITION_SCENE_SENTINEL = 0x3fffffff;

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
  pendingScenes = [],
  gamestates,
  width = 800,
  height = 600,
  top = 0,
  left = 0,
  volume = 0.5,
  onRotationChange,
  rotation,
  onTransition,
  onSceneReady,
}) => {
  const active = activeScene;
  const [availableSounds, onAudioCastRef] = useCastRefNoticer<
    AudioController,
    SupportedSoundCasts
  >();

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

  const previousSceneId = useMemo(
    () => (stageScenes.length > 1 ? stageScenes[1].sceneId : undefined),
    [stageScenes],
  );

  const [cursor, hotspotPointerHandler] = useInputHandler({
    scene: active,
    gamestates,
    isPanoScene,
    camera,
    panoObject,
    offsetX: internalRotation.offsetX,
    screenLeft: left,
    screenTop: top,
    screenWidth: width,
    screenHeight: height,
    previousSceneId,
    onTransition,
  });

  // Only include momentum handler (pano rotation) when the active scene is a pano
  // This prevents pano rotation when interacting with special/controlled scenes
  const pointerHandler = useMemo(
    () =>
      isPanoScene
        ? composePointer([momentumPointerHandler, hotspotPointerHandler])
        : composePointer([hotspotPointerHandler]),
    [isPanoScene, momentumPointerHandler, hotspotPointerHandler],
  );

  const { onPointerUp, onPointerMove, onPointerDown, onPointerLeave } = pointerHandler;

  const isSoundCast = useCallback(
    (cast: Cast): cast is SoundCast => cast.__t === 'SoundCast',
    [],
  );
  const isMovieSpecialAudioCast = useCallback(
    (cast: Cast): cast is MovieSpecialCast =>
      cast.__t === 'MovieSpecialCast' && isAudio(cast as MovieCast),
    [],
  );
  const isControlledAudioCast = useCallback(
    (cast: Cast): cast is SupportedSoundCasts =>
      cast.__t === 'ControlledMovieCast' && isAudio(cast as MovieCast),
    [],
  );

  const aggregatedSoundCasts = useMemo(() => {
    if (!stageScenes.length) {
      return [] as SupportedSoundCasts[];
    }
    const matchActive = matchActiveCast(gamestates);
    const loopingSoundCasts: SoundCast[] = [];
    for (const scene of stageScenes) {
      for (const cast of scene.casts) {
        if (isSoundCast(cast) && cast.looping && matchActive(cast)) {
          loopingSoundCasts.push(cast);
        }
      }
    }

    const activeSceneSounds: SupportedSoundCasts[] = [];
    const activeSceneCasts = activeScene?.casts ?? [];
    for (const cast of activeSceneCasts) {
      if (!matchActive(cast)) {
        continue;
      }
      if (isSoundCast(cast)) {
        if (!cast.looping) {
          activeSceneSounds.push(cast);
        }
        continue;
      }
      if (isMovieSpecialAudioCast(cast) || isControlledAudioCast(cast)) {
        activeSceneSounds.push(cast);
      }
    }

    const seen = new Set<number>();
    const uniqueCasts: SupportedSoundCasts[] = [];
    for (const cast of [...loopingSoundCasts, ...activeSceneSounds]) {
      if (seen.has(cast.castId)) {
        continue;
      }
      seen.add(cast.castId);
      uniqueCasts.push(cast);
    }
    return uniqueCasts;
  }, [
    activeScene?.casts,
    gamestates,
    isControlledAudioCast,
    isMovieSpecialAudioCast,
    isSoundCast,
    stageScenes,
  ]);

  const handleAudioCastEnded = useCallback(
    (ref: [HTMLAudioElement, SupportedSoundCasts[]]) => {
      const [, casts] = ref;
      if (!activeScene) {
        return;
      }
      for (const cast of casts) {
        if (!isSoundCast(cast)) {
          continue;
        }
        const isInActiveScene = activeScene.casts.some(
          (sceneCast) => sceneCast.castId === cast.castId,
        );
        if (!isInActiveScene) {
          continue;
        }
        if (!isCastActive({ cast, gamestates })) {
          continue;
        }
        const nextSceneId = cast.nextSceneId;
        if (
          typeof nextSceneId !== 'number' ||
          nextSceneId === TRANSITION_SCENE_SENTINEL
        ) {
          continue;
        }
        onTransition?.({
          sceneId: nextSceneId,
          dissolve: !!cast.dissolveToNextScene,
        });
      }
    },
    [activeScene, gamestates, isSoundCast, onTransition],
  );

  const handleAudioCastCanPlayThrough = useCallback(() => {}, []);

  useEffect(() => {
    const activeSceneCasts = activeScene?.casts ?? [];
    const isActiveCast = (cast: Cast) => isCastActive({ cast, gamestates });
    const isCastInStage = (cast: Cast) =>
      stageScenes.some((scene) =>
        scene.casts.some((sceneCast) => sceneCast.castId === cast.castId),
      );
    const isCastInActiveScene = (cast: Cast) =>
      activeSceneCasts.some((sceneCast) => sceneCast.castId === cast.castId);

    for (const [controller, casts] of availableSounds) {
      const shouldPlay = casts.some((cast) => {
        if (!isActiveCast(cast)) {
          return false;
        }
        if (isSoundCast(cast) && cast.looping) {
          return isCastInStage(cast);
        }
        return isCastInActiveScene(cast);
      });

      if (shouldPlay) {
        controller.play();
      } else {
        controller.pause();
      }
    }
  }, [activeScene, availableSounds, gamestates, isSoundCast, stageScenes]);

  const [webGlScenes, specialScenes] = useMemo(() => {
    const matchActive = matchActiveCast(gamestates);
    const isPanoCast = forMorpheusType('PanoCast');
    const matchPanoCast = and<PanoCast>(isPanoCast, matchActive);
    const matchActivePanoScene = (s: Scene) =>
      s.casts.some((cast: Cast) => matchPanoCast(cast as MovieCast));

    // Determine if the active scene (first in stack) is a pano or special
    const activeIsPano = stageScenes.length > 0 && matchActivePanoScene(stageScenes[0]);

    const webGl: Scene[] = [];
    const special: Scene[] = [];

    for (const s of stageScenes) {
      const sceneIsPano = matchActivePanoScene(s);
      
      if (sceneIsPano) {
        // Pano scenes go to WebGl
        webGl.push(s);
      } else if (!isPano(s)) {
        // Non-pano scenes go to Special, but only if:
        // - The active scene is NOT a pano (special scene should be visible), OR
        // - This scene is the active scene itself
        if (!activeIsPano || s.sceneId === stageScenes[0]?.sceneId) {
          special.push(s);
        }
      }
    }

    return [webGl, special];
  }, [gamestates, stageScenes]);

  // Split pending scenes into pano vs special for preloading
  const [pendingPanoScenes, pendingSpecialScenes] = useMemo(() => {
    return pendingScenes.reduce(
      ([pano, special], s) => {
        if (isPano(s)) {
          pano.push(s);
        } else {
          special.push(s);
        }
        return [pano, special];
      },
      [[], []] as [Scene[], Scene[]],
    );
  }, [pendingScenes]);

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
        pendingScenes={pendingPanoScenes}
        gamestates={gamestates}
        setCamera={setCamera}
        setPanoObject={setPanoObject}
        rotation={internalRotation}
        volume={volume}
        top={0}
        left={0}
        width={width}
        height={height}
        onSceneReady={onSceneReady}
      />
      <Special
        cursor={cursor}
        setDoneObserver={setSpecialMovieCast}
        stageScenes={specialScenes}
        pendingScenes={pendingSpecialScenes}
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
        onSceneReady={onSceneReady}
      />
      {aggregatedSoundCasts.length > 0 && (
        <Sounds
          soundCasts={aggregatedSoundCasts}
          volume={volume}
          onAudioCastEnded={handleAudioCastEnded}
          onAudioCastCanPlaythrough={handleAudioCastCanPlayThrough}
          onAudioCastRef={onAudioCastRef}
        />
      )}
    </div>
  );
};

export default InteractiveStage;
