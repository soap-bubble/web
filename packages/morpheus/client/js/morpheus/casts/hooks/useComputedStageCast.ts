import { useMemo } from 'react'
import { get, uniqBy, flatten, intersection } from 'lodash'
import { isCastActive, Gamestates } from 'morpheus/gamestate/isActive'
import { and, not } from 'utils/matchers'
// @ts-ignore
import { resizeToScreen } from '../../../utils/resize'
import { Renderable } from '../components/Canvas'
import { VideoController } from '../components/Videos'
import {
  Matcher,
  forMorpheusType,
  isMovie,
  isImage,
  isControlledCast,
} from '../matchers'
import {
  Scene,
  MovieCast,
  ControlledMovieCast,
  MovieSpecialCast,
  Cast,
} from '../types'

type DrawSource = HTMLVideoElement | HTMLCanvasElement | HTMLImageElement

interface Rect {
  x: number
  y: number
  sizeX: number
  sizeY: number
}

function calculateControlledFrameOperation({
  cast,
  img,
  gamestates,
  rect,
}: {
  cast: ControlledMovieCast
  img: DrawSource
  gamestates: Gamestates
  rect: Rect
}): Renderable {
  const { controlledMovieCallbacks, width, height } = cast
  const gameStateId = get(controlledMovieCallbacks, '[0].gameState', null)
  const gs = gamestates.byId(gameStateId)
  const value = Math.round(gs.value)
  const frames = get(controlledMovieCallbacks, '[0].frames', 1)
  const currentOffset = value * frames

  const source = {
    x: value * width,
    y: 0,
    sizeX: width,
    sizeY: height,
  }

  return (context: CanvasRenderingContext2D) => {
    if (
      typeof controlledMovieCallbacks[0].currentValue === 'undefined' ||
      frames <= 1
    ) {
      controlledMovieCallbacks[0].currentValue = currentOffset
    } else if (controlledMovieCallbacks[0].currentValue < currentOffset) {
      controlledMovieCallbacks[0].ticks = controlledMovieCallbacks[0].ticks || 0
      if (controlledMovieCallbacks[0].ticks < 4) {
        controlledMovieCallbacks[0].ticks++
      } else {
        controlledMovieCallbacks[0].ticks = 0
        controlledMovieCallbacks[0].currentValue += 1
      }
    } else if (controlledMovieCallbacks[0].currentValue > currentOffset) {
      if (
        controlledMovieCallbacks[0].ticks &&
        controlledMovieCallbacks[0].ticks < 4
      ) {
        controlledMovieCallbacks[0].ticks++
      } else {
        controlledMovieCallbacks[0].ticks = 0
        controlledMovieCallbacks[0].currentValue -= 1
      }
    }
    context.drawImage(
      img,
      Math.floor(controlledMovieCallbacks[0].currentValue) * width,
      source.y,
      source.sizeX,
      source.sizeY,
      rect.x,
      rect.y,
      rect.sizeX,
      rect.sizeY
    )
  }
}

type DrawOperation = [
  DrawSource,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
]

function calculateImageOperation({
  cast,
  img,
  rect,
}: {
  cast: MovieCast
  img: DrawSource
  rect: Rect
}): DrawOperation {
  const { scale = 1, width, height } = cast

  const source = {
    x: 0,
    y: 0,
    sizeX: width,
    sizeY: height,
  }

  return [
    img,
    source.x,
    source.y,
    source.sizeX,
    source.sizeY,
    rect.x * scale,
    rect.y * scale,
    rect.sizeX * scale,
    rect.sizeY * scale,
  ]
}
type CastSource<T, C extends Cast> = [T, C[]]
type ImageDrawable<C extends Cast> = CastSource<DrawSource, C>
type ImageRef = ImageDrawable<MovieSpecialCast>
type ControlledImageRef = ImageDrawable<ControlledMovieCast>
type VideoRef = CastSource<VideoController, MovieSpecialCast>

