'use client';

import { FC, useMemo, useState } from 'react';
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

interface InteractiveStageProps {
  scene: Scene;
  gamestates: Gamestates;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  volume?: number;
  onSceneChange?: (sceneId: number) => void;
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates });
}

const InteractiveStage: FC<InteractiveStageProps> = ({
  scene,
  gamestates,
  width = 800,
  height = 600,
  top = 0,
  left = 0,
  volume = 0.5,
}) => {
  const stageScenes = useMemo(() => [scene], [scene]);

  const isPanoScene = useMemo(() => {
    return scene && isPano(scene);
  }, [scene]);

  const [camera, setCamera] = useState<Camera | undefined>();
  const [panoObject, setPanoObject] = useState<Object3D | undefined>();
  const [specialMovieCast, setSpecialMovieCast] = useState<Observable<MovieCast> | null>(null);

  const [rotation, momentumPointerHandler] = usePanoMomentum(5, 100);

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
    momentumPointerHandler,
    hotspotPointerHandler,
  ]);

  const { onPointerUp, onPointerMove, onPointerDown, onPointerLeave } = pointerHandler;

  const [webGlScenes, specialScenes] = useMemo(() => {
    const matchActive = matchActiveCast(gamestates);
    const isPanoCast = forMorpheusType('PanoCast');
    const matchPanoCast = and<PanoCast>(isPanoCast, matchActive);
    const matchActiveNotPanoScene = and(
      (s: Scene) => s.casts.some((cast: Cast) => matchActive(cast)),
      not(isPano),
    );
    const matchActivePanoScene = (s: Scene) =>
      s.casts.some((cast: Cast) => matchPanoCast(cast as MovieCast));

    return stageScenes.reduce(
      ([webGl, special], s) => {
        if (!webGl.length && matchActiveNotPanoScene(s)) {
          special.push(s);
        } else if (matchActivePanoScene(s)) {
          webGl.push(s);
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
