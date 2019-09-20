import React, { useState, useCallback, useMemo, SyntheticEvent } from 'react'
import { Dispatch } from 'redux'
import { useEventCallback } from 'rxjs-hooks'
import { map, withLatestFrom, combineLatest } from 'rxjs/operators'
import { get, uniqBy, flatten } from 'lodash'

import {
  special as specialInputHandlerFactory,
  eventInterface,
  // @ts-ignore
} from 'morpheus/hotspot'
import { Observable } from 'rxjs'
import { isCastActive, Gamestates } from 'morpheus/gamestate/isActive'
import { and, not } from 'utils/matchers'
import { resizeToScreen, generateMovieTransform } from 'utils/resize'

import Canvas, { Renderable, render } from './Canvas'
import {
  Matcher,
  isMovie,
  isImage,
  isAudio,
  isControlledCast,
} from '../matchers'
import Videos, {
  VideoController,
  VideoCastEventCallback,
  VideoCastRefCallback,
} from './Videos'
import Images from './Images'
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
      rect.sizeY,
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

interface CastContainer<T extends Cast> {
  casts: T[]
}

interface ImageDrawable<T extends MovieCast> extends CastContainer<T> {
  el: DrawSource
}
type ImageRef = ImageDrawable<MovieSpecialCast>
type ControlledImageRef = ImageDrawable<ControlledMovieCast>

