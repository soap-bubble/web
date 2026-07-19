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
import { isNavigableSceneTarget } from 'morpheus/scene/transitionTarget';
import {
  isPano,
  forMorpheusType,
  isAudio,
  isMovie,
} from 'morpheus/casts/matchers';
import { isCastActive, Gamestates } from '@soapbubble/morpheus-client';
import type {
  Scene,
  PanoCast,
  Cast,
  MovieCast,
  MovieSpecialCast,
  ControlledMovieCast,
  SoundCast,
  SupportedSoundCasts,
} from 'morpheus/casts/types';

import { and, Matcher } from '@/utils/matchers';
import {
  useInputHandler,
  type HarnessClickHandler,
} from '../hooks/useInputHandler';

export interface RotationState {
  x: number;
  y: number;
  offsetX: number;
}

export type ExternalRotation = {
  yaw3600: number;
  pitch: number;
};

export type StageInputController = {
  cancelGesture: () => boolean;
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
  onTransition?: (transition: SceneTransitionRequest) => Promise<boolean>;
  onSceneReady?: (sceneId: number) => void;
  onHarnessClickReady?: (handler: HarnessClickHandler | null) => void;
  inputEnabled?: boolean;
  onStableAction?: () => void;
  onInputControllerReady?: (controller: StageInputController | null) => void;
  skipSceneEntryGeneration?: number | null;
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates });
}

function isControlledMovieCast(cast: Cast): cast is ControlledMovieCast {
  return cast.__t === 'ControlledMovieCast';
}

function isAudioCast(cast: MovieCast | ControlledMovieCast): boolean {
  return cast.audioOnly;
}

function isMovieCastType(cast: Cast): cast is MovieCast {
  return (
    cast.__t === 'MovieCast' ||
    cast.__t === 'PanoCast' ||
    cast.__t === 'PanoAnim' ||
    cast.__t === 'MovieSpecialCast' ||
    cast.__t === 'ControlledMovieCast' ||
    cast.__t === 'SoundCast'
  );
}

function isNonAudioControlledCast(cast: Cast): cast is ControlledMovieCast {
  return isControlledMovieCast(cast) && !isAudioCast(cast);
}

function sceneHasNonAudioControlled(scene: Scene): boolean {
  return scene.casts.some((cast) => isNonAudioControlledCast(cast));
}

function isSpecialCast(
  cast: Cast,
): cast is MovieSpecialCast | ControlledMovieCast {
  return cast.__t === 'MovieSpecialCast' || cast.__t === 'ControlledMovieCast';
}

function isActiveSpecialCast(cast: Cast, gamestates: Gamestates): boolean {
  if (!isSpecialCast(cast)) {
    return false;
  }
  if (isAudioCast(cast)) {
    return false;
  }
  return isCastActive({ cast, gamestates });
}

function isFullscreenCast(cast: Cast): boolean {
  if (!isMovieCastType(cast)) {
    return false;
  }
  return cast.width >= 320 && cast.height >= 200;
}

function sceneHasActiveSpecialCast(
  scene: Scene,
  gamestates: Gamestates,
): boolean {
  return scene.casts.some((cast) => isActiveSpecialCast(cast, gamestates));
}

function sceneHasActiveFullscreenCast(
  scene: Scene,
  gamestates: Gamestates,
): boolean {
  return scene.casts.some(
    (cast) => isActiveSpecialCast(cast, gamestates) && isFullscreenCast(cast),
  );
}

