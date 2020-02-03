import React, {
  useMemo,
  useEffect,
  PointerEvent,
  useCallback,
  useState,
} from 'react'
import { Dispatch } from 'redux'

import { Gamestates, isActive } from 'morpheus/gamestate/isActive'
import Canvas from './Canvas'
import Videos, { VideoController, VideoCastRefCallback } from './Videos'
import Images from './Images'
import useComputedStageCast from '../hooks/useComputedStageCast'
import useCastRefNoticer, { CastRef } from '../hooks/useCastRefNoticer'
import { Scene, MovieCast, MovieSpecialCast, Cast } from '../types'
import { isUndefined, uniq } from 'lodash'
import { Observable, observable, Subscription, Subscriber } from 'rxjs'
import { DispatchEvent } from '../hooks/useInputHandler'
import { goToScene } from 'morpheus/scene/actions'
import { share } from 'rxjs/operators'

interface SpecialProps {
  onPointerUp?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerDown?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerMove?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerLeave?: (e: PointerEvent<HTMLCanvasElement>) => void
  stageScenes: Scene[]
  setDoneObserver: (o: null | Observable<MovieCast>) => void
  cursor: { top: number; left: number; image: HTMLImageElement | undefined }
  enteringScene?: Scene
  exitingScene?: Scene
  gamestates: Gamestates
  volume: number
  top: number
  left: number
  width: number
  height: number
}

const Special = ({
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  setDoneObserver,
  cursor,
  width,
  volume,
  height,
  top,
  left,
  gamestates,
  enteringScene,
  exitingScene,
  stageScenes,
}: SpecialProps) => {
  const [eventSubscriber, setEventSubscriber] = useState<null | Subscriber<
    MovieCast
  >>()
  const [canPlayThroughVideos, onVideoCastCanPlayThrough] = useCastRefNoticer<
    HTMLVideoElement,
    MovieCast
  >()
  const [endedVideos, onVideoCastEndedBare] = useCastRefNoticer<
    HTMLVideoElement,
    MovieCast
  >()
  const [availableVideos, onVideoCastRef] = useCastRefNoticer<
    VideoController,
    MovieSpecialCast
  >()
  const [imagesLoaded, onImageLoadBare] = useCastRefNoticer<
    HTMLImageElement,
    MovieCast
  >()
  const [imagesErrored, onImageError] = useCastRefNoticer<
    HTMLImageElement,
    MovieCast
  >()
  useEffect(() => {
    const observable = new Observable<MovieCast>(subscriber => {
      setEventSubscriber(subscriber)
      return () => {
        setEventSubscriber(null)
      }
    }).pipe(share())
    setDoneObserver(observable)
  }, [setEventSubscriber, setDoneObserver])

  const onImageLoad = useCallback(
    (ref: CastRef<HTMLImageElement, MovieCast>) => {
      const [_, movieCasts] = ref
      const casts = uniq(
        movieCasts.concat(...(stageScenes.map(s => s.casts) as MovieCast[][]))
      )
      if (eventSubscriber) {
        for (const cast of casts) {
          eventSubscriber.next(cast)
        }
      }
      onImageLoadBare(ref)
    },
    [onImageLoadBare]
  )

  const onVideoCastEnded = useCallback(
    (ref: CastRef<HTMLVideoElement, MovieCast>) => {
      const [_, movieCasts] = ref
      const casts = uniq(
        movieCasts.concat(...(stageScenes.map(s => s.casts) as MovieCast[][]))
      )
      if (eventSubscriber) {
        for (const cast of casts) {
          eventSubscriber.next(cast)
        }
      }
      onVideoCastEndedBare(ref)
    },
    [onVideoCastEndedBare, eventSubscriber]
  )

  const [imageCasts, videoCasts, renderables] = useComputedStageCast(
    gamestates,
    width,
    height,
    imagesLoaded,
    availableVideos,
    cursor,
    stageScenes,
    enteringScene,
    exitingScene,
    [canPlayThroughVideos, endedVideos, imagesErrored]
  )

  useEffect(() => {
    console.log('stageScenes', stageScenes)
  }, [stageScenes])

  useEffect(() => {
    for (const [controller, casts] of availableVideos) {
      if (casts.find(cast => isActive({ cast, gamestates }))) {
        controller.play()
      }
    }
  }, [availableVideos])

  return (
    <React.Fragment>
      <Canvas
        width={width}
        height={height}
        top={top}
        left={left}
        renderables={renderables}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
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

export default Special
