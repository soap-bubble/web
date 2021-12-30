import React, { useMemo, FunctionComponent, useState, useEffect } from 'react';
import { Dispatch } from 'redux';
import Special from './Special';
import WebGL from './WebGl';
import useRaf from '@rooks/use-raf';
import { Gamestates, isCastActive } from 'morpheus/gamestate/isActive';
import { Scene, PanoCast, Cast, MovieCast } from '../types';
import { and, Matcher, not } from 'utils/matchers';
import usePanoMomentum from '../hooks/panoMomentum';
import useInputHandler, { DispatchEvent } from '../hooks/useInputHandler';
import { composePointer } from 'morpheus/hotspot/eventInterface';
import { forMorpheusType, isPano } from '../matchers';
import { Camera, Object3D, PerspectiveCamera } from 'three';
import { Observable, Subscription } from 'rxjs';

interface StageProps {
  dispatch: Dispatch;
  stageScenes: Scene[];
  enteringScene?: Scene;
  exitingScene?: Scene;
  gamestates: Gamestates;
  volume: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates });
}

const Stage: FunctionComponent<StageProps> = ({
  dispatch,
  stageScenes,
  enteringScene,
  exitingScene,
  gamestates,
  volume,
  top,
  left,
  width,
  height,
}) => {
  const isPanoScene = useMemo(() => {
    return stageScenes[0] && isPano(stageScenes[0]);
  }, [stageScenes[0]]);
  const [camera, setCamera] = useState<Camera | undefined>();
  const [specialMovieCast, setSpecialMovieCast] =
    useState<null | Observable<MovieCast>>();
  const [panoObject, setPanoObject] = useState<Object3D | undefined>();

  const [rotation, momentumPointerHandler] = usePanoMomentum(5, 100);

  const [cursor, hotspotPointerHandler] = useInputHandler(
    stageScenes[0],
    gamestates,
    specialMovieCast,
    isPanoScene,
    camera,
    panoObject,
    rotation.offsetX,
    rotation.x,
    left,
    top,
    width,
    height
  );

  const pointerHandler = composePointer([
    momentumPointerHandler,
    hotspotPointerHandler,
  ]);
  const { onPointerUp, onPointerMove, onPointerDown, onPointerLeave } =
    pointerHandler;
  const [webGlScenes, specialScenes] = useMemo(() => {
    const matchActive = matchActiveCast(gamestates);
    const isPanoCast = forMorpheusType('PanoCast');
    const matchPanoCast = and<PanoCast>(isPanoCast, matchActive);
    const matchActiveNotPanoScene = and(
      (scene: Scene) => scene.casts.some((cast) => matchActive(cast)),
      not(isPano)
    );
    const matchActivePanoScene = (scene: Scene) =>
      scene.casts.some((cast: Cast) => matchPanoCast(cast as MovieCast));
    return stageScenes.reduce(
      ([webGlScenes, specialScenes], scene) => {
        if (!webGlScenes.length && matchActiveNotPanoScene(scene)) {
          specialScenes.push(scene);
        } else if (matchActivePanoScene(scene)) {
          webGlScenes.push(scene);
        }
        return [webGlScenes, specialScenes];
      },
      [[], []] as [Scene[], Scene[]]
    );
  }, [gamestates, stageScenes]);
  return (
    <>
      <WebGL
        stageScenes={webGlScenes}
        enteringScene={enteringScene}
        exitingScene={exitingScene}
        gamestates={gamestates}
        setCamera={setCamera}
        setPanoObject={setPanoObject}
        rotation={rotation}
        volume={volume}
        top={top}
        left={left}
        width={width}
        height={height}
      />
      <Special
        cursor={cursor}
        setDoneObserver={setSpecialMovieCast}
        stageScenes={specialScenes}
        enteringScene={enteringScene}
        exitingScene={exitingScene}
        gamestates={gamestates}
        volume={volume}
        top={top}
        left={left}
        width={width}
        height={height}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
    </>
  );
};

export default Stage;
