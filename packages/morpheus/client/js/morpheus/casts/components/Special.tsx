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
import { Scene, MovieCast, MovieSpecialCast } from '../types'
import type { SceneTransitionRequest } from 'morpheus/scene/types'
import { flatten, uniqBy } from 'lodash'
import {
  isControlledMovieCast,
  isImage,
  isMovie,
  isMovieSpecialCast,
  isVisualSpecialCast,
} from '../matchers'
import { Observable, Subscriber } from 'rxjs'
import { share } from 'rxjs/operators'
import { transitionAngleToPanoramaYaw } from 'morpheus/scene/transitionAngle'
import { isNavigableSceneTarget } from 'morpheus/scene/transitionTarget'
import type { MediaPlaybackResult } from './mediaPlayback'
import type { ScenePresentationRequest } from '../presentation'

const logger = loggerFactory('Special')
const noPresentedVideoCastIds = new Set<number>()

interface SpecialProps {
  onPointerUp?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerDown?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerMove?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerCancel?: (e: PointerEvent<HTMLCanvasElement>) => void
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
  onSceneAssetsReady?: (sceneId: number) => void
  presentation?: ScenePresentationRequest
  onScenePresented?: (presentation: ScenePresentationRequest) => void
}

const Special = ({
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
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
  onSceneAssetsReady,
  presentation,
  onScenePresented,
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
  const [presentedVideoFrames, setPresentedVideoFrames] = useState<{
    key: string
    castIds: Set<number>
  }>({ key: '', castIds: new Set() })
  const [blockedVideoControllers, setBlockedVideoControllers] = useState<
    VideoController[]
  >([])
  const activeVideoControllersRef = useRef<Set<VideoController>>(new Set())
  const videoPlaybackAttemptRef = useRef<WeakMap<VideoController, number>>(
    new WeakMap()
  )
  const retryingVideoControllersRef = useRef<WeakSet<VideoController>>(
    new WeakSet()
  )
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
      const casts = movieCasts.filter(
        (cast) => stageScenes.length > 0 && stageScenes[0].casts.includes(cast)
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
      const casts = movieCasts.filter(
        (cast) => stageScenes.length > 0 && stageScenes[0].casts.includes(cast)
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
          if (!isNavigableSceneTarget(nextSceneId, currentSceneId)) {
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
    const visualCasts = flatten<MovieCast>(
      pendingScenes.map(
        (scene) =>
          scene.casts.filter(
            (cast) =>
              isActive({ cast, gamestates }) && isVisualSpecialCast(cast)
          ) as MovieCast[]
      )
    )
    const images = visualCasts.filter(
      (cast) =>
        isControlledMovieCast(cast) ||
        (isMovieSpecialCast(cast) && isImage(cast))
    )
    const videos = visualCasts.filter(
      (cast): cast is MovieSpecialCast =>
        isMovieSpecialCast(cast) && isMovie(cast)
    )
    return { images, videos }
  }, [pendingScenes, gamestates])

  // Merge stage casts with pending scene casts for loading
  const allImageCasts = useMemo(
    () => uniqBy([...imageCasts, ...pendingSceneCasts.images], (c) => c.castId),
    [imageCasts, pendingSceneCasts.images]
  )
  const allVideoCasts = useMemo(
    () => uniqBy([...videoCasts, ...pendingSceneCasts.videos], (c) => c.castId),
    [videoCasts, pendingSceneCasts.videos]
  )
  // Track which pending scenes have all their assets ready
  const pendingSceneReadyRef = useRef<Set<number>>(new Set())
  useEffect(() => {
    if (!pendingScenes.length || !onSceneAssetsReady) return

    const loadedImageCastIds = new Set(
      imagesLoaded.flatMap(([, casts]) => casts.map((cast) => cast.castId))
    )
    const loadedVideoCastIds = new Set(
      canPlayThroughVideos.flatMap(([, casts]) =>
        casts.map((cast) => cast.castId)
      )
    )

    for (const scene of pendingScenes) {
      if (pendingSceneReadyRef.current.has(scene.sceneId)) continue

      // Check if all assets for this scene are loaded
      const sceneCastIds = new Set(scene.casts.map((c) => c.castId))

      // Check images
      const sceneImageCasts = pendingSceneCasts.images.filter((c) =>
        sceneCastIds.has(c.castId)
      )
      const allImagesReady = sceneImageCasts.every((c) =>
        loadedImageCastIds.has(c.castId)
      )

      // Check videos (canPlayThrough)
      const sceneVideoCasts = pendingSceneCasts.videos.filter((c) =>
        sceneCastIds.has(c.castId)
      )
      const allVideosReady = sceneVideoCasts.every((c) =>
        loadedVideoCastIds.has(c.castId)
      )

      if (allImagesReady && allVideosReady) {
        pendingSceneReadyRef.current.add(scene.sceneId)
        logger.info({ sceneId: scene.sceneId }, 'Pending scene assets ready')
        onSceneAssetsReady(scene.sceneId)
      }
    }
  }, [
    pendingScenes,
    pendingSceneCasts,
    imagesLoaded,
    canPlayThroughVideos,
    onSceneAssetsReady,
  ])

  // Reset ready tracking when pending scenes change
  useEffect(() => {
    const currentPendingIds = new Set(pendingScenes.map((s) => s.sceneId))
    for (const id of pendingSceneReadyRef.current) {
      if (!currentPendingIds.has(id)) {
        pendingSceneReadyRef.current.delete(id)
      }
    }
  }, [pendingScenes])

  const activeVisualCasts = useMemo(
    () =>
      stageScenes[0]?.casts
        .filter((cast) => isActive({ cast, gamestates }))
        .filter(isVisualSpecialCast) ?? [],
    [gamestates, stageScenes]
  )
  const activeVideoCasts = useMemo(
    () =>
      activeVisualCasts.filter(
        (cast): cast is MovieSpecialCast =>
          isMovieSpecialCast(cast) && isMovie(cast)
      ),
    [activeVisualCasts]
  )
  const activeVideoPresentationKey = `${presentation?.token ?? 'stable'}:${
    stageScenes[0]?.sceneId ?? ''
  }:${activeVideoCasts
    .map((cast) => cast.castId)
    .sort((a, b) => a - b)
    .join(',')}`
  const activeVideoPresentationRef = useRef({
    key: activeVideoPresentationKey,
    castIds: new Set(activeVideoCasts.map((cast) => cast.castId)),
  })
  activeVideoPresentationRef.current = {
    key: activeVideoPresentationKey,
    castIds: new Set(activeVideoCasts.map((cast) => cast.castId)),
  }
  const onVideoCastFramePresented = useCallback(
    (ref: [HTMLVideoElement, MovieSpecialCast[], string]) => {
      const [, movieCasts, presentationKey] = ref
      const activePresentation = activeVideoPresentationRef.current
      if (presentationKey !== activePresentation.key) return

      const presentedCastIds = movieCasts
        .map((cast) => cast.castId)
        .filter((castId) => activePresentation.castIds.has(castId))

      if (presentedCastIds.length === 0) return

      setPresentedVideoFrames((current) => {
        const castIds =
          current.key === activePresentation.key
            ? new Set(current.castIds)
            : new Set<number>()
        for (const castId of presentedCastIds) {
          castIds.add(castId)
        }
        return { key: activePresentation.key, castIds }
      })
    },
    []
  )

  /**
   * Find all videos that need to be started and stopped
   *
   * To do so we need to look at each video and its casts. If the video is part
   * of the uppermost stage scene, then it should play.  All other videos should
   * end (pause and set currentTime to 0), unless they are also part of the
   * uppermost stage scene
   */
  const updateVideoPlaybackState = useCallback(
    (controller: VideoController, result: MediaPlaybackResult) => {
      setBlockedVideoControllers((current) => {
        const controllerIndex = current.indexOf(controller)
        const shouldBlock =
          result === 'blocked' &&
          activeVideoControllersRef.current.has(controller)

        if (shouldBlock) {
          return controllerIndex === -1 ? [...current, controller] : current
        }
        return controllerIndex === -1
          ? current
          : current.filter(
              (blockedController) => blockedController !== controller
            )
      })
    },
    []
  )

  const attemptVideoPlayback = useCallback(
    async (controller: VideoController, presentationKey: string) => {
      const attempt = (videoPlaybackAttemptRef.current.get(controller) ?? 0) + 1
      videoPlaybackAttemptRef.current.set(controller, attempt)
      const result = await controller.play(presentationKey)

      if (videoPlaybackAttemptRef.current.get(controller) === attempt) {
        updateVideoPlaybackState(controller, result)
      }
    },
    [updateVideoPlaybackState]
  )

  useEffect(() => {
    const topSceneCastIds =
      stageScenes.length > 0
        ? new Set(stageScenes[0].casts.map((c) => c.castId))
        : new Set<number>()
    const activeVideoControllers = new Set<VideoController>()

    for (const [controller, casts] of availableVideos) {
      const isInTopScene = casts.some((cast) =>
        topSceneCastIds.has(cast.castId)
      )
      const isActiveCast = casts.some((cast) => isActive({ cast, gamestates }))

      if (isInTopScene && isActiveCast) {
        activeVideoControllers.add(controller)
      } else {
        controller.end()
      }
    }

    activeVideoControllersRef.current = activeVideoControllers
    setBlockedVideoControllers((current) => {
      const activeBlockedControllers = current.filter((controller) =>
        activeVideoControllers.has(controller)
      )
      return activeBlockedControllers.length === current.length
        ? current
        : activeBlockedControllers
    })

    for (const controller of activeVideoControllers) {
      if (retryingVideoControllersRef.current.has(controller)) {
        continue
      }
      void attemptVideoPlayback(controller, activeVideoPresentationKey)
    }
  }, [
    activeVideoPresentationKey,
    availableVideos,
    stageScenes,
    gamestates,
    attemptVideoPlayback,
  ])

  const retryBlockedVideoPlayback = useCallback(() => {
    for (const controller of blockedVideoControllers) {
      if (
        !activeVideoControllersRef.current.has(controller) ||
        retryingVideoControllersRef.current.has(controller)
      ) {
        continue
      }
      retryingVideoControllersRef.current.add(controller)
      void attemptVideoPlayback(
        controller,
        activeVideoPresentationRef.current.key
      ).finally(() => {
        retryingVideoControllersRef.current.delete(controller)
      })
    }
  }, [attemptVideoPlayback, blockedVideoControllers])

  const loadedImageCastIds = useMemo(
    () =>
      new Set(
        imagesLoaded.flatMap(([, casts]) => casts.map((cast) => cast.castId))
      ),
    [imagesLoaded]
  )
  const loadedVideoCastIds = useMemo(
    () =>
      new Set(
        canPlayThroughVideos.flatMap(([, casts]) =>
          casts.map((cast) => cast.castId)
        )
      ),
    [canPlayThroughVideos]
  )
  const presentedVideoCastIds =
    presentedVideoFrames.key === activeVideoPresentationKey
      ? presentedVideoFrames.castIds
      : noPresentedVideoCastIds
  const activeVisualAssetsReady = activeVisualCasts.every((cast) =>
    isControlledMovieCast(cast) || isImage(cast)
      ? loadedImageCastIds.has(cast.castId)
      : loadedVideoCastIds.has(cast.castId) &&
        presentedVideoCastIds.has(cast.castId)
  )
  const activePresentation =
    presentation &&
    stageScenes[0]?.sceneId === presentation.sceneId &&
    activeVisualAssetsReady
      ? presentation
      : undefined
  const handleFramePresented = useCallback(
    (token: number) => {
      if (activePresentation?.token === token) {
        onScenePresented?.(activePresentation)
      }
    },
    [activePresentation, onScenePresented]
  )

  return (
    <React.Fragment>
      <Canvas
        width={width}
        height={height}
        top={top}
        left={left}
        renderables={renderables}
        presentationKey={activePresentation?.token}
        onPresented={handleFramePresented}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
      />
      {allVideoCasts.length > 0 && (
        <Videos
          movieSpecialCasts={allVideoCasts}
          volume={volume}
          onVideoCastEnded={onVideoCastEnded}
          onVideoCastCanPlaythrough={onVideoCastCanPlayThrough}
          onVideoCastFramePresented={onVideoCastFramePresented}
          onVideoCastRef={onVideoCastRef}
        />
      )}
      <Images
        movieSpecialCasts={allImageCasts}
        onImageCastLoad={onImageLoad}
        onImageCastError={onImageError}
      />
      {blockedVideoControllers.length > 0 && (
        <button
          type="button"
          aria-label="Begin movie playback"
          onClick={retryBlockedVideoPlayback}
          style={{
            position: 'absolute',
            top: `${top}px`,
            left: `${left}px`,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${width}px`,
            height: `${height}px`,
            padding: 0,
            border: 0,
            color: '#f5f0df',
            background: 'rgba(0, 0, 0, 0.58)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              padding: '18px 28px',
              border: '1px solid rgba(245, 240, 223, 0.72)',
              borderRadius: '999px',
              background: 'rgba(10, 13, 16, 0.88)',
              fontFamily: 'Georgia, serif',
              fontSize: '24px',
              letterSpacing: '0.03em',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
            }}
          >
            Click to begin
          </span>
        </button>
      )}
    </React.Fragment>
  )
}

export default Special
