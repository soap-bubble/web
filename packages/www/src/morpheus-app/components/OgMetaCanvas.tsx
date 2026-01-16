import React, {
  useMemo,
  FunctionComponent,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { debounce, map } from 'rxjs/operators';
import Special from 'morpheus/casts/components/Special';
import WebGl from 'morpheus/casts/components/WebGl';
import { useObservable } from 'rxjs-hooks';
import { Gamestates, isCastActive } from '@soapbubble/morpheus-client';
import { Scene, PanoCast, Cast, MovieCast } from 'morpheus/casts/types';
import { useAppDispatch } from '@/morpheus-app/store/hooks';
import { setPendingTransition } from '@/morpheus-app/store/slices/sceneSlice';
import { and, Matcher, not } from '@/utils/matchers';
import { interval, Observable, of } from 'rxjs';
import useRotation from 'morpheus/casts/hooks/useRotation';
import { forMorpheusType, isPano } from 'morpheus/casts/matchers';
import type { SceneTransitionRequest } from 'morpheus/scene/types';

interface StageProps {
  stageScenes: Scene[];
  enteringScene?: Scene;
  exitingScene?: Scene;
  gamestates?: Gamestates;
  rotationX?: number;
  rotationY?: number;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  settled?: () => void;
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates });
}

const OgMetaCanvas: FunctionComponent<StageProps> = ({
  stageScenes,
  enteringScene,
  exitingScene,
  gamestates,
  rotationX = 0,
  rotationY = 0,
  top = 0,
  left = 0,
  width = 800,
  height = 600,
  settled,
}) => {
  const dispatch = useAppDispatch();
  const [specialMovieCast, setSpecialMovieCast] =
    useState<null | Observable<MovieCast>>();
  const debounceCastLoaderObservable = useObservable(() => {
    if (specialMovieCast) {
      return specialMovieCast.pipe(
        debounce(() => interval(750)),
        map(() => true),
      );
    } else {
      return of(false);
    }
  });
  useEffect(() => {
    if (
      debounceCastLoaderObservable === true &&
      typeof settled === 'function'
    ) {
      settled();
    }
  }, [settled, debounceCastLoaderObservable]);
  const rotationController = useRotation();
  useEffect(
    () => rotationController.setRotation(rotationX, rotationY),
    [rotationX, rotationY],
  );
  const rotation = rotationController.rotation;
  const [webGlScenes, specialScenes] = useMemo(() => {
    if (gamestates) {
      const matchActive = matchActiveCast(gamestates);
      const isPanoCast = forMorpheusType('PanoCast');
      const matchPanoCast = and<PanoCast>(isPanoCast, matchActive);
      const matchActivePanoScene = (scene: Scene) =>
        scene.casts.some((cast: Cast) => matchPanoCast(cast as MovieCast));
      return stageScenes.reduce(
        ([webGlScenes, specialScenes], scene) => {
          if (matchActivePanoScene(scene)) {
            webGlScenes.push(scene);
          } else if (!webGlScenes.length && !isPano(scene)) {
            specialScenes.push(scene);
          }
          return [webGlScenes, specialScenes];
        },
        [[], []] as [Scene[], Scene[]],
      );
    }
    return [[], []];
  }, [gamestates, stageScenes]);
  const noop = useMemo(() => () => undefined, []);
  const cursorStub = useMemo(
    () => ({
      top: 0,
      left: 0,
      image: undefined,
    }),
    [],
  );
  const handleSceneTransition = useCallback(
    ({ sceneId, dissolve, startAngle, sourceCastId }: SceneTransitionRequest) => {
      dispatch(setPendingTransition({ sceneId, dissolve, startAngle }));
    },
    [dispatch],
  );
  return (
    <>
      {gamestates && webGlScenes && (
        <WebGl
          setCamera={noop}
          setPanoObject={noop}
          stageScenes={webGlScenes}
          enteringScene={enteringScene}
          exitingScene={exitingScene}
          gamestates={gamestates}
          rotation={rotation}
          volume={0.0}
          top={top}
          left={left}
          width={width}
          height={height}
        />
      )}
      {specialScenes && gamestates && (
        <Special
          setDoneObserver={setSpecialMovieCast}
          cursor={cursorStub}
          stageScenes={specialScenes}
          enteringScene={enteringScene}
          exitingScene={exitingScene}
          gamestates={gamestates}
          volume={0.0}
          top={top}
          left={left}
          width={width}
          height={height}
          onTransition={handleSceneTransition}
        />
      )}
    </>
  );
};

export default OgMetaCanvas;