function sceneHasActiveFullscreenMovieSpecialCast(
  scene: Scene,
  gamestates: Gamestates,
): boolean {
  return scene.casts.some(
    (cast) =>
      cast.__t === 'MovieSpecialCast' &&
      isActiveSpecialCast(cast, gamestates) &&
      isMovie(cast) &&
      isFullscreenCast(cast),
  );
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
  onHarnessClickReady,
  inputEnabled = true,
  onStableAction,
  onInputControllerReady,
  skipSceneEntryGeneration = null,
}) => {
  const active = activeScene;
  const [availableSounds, onAudioCastRef] = useCastRefNoticer<
    AudioController,
    SupportedSoundCasts
  >();

  const isPanoScene = useMemo(() => {
    return active ? isPano(active) : false;
  }, [active]);

  const activeHasControlledOverlay = useMemo(() => {
    return active ? sceneHasNonAudioControlled(active) : false;
  }, [active]);

  const { webGlScenes, specialScenes, showPano } = useMemo(() => {
    const matchActive = matchActiveCast(gamestates);
    const isPanoCast = forMorpheusType('PanoCast');
    const matchPanoCast = and<PanoCast>(isPanoCast, matchActive);
    const matchActivePanoScene = (s: Scene) =>
      s.casts.some((cast: Cast) => matchPanoCast(cast as MovieCast));

    const webGl: Scene[] = [];
    const special: Scene[] = [];
    let foundFullscreen = false;
    let allowSpecialStack = true;

    for (const s of stageScenes) {
      if (matchActivePanoScene(s)) {
        webGl.push(s);
      }

      if (foundFullscreen || !allowSpecialStack) {
        continue;
      }

      if (!sceneHasActiveSpecialCast(s, gamestates)) {
        // Stop as soon as a non-special scene is on top of the stack.
        allowSpecialStack = false;
        continue;
      }

      special.push(s);

      if (sceneHasActiveFullscreenCast(s, gamestates)) {
        foundFullscreen = true;
      }
    }

    const hasFullscreenSpecial = special.some((scene) =>
      sceneHasActiveFullscreenCast(scene, gamestates),
    );
    const hasFullscreenMovieSpecial = special.some((scene) =>
      sceneHasActiveFullscreenMovieSpecialCast(scene, gamestates),
    );
    const showPano = !hasFullscreenSpecial || hasFullscreenMovieSpecial;

    return {
      webGlScenes: showPano ? webGl : [],
      specialScenes: special,
      showPano,
    };
  }, [gamestates, stageScenes]);

  // const debugStackSummary = useMemo(() => {
  //   if (process.env.NODE_ENV !== 'development') {
  //     return null;
  //   }
  //   return stageScenes.map((scene) => {
  //     const activeSpecial = scene.casts.filter((cast) =>
  //       isActiveSpecialCast(cast, gamestates),
  //     );
  //     const activeFullscreen = activeSpecial.filter((cast) => isFullscreenCast(cast));
  //     return {
  //       sceneId: scene.sceneId,
  //       activeSpecial: activeSpecial.length,
  //       activeFullscreen: activeFullscreen.length,
  //       hasPano: scene.casts.some((cast) => cast.__t === 'PanoCast'),
  //     };
  //   });
  // }, [gamestates, stageScenes]);

  // const debugText = useMemo(() => {
  //   if (!debugStackSummary) {
  //     return null;
  //   }
  //   return [
  //     `activeScene=${active?.sceneId ?? 'none'}`,
  //     `showPano=${showPano}`,
  //     `webGlScenes=${webGlScenes.map((s) => s.sceneId).join(',') || '[]'}`,
  //     `specialScenes=${specialScenes.map((s) => s.sceneId).join(',') || '[]'}`,
  //     `stack=${debugStackSummary
  //       .map(
  //         (s) =>
  //           `${s.sceneId}[special=${s.activeSpecial},full=${s.activeFullscreen},pano=${s.hasPano}]`,
  //       )
  //       .join(' -> ')}`,
  //   ].join('\n');
  // }, [active?.sceneId, debugStackSummary, showPano, specialScenes, webGlScenes]);

  const enablePanoInput = useMemo(() => {
    return (
      showPano &&
      isPanoScene &&
      specialScenes.length === 0 &&
      !activeHasControlledOverlay
    );
  }, [showPano, isPanoScene, specialScenes.length, activeHasControlledOverlay]);

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

  const [
    internalRotation,
    momentumPointerHandler,
    setInternalRotation,
    momentumController,
  ] = usePanoMomentum(5, 100, targetInternal, onStableAction);

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
  const prevRotationRef = useRef({
    x: internalRotation.x,
    y: internalRotation.y,
  });
  useEffect(() => {
    // Skip if we just synced from Redux
    if (syncingFromReduxRef.current) {
      syncingFromReduxRef.current = false;
      prevRotationRef.current = {
        x: internalRotation.x,
        y: internalRotation.y,
      };
      return;
    }
    if (
      onRotationChange &&
      (prevRotationRef.current.x !== internalRotation.x ||
        prevRotationRef.current.y !== internalRotation.y)
    ) {
      prevRotationRef.current = {
        x: internalRotation.x,
        y: internalRotation.y,
      };
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

  const [cursor, hotspotPointerHandler, clickHotspot, hotspotInputController] =
    useInputHandler({
      scene: active,
      gamestates,
      isPanoScene: enablePanoInput,
      camera,
      panoObject,
      offsetX: internalRotation.offsetX,
      screenLeft: left,
      screenTop: top,
      screenWidth: width,
      screenHeight: height,
      previousSceneId,
      inputEnabled,
      onTransition,
      onActionSettled: onStableAction,
      skipSceneEntryGeneration,
    });

  useEffect(() => {
    onHarnessClickReady?.(inputEnabled ? clickHotspot : null);
    return () => onHarnessClickReady?.(null);
  }, [clickHotspot, inputEnabled, onHarnessClickReady]);

  const inputController = useMemo<StageInputController>(
    () => ({
      cancelGesture() {
        const hotspotCancelled = hotspotInputController.cancelGesture();
        const panoramaCancelled = momentumController.cancelInteraction();
        return hotspotCancelled || panoramaCancelled;
      },
    }),
    [hotspotInputController, momentumController],
  );

  useEffect(() => {
    onInputControllerReady?.(inputController);
    return () => onInputControllerReady?.(null);
  }, [inputController, onInputControllerReady]);

  // Only include momentum handler (pano rotation) when the active scene is a pano
  // This prevents pano rotation when interacting with special/controlled scenes
  const pointerHandler = useMemo(
    () =>
      !inputEnabled
        ? {}
        : enablePanoInput
          ? composePointer([momentumPointerHandler, hotspotPointerHandler])
          : composePointer([hotspotPointerHandler]),
    [
      enablePanoInput,
      hotspotPointerHandler,
      inputEnabled,
      momentumPointerHandler,
    ],
  );

  const { onPointerUp, onPointerMove, onPointerDown, onPointerLeave } =
    pointerHandler;

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
  const isMovieSpecialCastType = useCallback(
    (cast: Cast): cast is MovieSpecialCast => cast.__t === 'MovieSpecialCast',
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
        const isInActiveScene = activeScene.casts.some(
          (sceneCast) => sceneCast.castId === cast.castId,
        );
        if (!isInActiveScene) {
          continue;
        }
        if (!isCastActive({ cast, gamestates })) {
          continue;
        }

        let targetSceneId: number | undefined;
        let dissolve = false;

        if (isSoundCast(cast)) {
          targetSceneId = cast.nextSceneId;
          dissolve = !!cast.dissolveToNextScene;
        } else if (isMovieSpecialCastType(cast)) {
          if (cast.actionAtEnd > 0) {
            targetSceneId = cast.actionAtEnd;
          } else if (cast.nextSceneId !== undefined) {
            targetSceneId = cast.nextSceneId;
          }
          dissolve = !!cast.dissolveToNextScene;
        } else {
          // ControlledMovieCast doesn't have scene transition properties
          continue;
        }

        if (
          !isNavigableSceneTarget(targetSceneId, activeScene.sceneId)
        ) {
          continue;
        }

        onTransition?.({
          sceneId: targetSceneId,
          dissolve,
        });
      }
    },
    [
      activeScene,
      gamestates,
      isSoundCast,
      isMovieSpecialCastType,
      onTransition,
    ],
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
      {showPano && (
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
      )}
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
