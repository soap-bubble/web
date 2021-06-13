import React, {
  useMemo,
  useEffect,
  PointerEvent,
  useCallback,
  useState,
} from 'react'
import { Gamestates, isActive } from 'morpheus/gamestate/isActive'
import Canvas from './Canvas'
import Videos, { VideoController } from './Videos'
import Sounds, { AudioController } from './Sounds'
import Images from './Images'
import useComputedStageCast from '../hooks/useRenderables'
import useCastRefNoticer, { CastRef } from '../hooks/useCastRefNoticer'
import loggerFactory from 'utils/logger'
import {
  Scene,
  MovieCast,
  MovieSpecialCast,
  Cast,
  SupportedSoundCasts,
} from '../types'
import { union } from 'lodash'
import { Observable, observable, Subscription, Subscriber } from 'rxjs'
import { share } from 'rxjs/operators'
import { and } from 'utils/matchers'

const logger = loggerFactory('Special')
interface SpecialProps {
  onPointerUp?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerDown?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerMove?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerLeave?: (e: PointerEvent<HTMLCanvasElement>) => void
  stageScenes: Scene[]
  setDoneObserver: (o: null | Observable<MovieCast>) => void
  cursor?: { top: number; left: number; image: HTMLImageElement | undefined }
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
  const [canPlayThroughSounds, onAudioCastCanPlayThrough] = useCastRefNoticer<
    HTMLAudioElement,
    SupportedSoundCasts
  >()
  const [endedSounds, onAudioCastEndedBare] = useCastRefNoticer<
    HTMLAudioElement,
    SupportedSoundCasts
  >()
  const [availableSounds, onAudioCastRef] = useCastRefNoticer<
    AudioController,
    SupportedSoundCasts
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
      // Find any movieCasts of the uppermost scene
      const casts = movieCasts.filter(cast =>
        stageScenes[0].casts.includes(cast)
      )
      if (eventSubscriber) {
        for (const cast of casts) {
          eventSubscriber.next(cast)
        }
      }
      onImageLoadBare(ref)
    },
    [onImageLoadBare, eventSubscriber, stageScenes]
  )

  const onVideoCastEnded = useCallback(
    (ref: CastRef<HTMLVideoElement, MovieCast>) => {
      const [_, movieCasts] = ref
      // Find any movieCasts of the uppermost scene
      const casts = movieCasts.filter(cast =>
        stageScenes[0].casts.includes(cast)
      )
      if (eventSubscriber) {
        for (const cast of casts) {
          eventSubscriber.next(cast)
        }
      }
      onVideoCastEndedBare(ref)
    },
    [onVideoCastEndedBare, eventSubscriber, stageScenes]
  )

  const onAudioCastEnded = useCallback(
    (ref: CastRef<HTMLAudioElement, SupportedSoundCasts>) => {
      const [_, movieCasts] = ref
      // Find any movieCasts of the uppermost scene
      const casts = movieCasts.filter(cast =>
        stageScenes[0].casts.includes(cast)
      )
      if (eventSubscriber) {
        for (const cast of casts) {
          eventSubscriber.next(cast)
        }
      }
      onAudioCastEndedBare(ref)
    },
    [onAudioCastEndedBare, eventSubscriber, stageScenes]
  )

  const [
    imageCasts,
    videoCasts,
    soundCasts,
    renderables,
  ] = useComputedStageCast(
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
    logger.info({ scenes: stageScenes }, 'stageScenes')
  }, [stageScenes])

  /**
   * Find all videos that need to be started and stopped
   *
   * To do so we need to look at each video and its casts. If the video is part
   * of the uppermost stage scene, then it should play.  All other videos should
   * end (pause and set currentTime to 0), unless they are also part of the
   * uppermost stage scene
   */
  useEffect(() => {
    const activeAndCurrent = and(
      (cast: Cast) =>
        !!stageScenes.length && stageScenes[0].casts.includes(cast),
      (cast: Cast) => isActive({ cast, gamestates })
    )
    for (const [controller, casts] of availableVideos) {
      if (casts.find(activeAndCurrent)) {
        controller.play()
      } else {
        controller.end()
      }
    }
  }, [availableVideos])

  /**
   * Find all sounds that need to be started and stopped. Only looping sounds
   * are stopped when they are no longer upper-most. Non-looping sounds will
   * be allowed to finish naturally
   */
  useEffect(() => {
    const activeAndCurrent = and(
      (cast: Cast) =>
        !!stageScenes.length && stageScenes[0].casts.includes(cast),
      (cast: Cast) => isActive({ cast, gamestates })
    )
    for (const [controller, casts] of availableSounds) {
      if (casts.find(activeAndCurrent)) {
        logger.info({ casts }, `Playing ${controller.url}`)
        controller.play()
      } else {
        logger.info({ casts }, `Stopping ${controller.url}`)
        controller.pause()
      }
    }
  }, [availableSounds])

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
      <Sounds
        soundCasts={soundCasts}
        volume={volume}
        onAudioCastEnded={onAudioCastEnded}
        onAudioCastCanPlaythrough={onAudioCastCanPlayThrough}
        onAudioCastRef={onAudioCastRef}
      />
    </React.Fragment>
  )
}

export default Special
