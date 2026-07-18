import React, {
  useMemo,
  useEffect,
  PointerEvent,
  useCallback,
  useState,
  useRef,
} from 'react'
import { Gamestates, isActive } from 'morpheus/gamestate/isActive'
import Canvas from './Canvas'
import Videos, { VideoController } from './Videos'
import Images from './Images'
import useComputedStageCast from '../hooks/useRenderables'
import useCastRefNoticer, { CastRef } from '../hooks/useCastRefNoticer'
import loggerFactory from 'utils/logger'
import { Scene, MovieCast, MovieSpecialCast, Cast, SceneCasts } from '../types'
import type { SceneTransitionRequest } from 'morpheus/scene/types'
import { flatten, uniqBy } from 'lodash'
import { forMorpheusType, isImage, isMovie } from '../matchers'
import { Observable, Subscriber } from 'rxjs'
import { share } from 'rxjs/operators'
import { and } from 'utils/matchers'
import { transitionAngleToPanoramaYaw } from 'morpheus/scene/transitionAngle'

const logger = loggerFactory('Special')

const TRANSITION_SCENE_SENTINEL = 0x3fffffff

const isMovieSpecialCast = (cast: MovieCast): cast is MovieSpecialCast =>
  cast.__t === 'MovieSpecialCast'