function* generateMovieCastDrawOps({
  images,
  activeMovieCasts,
  width,
  height,
  gamestates,
}: {
  images: ImageRef[]
  activeMovieCasts: VideoRef[]
  width: number
  height: number
  gamestates: Gamestates
}) {
  const matchActiveImage = matchActiveCast(gamestates)
  const matchActiveImages = and<CastSource<VideoController, MovieCast>>(
    ([_, casts]) => !!casts.length,
    ([_, casts]) => !!casts.find(matchActiveImage)
  )
  for (let image of images) {
    const [img, casts] = image
    for (const cast of casts) {
      const { location } = cast
      yield calculateImageOperation({
        cast,
        img,
        rect: resizeToScreen({
          left: location.x,
          top: location.y,
          right: location.x + cast.width,
          bottom: location.y + cast.height,
          width,
          height,
        }),
      })
    }
  }
  for (let movieRef of activeMovieCasts) {
    const [img, casts] = movieRef
    if (img && casts.length && matchActiveImages(movieRef)) {
      for (const cast of casts) {
        const { location } = cast
        if (img.el) {
          yield calculateImageOperation({
            cast,
            img: img.el,
            rect: resizeToScreen({
              left: location.x,
              top: location.y,
              right: location.x + cast.width,
              bottom: location.y + cast.height,
              width,
              height,
            }),
          })
        }
      }
    }
  }
}

function generateControlledRenderables({
  controlledCasts,
  width,
  height,
  gamestates,
}: {
  controlledCasts: ControlledImageRef[]
  width: number
  height: number
  gamestates: Gamestates
}): Renderable[] {
  return controlledCasts.reduce((memo, [img, casts]) => {
    for (const cast of casts) {
      const location = cast.location || cast.controlledLocation
      memo.push(
        calculateControlledFrameOperation({
          cast,
          img,
          gamestates,
          rect: resizeToScreen({
            left: location.x,
            top: location.y,
            right: location.x + cast.width,
            bottom: location.y + cast.height,
            width,
            height,
          }),
        })
      )
    }
    return memo
  }, [] as Renderable[])
}

function* generateRenderables(ops: DrawOperation[], renderables: Renderable[]) {
  for (let op of ops) {
    yield (ctx: CanvasRenderingContext2D) => ctx.drawImage(...op)
  }
  for (let renderable of renderables) {
    yield (ctx: CanvasRenderingContext2D) => renderable(ctx)
  }
}

function matchActiveCast<T extends Cast>(gamestates: Gamestates): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates })
}

function matchCastIds<T extends Cast>(castIds: number[]) {
  return ([_, casts]: CastSource<any, T>) =>
    casts.find((cast: T) => castIds.includes(cast.castId))
}

type ComputedStageCast = [MovieCast[], MovieSpecialCast[], Renderable[]]
// CastRef<HtmlImageElement, MovieCast>[]
export default function useComputedStageCast(
  gamestates: Gamestates,
  width: number,
  height: number,
  imagesLoaded: ImageDrawable<MovieCast>[],
  availableVideos: VideoRef[],
  cursor: { left: number; top: number; image: CanvasImageSource | undefined },
  // controlledRefs: ImageDrawable<ControlledMovieCast>[],
  stageScenes: Scene[],
  enteringScene: Scene | undefined,
  exitingScene: Scene | undefined,
  deps: any[]
): [MovieCast[], MovieSpecialCast[], Renderable[]] {
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
    ComputedStageCast
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
    console.log(`Computed ${stageRenderables.length} renderables`)
    return [
      imageCasts,
      videoCasts,
      [...enteringRenderables, ...stageRenderables, ...exitingRenderables],
    ] as ComputedStageCast
  }, [
    enteringScene,
    exitingScene,
    stageScenes,
    gamestates,
    availableVideos,
    imagesLoaded,
    ...deps,
  ])

  return [imageCasts, videoCasts, [...renderables, cursorRenderable]]
}
