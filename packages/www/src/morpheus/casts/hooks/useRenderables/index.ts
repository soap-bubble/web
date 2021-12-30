import { Gamestates } from 'morpheus/gamestate/isActive';
import { ImageDrawable, VideoRef } from './types';
import {
  MovieCast,
  Scene,
  Cast,
  SupportedSoundCasts,
  MovieSpecialCast,
  ControlledMovieCast,
} from 'morpheus/casts/types';
import { useMemo } from 'react';
import { or, and, Matcher } from 'utils/matchers';
import {
  forMorpheusType,
  isAudio,
  isControlledCast,
  isImage,
  isMovie,
} from 'morpheus/casts/matchers';
import { Renderable } from 'morpheus/casts/components/Canvas';
import {
  matchActiveCast,
  generateRenderables,
  generateMovieCastDrawOps,
  generateControlledRenderables,
  generateMovieCastRenderables,
} from './transforms';
import { flatten, uniqBy } from 'lodash';
import loggerFactory from 'utils/logger';

const logger = loggerFactory('cast:hooks:useRenderables');
function describeRenderables(renderables: Renderable[]) {
  const describableRenderables = renderables.filter(
    (r) => !!r.description
  ) as Required<Renderable>[];
  return (
    describableRenderables.length &&
    describableRenderables
      .map((r, index) => `${index}: ${r.description()}`)
      .join('\n')
  );
}
export default function useRenderables(
  gamestates: Gamestates,
  width: number,
  height: number,
  imagesLoaded: ImageDrawable<MovieCast>[],
  availableVideos: VideoRef[],
  cursor: {
    left: number;
    top: number;
    image: CanvasImageSource | undefined;
  } = { left: 0, top: 0, image: undefined },
  stageScenes: Scene[],
  enteringScene: Scene | undefined,
  exitingScene: Scene | undefined,
  deps: any[]
): [MovieCast[], MovieSpecialCast[], SupportedSoundCasts[], Renderable[]] {
  const soundCasts = useMemo(() => {
    if (stageScenes.length) {
      return stageScenes[0].casts.filter(
        or(
          and(
            or(
              forMorpheusType('MovieSpecialCast'),
              forMorpheusType('ControlledMovieCast')
            ),
            (cast: Cast) => isAudio(cast as MovieCast)
          ),
          forMorpheusType('SoundCast')
        )
      ) as SupportedSoundCasts[];
    }
    return [];
  }, [stageScenes]);
  const cursorRenderable = useMemo<Renderable>(() => {
    if (cursor?.image) {
      const image: CanvasImageSource = cursor.image;
      const screenPos = {
        x: cursor.left - (image.width as number) / 2,
        y: cursor.top - (image.height as number) / 2,
      };
      const renderable: Renderable = (ctx: CanvasRenderingContext2D) => {
        ctx.drawImage(
          image,
          0,
          0,
          image.width as number,
          image.height as number,
          screenPos.x,
          screenPos.y,
          image.width as number,
          image.height as number
        );
      };

      renderable.description = () =>
        `cursor.x: ${screenPos.x} cursor.y: ${screenPos.y}`;
      return renderable;
    }
    return () => {};
  }, [cursor?.image, cursor?.left, cursor?.top]);
  const [imageCasts, videoCasts, renderables] = useMemo<
    [MovieCast[], MovieSpecialCast[], Renderable[]]
  >((): [MovieCast[], MovieSpecialCast[], Renderable[]] => {
    const matchActive = matchActiveCast(gamestates);
    const matchSpecialMovies = and<MovieSpecialCast>(
      forMorpheusType('MovieSpecialCast'),
      matchActive
    );
    const enteringActiveMovieCasts: MovieSpecialCast[] = enteringScene
      ? (enteringScene.casts.filter(
          matchSpecialMovies as Matcher<Cast>
        ) as MovieSpecialCast[])
      : [];
    const exitingActiveMovieCasts: MovieSpecialCast[] = exitingScene
      ? (exitingScene.casts.filter(
          matchSpecialMovies as Matcher<Cast>
        ) as MovieSpecialCast[])
      : [];

    const stageActiveMovieCasts = flatten<MovieSpecialCast>(
      stageScenes.map(
        (scene) =>
          scene.casts.filter(
            matchSpecialMovies as Matcher<Cast>
          ) as MovieSpecialCast[]
      )
    );

    const matchControlledMovies = and<ControlledMovieCast>(
      isControlledCast,
      matchActive
    );
    const enterActiveControlledCasts: ControlledMovieCast[] = enteringScene
      ? (enteringScene.casts.filter(
          matchControlledMovies as Matcher<Cast>
        ) as ControlledMovieCast[])
      : [];

    const exitingActiveControlledCasts: ControlledMovieCast[] = exitingScene
      ? (exitingScene.casts.filter(
          matchControlledMovies as Matcher<Cast>
        ) as ControlledMovieCast[])
      : [];

    const stageActiveControlledCasts = flatten<ControlledMovieCast>(
      stageScenes.map(
        (scene) =>
          scene.casts.filter(
            matchControlledMovies as Matcher<Cast>
          ) as ControlledMovieCast[]
      )
    );

    const movieSpecialCasts = uniqBy<MovieSpecialCast>(
      [
        ...enteringActiveMovieCasts,
        ...exitingActiveMovieCasts,
        ...stageActiveMovieCasts,
      ],
      (cast: Cast) => cast.castId
    );
    const movieSpecialCastIds = movieSpecialCasts.map((c) => c.castId);
    let controlledCasts = uniqBy<ControlledMovieCast>(
      [
        ...enterActiveControlledCasts,
        ...exitingActiveControlledCasts,
        ...stageActiveControlledCasts,
      ],
      (cast: Cast) => cast.castId
    );
    const imageCasts = (
      movieSpecialCasts.filter(isImage) as MovieCast[]
    ).concat(controlledCasts);
    const videoCasts = movieSpecialCasts.filter(isMovie);
    const enteringRenderables = [] as Renderable[];
    const images = movieSpecialCasts.reduce((memo, curr) => {
      const loaded = imagesLoaded.find(([_, casts]) => casts.includes(curr));
      if (loaded) {
        memo.push(loaded);
      }
      return memo;
    }, [] as ImageDrawable<MovieCast>[]) as ImageDrawable<MovieSpecialCast>[];

    const controlledCastsDrawable = controlledCasts.reduce((memo, curr) => {
      const loaded = imagesLoaded.find(([_, casts]) => casts.includes(curr));
      if (loaded) {
        memo.push(loaded);
      }
      return memo;
    }, [] as ImageDrawable<MovieCast>[]) as ImageDrawable<ControlledMovieCast>[];
    const stageRenderables = [
      ...generateRenderables([
        ...generateMovieCastRenderables({
          images,
          activeMovieCasts: availableVideos.filter(([videoController]) =>
            videoController.castIds.some((castId) =>
              movieSpecialCastIds.includes(castId)
            )
          ),
          width,
          height,
          gamestates,
        }),
        ...generateControlledRenderables({
          controlledCasts: controlledCastsDrawable,
          width,
          height,
          gamestates,
        }),
      ]),
    ];
    const exitingRenderables = [] as Renderable[];

    // logger.info({
    //   imageCasts,
    //   videoCasts,
    //   enteringRenderables: describeRenderables(enteringRenderables),
    //   stageRenderables: describeRenderables(stageRenderables),
    //   exitingRenderables: describeRenderables(exitingRenderables),
    // })
    return [
      imageCasts,
      videoCasts,
      [...enteringRenderables, ...stageRenderables, ...exitingRenderables],
    ];
  }, [
    enteringScene,
    exitingScene,
    stageScenes,
    gamestates,
    availableVideos,
    imagesLoaded,
    ...deps,
  ]);

  return [
    imageCasts,
    videoCasts,
    soundCasts,
    [...renderables, cursorRenderable],
  ];
}
