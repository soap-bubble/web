import { get } from 'lodash'
import { isCastActive, Gamestates } from 'morpheus/gamestate/isActive'
import { Matcher } from 'morpheus/casts/matchers'
import { and } from 'utils/matchers'
import { resizeToScreen } from 'utils/resize'
import { Renderable } from 'morpheus/casts/components/Canvas'
import {
  CastSource,
  DrawOperation,
  DrawSource,
  ImageRef,
  Rect,
  VideoRef,
  ControlledImageRef,
} from './types'
import {
  MovieCast,
  ControlledMovieCast,
  MovieSpecialCast,
  Cast,
} from 'morpheus/casts/types'
import { VideoController } from 'morpheus/casts/components/Videos'
import { render } from 'utils/render'

export function calculateControlledFrameOperation({
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

  const renderable: Renderable = (context: CanvasRenderingContext2D) => {
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
  renderable.description = () =>
    `cast: ${cast.castId} src: ${cast.fileName} gamestateId: ${gameStateId} value: ${value}`
  return renderable
}

export function matchActiveCast<T extends Cast>(
  gamestates: Gamestates
): Matcher<T> {
  return (cast: T) => isCastActive({ cast, gamestates })
}

export function calculateImageOperation({
  cast,
  img,
  rect,
}: {
  cast: MovieCast
  img: DrawSource
  rect: Rect
}): Renderable {
  const { scale = 1, width, height } = cast

  const source = {
    x: 0,
    y: 0,
    sizeX: width,
    sizeY: height,
  }

  const drawOperation: DrawOperation = [
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
  const renderable: Renderable = ctx => ctx.drawImage(...drawOperation)
  renderable.description = () =>
    `cast: ${cast.castId} src: ${cast.fileName} src.x: ${source.x} src.y ${source.y} src.width ${source.sizeX} src.height ${source.sizeY} dest.x ${rect.x} dest.y ${rect.y} width: ${rect.sizeX} height ${rect.sizeY}`
  return renderable
}

export function* generateMovieCastRenderables({
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

export function* generateMovieCastDrawOps({
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

export function generateControlledRenderables({
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
  return controlledCasts.reduce(
    (memo, [img, casts]) => {
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
    },
    [] as Renderable[]
  )
}

export function* generateRenderables(
  renderables: Renderable[]
): Generator<Renderable, void, unknown> {
  for (let renderable of renderables) {
    const r: Renderable = (ctx: CanvasRenderingContext2D) => renderable(ctx)
    if (renderable.description) {
      r.description = renderable.description
    }
    yield r
  }
}

export function computerRenderables(
  images: CastSource<DrawSource, MovieSpecialCast>[],
  activeMovieCasts: CastSource<VideoController, MovieSpecialCast>[],
  controlledCasts: CastSource<DrawSource, ControlledMovieCast>[],
  gamestates: Gamestates,
  width: number,
  height: number
) {
  return [
    ...generateRenderables([
      ...generateMovieCastRenderables({
        images,
        activeMovieCasts,
        width,
        height,
        gamestates,
      }),
      ...generateControlledRenderables({
        controlledCasts,
        width,
        height,
        gamestates,
      }),
    ]),
  ]
}
