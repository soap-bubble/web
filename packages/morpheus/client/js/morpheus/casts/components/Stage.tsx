import React, { useState, useCallback, useMemo, SyntheticEvent } from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { useEventCallback } from 'rxjs-hooks'
import { map, withLatestFrom } from 'rxjs/operators'
import { get, uniqBy, flatten } from 'lodash'

import {
  special as specialInputHandlerFactory,
  eventInterface,
  // @ts-ignore
} from 'morpheus/hotspot'
import {
  selectors as gameSelectors,
  // @ts-ignore
} from 'morpheus/game'
import { Observable, Subscribable } from 'rxjs'
// @ts-ignore
import { selectors as gamestateSelectors } from 'morpheus/gamestate'
import { isCastActive, Gamestates } from 'morpheus/gamestate/isActive'
import { and, not } from 'utils/matchers'
// @ts-ignore
import { resizeToScreen } from '../../../utils/resize'

import Canvas, { Renderable, render } from './Canvas'
import { Matcher, isMovie, isImage, isControlledCast } from '../matchers'
import Videos, { VideoController, VideoCastRefCallback } from './Videos'
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
  number,
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
  const generatedImages: DrawOperation[] = []
  const matchActiveImage = matchActiveCast(gamestates)
  const matchActiveImages = and<CastSource<any, MovieCast>>(
    ([_, casts]) => !!casts.length,
    ([_, casts]) => !!casts.find(matchActiveImage),
  )
  for (let image of images) {
    const [img, casts] = image
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
    const [img, casts] = movieRef
    if (img && casts.length && matchActiveImages(movieRef)) {
      const cast = casts[0]
      const location = cast.location
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
  return controlledCasts.map(([img, casts]) => {
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
  return ([_, casts]: CastSource<any, T>) =>
    casts.find((cast: T) => castIds.includes(cast.castId))
}

interface ComputedStageCast {
  imageCasts: MovieSpecialCast[]
  videoCasts: MovieSpecialCast[]
  enteringRenderables: Renderable[]
  stageRenderables: Renderable[]
  exitingRenderables: Renderable[]
}
// CastRef<HtmlImageElement, MovieCast>[]
function useComputedStageCast(
  gamestates: Gamestates,
  width: number,
  height: number,
  imagesLoaded: ImageDrawable<MovieCast>[],
  availableVideos: VideoRef[],
  // controlledRefs: ImageDrawable<ControlledMovieCast>[],
  stageScenes: Scene[],
  enteringScene: Scene | undefined,
  exitingScene: Scene | undefined,
  deps: any[],
) {
  return useMemo<ComputedStageCast>(() => {
    const matchActive = matchActiveCast(gamestates)
    const enteringActiveMovieCasts: MovieSpecialCast[] = enteringScene
      ? (enteringScene.casts.filter(matchActive as Matcher<
          Cast
        >) as MovieSpecialCast[])
      : []
    const exitingActiveMovieCasts: MovieSpecialCast[] = exitingScene
      ? (exitingScene.casts.filter(matchActive as Matcher<
          Cast
        >) as MovieSpecialCast[])
      : []

    const stageActiveMovieCasts = flatten<MovieSpecialCast>(
      stageScenes.map(
        scene =>
          scene.casts.filter(matchActive as Matcher<
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

    const imageCasts = movieSpecialCasts.filter(isImage)
    const videoCasts = movieSpecialCasts.filter(isMovie)
    const enteringRenderables = [] as Renderable[]
    const stageRenderables = [
      ...generateRenderables(
        [
          ...generateMovieCastDrawOps({
            images: imagesLoaded.filter(
              matchMovieSpecialCasts,
            ) as ImageDrawable<MovieSpecialCast>[],
            activeMovieCasts: availableVideos.filter(matchMovieSpecialCasts),
            width,
            height,
            gamestates,
          }),
        ],
        [
          ...generateControlledRenderables({
            controlledCasts: imagesLoaded.filter(
              matchControlledCasts,
            ) as ImageDrawable<ControlledMovieCast>[],
            width,
            height,
            gamestates,
          }),
        ],
      ),
    ]
    const exitingRenderables = [] as Renderable[]

    return {
      imageCasts,
      videoCasts,
      enteringRenderables,
      stageRenderables,
      exitingRenderables,
    } as ComputedStageCast
  }, [
    enteringScene,
    exitingScene,
    stageScenes,
    gamestates,
    availableVideos,
    imagesLoaded,
    ...deps,
  ])
}

type CastRef<T, C extends Cast> = [T, C[]]

function useCastEventNoticer<T, C extends Cast>(
  subs?: Subscribable<[T, C[]]>,
): [CastRef<T, C>[], (ref: CastRef<T, C>) => void] {
  const [onCastEventedSpread, events] = useEventCallback<
    CastRef<T, C>,
    CastRef<T, C>[]
  >(
    (event$: Observable<CastRef<T, C>>, state$: Observable<CastRef<T, C>[]>) =>
      event$.pipe(
        withLatestFrom(state$),
        map(([[el, casts], state]) => {
          return [...state, [el, casts]] as CastRef<T, C>[]
        }),
      ),
    [] as CastRef<T, C>[],
  )
  const onCastEvented = useCallback(
    (e: CastRef<T, C>) => onCastEventedSpread(e),
    [onCastEventedSpread],
  )
  return [events, onCastEvented]
}

function useCastRefNoticer<T, C extends Cast>(
  obs?: Observable<[T, C[]]>,
): [CastRef<T, C>[], (ref: CastRef<T, C>) => void] {
  const [onCastRefSpread, refs] = useEventCallback<[T, C[]], CastRef<T, C>[]>(
    (event$: Observable<[T, C[]]>, state$: Observable<(CastRef<T, C>)[]>) =>
      event$.pipe(
        withLatestFrom(state$),
        map(([[ref, inCast], state]) => {
          if (ref) {
            return [...state, [ref, inCast]] as CastRef<T, C>[]
          }
          return [
            ...state.reduce(
              (memo, e) => {
                const [ref, casts] = e
                if (!casts.find(c => inCast.includes(c))) {
                  memo.push(e)
                } else if (casts.length == 1) {
                  return memo
                } else {
                  memo.push([ref, casts.filter(c => inCast.includes(c))])
                }
                return memo
              },
              [] as CastRef<T, C>[],
            ),
          ]
        }),
      ),
    [] as CastRef<T, C>[],
  )

  const onCastRef = useCallback((ref: CastRef<T, C>) => onCastRefSpread(ref), [
    onCastRefSpread,
  ])
  return [refs, onCastRef]
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
  const [canPlayThroughVideos, onVideoCastCanPlayThrough] = useCastRefNoticer<
    HTMLVideoElement,
    MovieCast
  >()
  const [endedVideos, onVideoCastEnded] = useCastRefNoticer<
    HTMLVideoElement,
    MovieCast
  >()
  const [availableVideos, onVideoCastRef] = useCastRefNoticer<
    VideoController,
    MovieSpecialCast
  >()
  const [imagesLoaded, onImageLoad] = useCastRefNoticer<
    HTMLImageElement,
    MovieCast
  >()
  const [imagesErrored, onImageError] = useCastRefNoticer<
    HTMLImageElement,
    MovieCast
  >()

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
    imagesLoaded,
    availableVideos,
    stageScenes,
    enteringScene,
    exitingScene,
    [canPlayThroughVideos, endedVideos, imagesErrored],
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

interface StateProps {
  width: number
  height: number
  volume: number
  style: object
  gamestates: Gamestates
}

export default connect<StateProps>(state => ({
  width: gameSelectors.width(state),
  height: gameSelectors.height(state),
  style: gameSelectors.style(state),
  volume: gameSelectors.htmlVolume(state),
  gamestates: gamestateSelectors.forState(state),
}))(Stage)