interface VideoRef extends CastContainer<MovieSpecialCast> {
  ref: VideoController
}

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
  const generatedImages: DrawOperation[] = []
  const matchActiveImage = matchActiveCast(gamestates)
  const matchActiveImages: Matcher<CastContainer<MovieCast>> = and<
    CastContainer<MovieCast>
  >(
    ({ casts }) => !!casts.length,
    ({ casts }) => !!casts.find(matchActiveImage),
  )
  for (let image of images) {
    const { el: img, casts } = image
    const cast = casts[0]
    const location = cast.location
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
  for (let movieRef of activeMovieCasts) {
    const {
      casts,
      ref: { el: img },
    } = movieRef
    if (img && casts.length && matchActiveImages(movieRef)) {
      const cast = casts[0]
      const location = cast.location
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
  return controlledCasts.map(({ casts, el: img }) => {
    const cast = casts[0]
    const location = cast.location || cast.controlledLocation
    return calculateControlledFrameOperation({
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
  }, {})
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
  return ({ casts }: CastContainer<T>) =>
    casts.find((cast: T) => castIds.includes(cast.castId))
}

interface ComputedStageCast {
  imageCasts: MovieCast[]
  videoCasts: MovieCast[]
  enteringRenderables: Renderable[]
  stageRenderables: Renderable[]
  exitingRenderables: Renderable[]
}

function useComputedStageCast(
  gamestates: Gamestates,
  width: number,
  height: number,
  imageRefs: ImageDrawable<MovieSpecialCast>[],
  controlledRefs: ImageDrawable<ControlledMovieCast>[],
  videoRefs: VideoRef[],
  stageScenes: Scene[],
  enteringScene?: Scene,
  exitingScene?: Scene,
) {
  return useMemo<ComputedStageCast>(() => {
    const matchActive = matchActiveCast(gamestates)
    const matchActiveMovie = and<MovieSpecialCast>(isMovie, matchActive)
    const enteringActiveMovieCasts: MovieSpecialCast[] = enteringScene
      ? (enteringScene.casts.filter(matchActiveMovie as Matcher<
          Cast
        >) as MovieSpecialCast[])
      : []
    const exitingActiveMovieCasts: MovieSpecialCast[] = exitingScene
      ? (exitingScene.casts.filter(matchActiveMovie as Matcher<
          Cast
        >) as MovieSpecialCast[])
      : []

    const stageActiveMovieCasts = flatten<MovieSpecialCast>(
      stageScenes.map(
        scene =>
          scene.casts.filter(matchActiveMovie as Matcher<
            Cast
          >) as MovieSpecialCast[],
      ),
    )

    const matchControlledMovies = and<ControlledMovieCast>(
      isControlledCast,
      matchActive,
    )
    const enterActiveControlledCasts: ControlledMovieCast[] = enteringScene
      ? (enteringScene.casts.filter(matchControlledMovies as Matcher<
          Cast
        >) as ControlledMovieCast[])
      : []

    const exitingActiveControlledCasts: ControlledMovieCast[] = exitingScene
      ? (exitingScene.casts.filter(matchControlledMovies as Matcher<
          Cast
        >) as ControlledMovieCast[])
      : []

    const stageActiveControlledCasts = flatten<ControlledMovieCast>(
      stageScenes.map(
        scene =>
          scene.casts.filter(matchControlledMovies as Matcher<
            Cast
          >) as ControlledMovieCast[],
      ),
    )

    const movieSpecialCasts = uniqBy<MovieSpecialCast>(
      [
        ...enteringActiveMovieCasts,
        ...exitingActiveMovieCasts,
        ...stageActiveMovieCasts,
      ],
      (cast: Cast) => cast.castId,
    )
    const movieSpecialCastIds = movieSpecialCasts.map(
      (cast: Cast) => cast.castId,
    )
    const matchMovieSpecialCasts = matchCastIds(movieSpecialCastIds)
    const controlledCasts = uniqBy<ControlledMovieCast>(
      [
        ...enterActiveControlledCasts,
        ...exitingActiveControlledCasts,
        ...stageActiveControlledCasts,
      ],
      (cast: Cast) => cast.castId,
    )
    const controlledCastIds = controlledCasts.map(cast => cast.castId)
    const matchControlledCasts = matchCastIds(controlledCastIds)

    return {
      imageCasts: movieSpecialCasts.filter(isImage),
      videoCasts: movieSpecialCasts.filter(isMovie),
      enteringRenderables: [],
      stageRenderables: [
        ...generateRenderables(
          [
            ...generateMovieCastDrawOps({
              images: imageRefs.filter(matchMovieSpecialCasts),
              activeMovieCasts: videoRefs.filter(matchMovieSpecialCasts),
              width,
              height,
              gamestates,
            }),
          ],
          [
            ...generateControlledRenderables({
              controlledCasts: controlledRefs.filter(matchControlledCasts),
              width,
              height,
              gamestates,
            }),
          ],
        ),
      ],
      exitingRenderables: [],
    } as ComputedStageCast
  }, [enteringScene, exitingScene, stageScenes, gamestates])
}

function useCastEventNoticer<T, C extends Cast>(): [
  (e: T, cast: C[]) => void,
  C[]
] {
  const [onCastEventedSpread, events] = useEventCallback<[T, C[]], C[]>(
    (event$: Observable<[T, C[]]>, state$: Observable<C[]>) =>
      event$.pipe(
        withLatestFrom(state$),
        map(([[el, casts], state]) => [...state, ...casts] as C[]),
      ),
    [] as C[],
  )
  const onCastEvented = useCallback(
    (e: T, casts: C[]) => onCastEventedSpread([e, casts]),
    [onCastEventedSpread],
  )
  return [onCastEvented, events]
}

function useCastRefNoticer<T, C extends Cast>(): [
  (e: T, cast: C[]) => void,
  ({ ref: T; casts: C[] })[]
] {
  const [onCastRefSpread, refs] = useEventCallback<
    [T, C[]],
    ({ ref: T; casts: C[] })[]
  >(
    (
      event$: Observable<[T, C[]]>,
      state$: Observable<({ ref: T; casts: C[] })[]>,
    ) =>
      event$.pipe(
        withLatestFrom(state$),
        map(([[ref, casts], state]) => {
          if (ref) {
            return [...state, { ref, casts }] as ({ ref: T; casts: C[] })[]
          }
          return [...state.filter(s => s.ref === ref)]
        }),
      ),
    [] as ({ ref: T; casts: C[] })[],
  )

  const onCastRef = useCallback(
    (e: T, casts: C[]) => onCastRefSpread([e, casts]),
    [onCastRefSpread],
  )
  return [onCastRef, refs]
}

interface StageProps {
  dispatch: Dispatch
  stageScenes: Scene[]
  enteringScene?: Scene
  exitingScene?: Scene
  gamestates: Gamestates
  volume: number
  style: object
  width: number
  height: number
}

const Stage = ({
  dispatch,
  width,
  volume,
  height,
  style,
  gamestates,
  enteringScene,
  exitingScene,
  stageScenes,
}: StageProps) => {
  const [imageRefs, setImageRefs] = useState<ImageRef[]>([])
  const [controlledRefs, setControlledRefs] = useState<ControlledImageRef[]>([])
  const [videoRefs, setVideoRefs] = useState<VideoRef[]>([])

  const {
    imageCasts,
    videoCasts,
    enteringRenderables,
    stageRenderables,
    exitingRenderables,
  } = useComputedStageCast(
    gamestates,
    width,
    height,
    imageRefs,
    controlledRefs,
    videoRefs,
    stageScenes,
    enteringScene,
    exitingScene,
  )

  const specialHandler = useMemo(
    () =>
      eventInterface.touchDisablesMouse(
        specialInputHandlerFactory({
          dispatch,
          scene: stageScenes[0],
        }),
      ),
    [stageScenes[0]],
  )

  const [onVideoCastCanPlayThrough, canPlayThroughVideos] = useCastEventNoticer<
    SyntheticEvent<HTMLVideoElement>,
    MovieCast
  >()
  const [onVideoCastEnded, endedVideos] = useCastEventNoticer<
    SyntheticEvent<HTMLVideoElement>,
    MovieCast
  >()
  const [onVideoCastRef, availableVideos] = useCastRefNoticer<
    VideoController,
    MovieCast
  >()
  const [onImageLoad, imagesLoaded] = useCastEventNoticer<
    SyntheticEvent<HTMLImageElement>,
    MovieCast
  >()
  const [onImageError, imagesErrored] = useCastEventNoticer<
    SyntheticEvent<HTMLImageElement>,
    MovieCast
  >()
  return (
    <React.Fragment>
      <Canvas
        width={width}
        height={height}
        style={style}
        enteringRenderables={enteringRenderables}
        stageRenderables={stageRenderables}
        exitingRenderables={exitingRenderables}
        onMouseDown={specialHandler.onMouseDown}
        onMouseMove={specialHandler.onMouseMove}
        onMouseUp={specialHandler.onMouseUp}
        onTouchStart={specialHandler.onTouchStart}
        onTouchMove={specialHandler.onTouchMove}
        onTouchEnd={specialHandler.onTouchEnd}
        onTouchCancel={specialHandler.onTouchCancel}
      />
      <Videos
        movieSpecialCasts={videoCasts}
        volume={volume}
        onVideoCastEnded={onVideoCastEnded}
        onVideoCastCanPlaythrough={onVideoCastCanPlayThrough}
        onVideoCastRef={onVideoCastRef}
      />
      <Images
        movieSpecialCasts={imageCasts}
        onImageCastLoad={onImageLoad}
        onImageCastError={onImageError}
      />
    </React.Fragment>
  )
}