interface SpecialProps {
  onPointerUp?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerDown?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerMove?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerLeave?: (e: PointerEvent<HTMLCanvasElement>) => void
  stageScenes: Scene[]
  pendingScenes?: Scene[]
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
  onTransition?: (transition: SceneTransitionRequest) => void
  onSceneReady?: (sceneId: number) => void
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
  pendingScenes = [],
  onTransition,
  onSceneReady,
}: SpecialProps) => {
  const [eventSubscriber, setEventSubscriber] =
    useState<null | Subscriber<MovieCast>>()
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
    const observable = new Observable<MovieCast>((subscriber) => {
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
      const casts = movieCasts.filter((cast) =>
        stageScenes.length > 0 && stageScenes[0].casts.includes(cast)
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
      const casts = movieCasts.filter((cast) =>
        stageScenes.length > 0 && stageScenes[0].casts.includes(cast)
      )
      if (eventSubscriber) {
        for (const cast of casts) {
          eventSubscriber.next(cast)
        }
      }
      if (onTransition && stageScenes.length > 0) {
        const currentSceneId = stageScenes[0].sceneId
        for (const cast of casts) {
          if (!isMovieSpecialCast(cast)) {
            continue
          }
          if (!isActive({ cast, gamestates })) {
            continue
          }
          const nextSceneId = cast.nextSceneId
          if (
            !Number.isFinite(nextSceneId) ||
            nextSceneId === TRANSITION_SCENE_SENTINEL ||
            nextSceneId === currentSceneId
          ) {
            continue
          }
          const startAngle = transitionAngleToPanoramaYaw(cast.angleAtEnd)
          onTransition({
            sceneId: nextSceneId,
            dissolve: !!cast.dissolveToNextScene,
            startAngle,
            sourceCastId: cast.castId,
          })
        }
      }
      onVideoCastEndedBare(ref)
    },
    [
      onVideoCastEndedBare,
      eventSubscriber,
      stageScenes,
      gamestates,
      onTransition,
    ]
  )

  const [imageCasts, videoCasts, , renderables] = useComputedStageCast(
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

  // Compute casts for pending scenes (for preloading)
  const pendingSceneCasts = useMemo(() => {
    if (!pendingScenes.length) {
      return { images: [] as MovieCast[], videos: [] as MovieSpecialCast[] }
    }
    const matchActive = (cast: Cast) => isActive({ cast, gamestates })
    const matchSpecialMovies = and<MovieSpecialCast>(
      forMorpheusType('MovieSpecialCast'),
      matchActive
    )
    const movieSpecialCasts = flatten<MovieSpecialCast>(
      pendingScenes.map(
        scene => scene.casts.filter(matchSpecialMovies as (c: Cast) => boolean) as MovieSpecialCast[]
      )
    )
    const images = movieSpecialCasts.filter(isImage) as MovieCast[]
    const videos = movieSpecialCasts.filter(isMovie)
    return { images, videos }
  }, [pendingScenes, gamestates])

  // Merge stage casts with pending scene casts for loading
  const allImageCasts = useMemo(
    () => uniqBy([...imageCasts, ...pendingSceneCasts.images], c => c.castId),
    [imageCasts, pendingSceneCasts.images]
  )
  const allVideoCasts = useMemo(
    () => uniqBy([...videoCasts, ...pendingSceneCasts.videos], c => c.castId),
    [videoCasts, pendingSceneCasts.videos]
  )
  // Track which pending scenes have all their assets ready
  const pendingSceneReadyRef = useRef<Set<number>>(new Set())
  useEffect(() => {
    if (!pendingScenes.length || !onSceneReady) return

    for (const scene of pendingScenes) {
      if (pendingSceneReadyRef.current.has(scene.sceneId)) continue

      // Check if all assets for this scene are loaded
      const sceneCastIds = new Set(scene.casts.map(c => c.castId))
      
      // Check images
      const sceneImageCasts = pendingSceneCasts.images.filter(c => sceneCastIds.has(c.castId))
      const loadedImageCastIds = new Set(imagesLoaded.flatMap(([, casts]) => casts.map(c => c.castId)))
      const allImagesReady = sceneImageCasts.every(c => loadedImageCastIds.has(c.castId))

      // Check videos (canPlayThrough)
      const sceneVideoCasts = pendingSceneCasts.videos.filter(c => sceneCastIds.has(c.castId))
      const loadedVideoCastIds = new Set(canPlayThroughVideos.flatMap(([, casts]) => casts.map(c => c.castId)))
      const allVideosReady = sceneVideoCasts.every(c => loadedVideoCastIds.has(c.castId))

      if (allImagesReady && allVideosReady) {
        pendingSceneReadyRef.current.add(scene.sceneId)
        logger.info({ sceneId: scene.sceneId }, 'Pending scene assets ready')
        onSceneReady(scene.sceneId)
      }
    }
  }, [pendingScenes, pendingSceneCasts, imagesLoaded, canPlayThroughVideos, onSceneReady])

  // Reset ready tracking when pending scenes change
  useEffect(() => {
    const currentPendingIds = new Set(pendingScenes.map(s => s.sceneId))
    for (const id of pendingSceneReadyRef.current) {
      if (!currentPendingIds.has(id)) {
        pendingSceneReadyRef.current.delete(id)
      }
    }
  }, [pendingScenes])

  /**
   * Find all videos that need to be started and stopped
   *
   * To do so we need to look at each video and its casts. If the video is part
   * of the uppermost stage scene, then it should play.  All other videos should
   * end (pause and set currentTime to 0), unless they are also part of the
   * uppermost stage scene
   */
  useEffect(() => {
    const topSceneCastIds = stageScenes.length > 0 
      ? new Set(stageScenes[0].casts.map(c => c.castId))
      : new Set<number>()

    for (const [controller, casts] of availableVideos) {
      const isInTopScene = casts.some(cast => topSceneCastIds.has(cast.castId))
      const isActiveCast = casts.some(cast => isActive({ cast, gamestates }))

      if (isInTopScene && isActiveCast) {
        controller.play()
      } else {
        controller.end()
      }
    }
  }, [availableVideos, stageScenes, gamestates])

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
      {allVideoCasts.length > 0 && (
        <Videos
          movieSpecialCasts={allVideoCasts}
          volume={volume}
          onVideoCastEnded={onVideoCastEnded}
          onVideoCastCanPlaythrough={onVideoCastCanPlayThrough}
          onVideoCastRef={onVideoCastRef}
        />
      )}
      <Images
        movieSpecialCasts={allImageCasts}
        onImageCastLoad={onImageLoad}
        onImageCastError={onImageError}
      />
    </React.Fragment>
  )
}

export default Special
