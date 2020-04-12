import { Gamestates } from 'morpheus/gamestate/isActive'
import { ImageDrawable, VideoRef } from './types'
import {
  MovieCast,
  Scene,
  Cast,
  SupportedSoundCasts,
  MovieSpecialCast,
  ControlledMovieCast,
} from 'morpheus/casts/types'
import { useMemo } from 'react'
import { or, and, Matcher } from 'utils/matchers'
import {
  forMorpheusType,
  isAudio,
  isControlledCast,
  isImage,
  isMovie,
} from 'morpheus/casts/matchers'
import { Renderable } from 'morpheus/casts/components/Canvas'
import {
  matchActiveCast,
  generateRenderables,
  generateMovieCastDrawOps,
  generateControlledRenderables,
} from './transforms'
import { flatten, uniqBy } from 'lodash'

export default function useRenderables(
  gamestates: Gamestates,
  width: number,
  height: number,
  imagesLoaded: ImageDrawable<MovieCast>[],
  availableVideos: VideoRef[],
  cursor: {
    left: number
    top: number
    image: CanvasImageSource | undefined
  },
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
      ) as SupportedSoundCasts[]
    }
    return []
  }, [stageScenes])
  const cursorRenderable = useMemo(() => {
    return (ctx: CanvasRenderingContext2D) => {
      if (cursor.image) {
        const screenPos = {
          x: cursor.left - (cursor.image.width as number) / 2,
          y: cursor.top - (cursor.image.height as number) / 2,
        }
        ctx.drawImage(
          cursor.image,
          0,
          0,
          cursor.image.width as number,
          cursor.image.height as number,
          screenPos.x,
          screenPos.y,
          cursor.image.width as number,
          cursor.image.height as number
        )
      }
    }
  }, [cursor.image, cursor.left, cursor.top])
  const [imageCasts, videoCasts, renderables] = useMemo<
    [MovieCast[], MovieSpecialCast[], Renderable[]]
  >(() => {
    const matchActive = matchActiveCast(gamestates)
    const matchSpecialMovies = and<MovieSpecialCast>(
      forMorpheusType('MovieSpecialCast'),
      matchActive
    )
    const enteringActiveMovieCasts: MovieSpecialCast[] = enteringScene
      ? (enteringScene.casts.filter(
          matchSpecialMovies as Matcher<Cast>
        ) as MovieSpecialCast[])
      : []
    const exitingActiveMovieCasts: MovieSpecialCast[] = exitingScene
      ? (exitingScene.casts.filter(
          matchSpecialMovies as Matcher<Cast>
        ) as MovieSpecialCast[])
      : []

    const stageActiveMovieCasts = flatten<MovieSpecialCast>(
      stageScenes.map(
        scene =>
          scene.casts.filter(
            matchSpecialMovies as Matcher<Cast>
          ) as MovieSpecialCast[]
      )
    )

    const matchControlledMovies = and<ControlledMovieCast>(
      isControlledCast,
      matchActive
    )
    const enterActiveControlledCasts: ControlledMovieCast[] = enteringScene
      ? (enteringScene.casts.filter(
          matchControlledMovies as Matcher<Cast>
        ) as ControlledMovieCast[])
      : []

    const exitingActiveControlledCasts: ControlledMovieCast[] = exitingScene
      ? (exitingScene.casts.filter(
          matchControlledMovies as Matcher<Cast>
        ) as ControlledMovieCast[])
      : []

    const stageActiveControlledCasts = flatten<ControlledMovieCast>(
      stageScenes.map(
        scene =>
          scene.casts.filter(
            matchControlledMovies as Matcher<Cast>
          ) as ControlledMovieCast[]
      )
    )

    const movieSpecialCasts = uniqBy<MovieSpecialCast>(
      [
        ...enteringActiveMovieCasts,
        ...exitingActiveMovieCasts,
        ...stageActiveMovieCasts,
      ],
      (cast: Cast) => cast.castId
    )
    const movieSpecialCastIds = movieSpecialCasts.map(c => c.castId)
    let controlledCasts = uniqBy<ControlledMovieCast>(
      [
        ...enterActiveControlledCasts,
        ...exitingActiveControlledCasts,
        ...stageActiveControlledCasts,
      ],
      (cast: Cast) => cast.castId
    )
    const imageCasts = (movieSpecialCasts.filter(
      isImage
    ) as MovieCast[]).concat(controlledCasts)
    const videoCasts = movieSpecialCasts.filter(isMovie)
    const enteringRenderables = [] as Renderable[]
    const images = movieSpecialCasts.reduce((memo, curr) => {
      const loaded = imagesLoaded.find(([_, casts]) => casts.includes(curr))
      if (loaded) {
        memo.push(loaded)
      }
      return memo
    }, [] as ImageDrawable<MovieCast>[]) as ImageDrawable<MovieSpecialCast>[]

    const controlledCastsDrawable = controlledCasts.reduce((memo, curr) => {
      const loaded = imagesLoaded.find(([_, casts]) => casts.includes(curr))
      if (loaded) {
        memo.push(loaded)
      }
      return memo
    }, [] as ImageDrawable<MovieCast>[]) as ImageDrawable<ControlledMovieCast>[]
    const stageRenderables = [
      ...generateRenderables(
        [
          ...generateMovieCastDrawOps({
            images,
            activeMovieCasts: availableVideos.filter(([videoController]) =>
              videoController.castIds.some(castId =>
                movieSpecialCastIds.includes(castId)
              )
            ),
            width,
            height,
            gamestates,
          }),
        ],
        [
          ...generateControlledRenderables({
            controlledCasts: controlledCastsDrawable,
            width,
            height,
            gamestates,
          }),
        ]
      ),
    ]
    const exitingRenderables = [] as Renderable[]
    return [
      imageCasts,
      videoCasts,
      [...enteringRenderables, ...stageRenderables, ...exitingRenderables],
    ]
  }, [
    enteringScene,
    exitingScene,
    stageScenes,
    gamestates,
    availableVideos,
    imagesLoaded,
    ...deps,
  ])

  return [
    imageCasts,
    videoCasts,
    soundCasts,
    [...renderables, cursorRenderable],
  ]
}
