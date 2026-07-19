import React, { useRef, useEffect, useMemo, useCallback, SyntheticEvent } from 'react'
import { getAssetUrl } from 'service/gamedb'
import { MovieSpecialCast } from '../types'
import {
  MediaPlaybackResult,
  startMediaPlayback,
} from './mediaPlayback'

type VideoEvent = (e: SyntheticEvent<HTMLVideoElement>) => void
type VideoRef = (el: HTMLVideoElement | null) => void
export interface VideoController {
  el: HTMLVideoElement | null
  castIds: number[]
  play: () => Promise<MediaPlaybackResult>
  pause: () => void
  end: () => void
}
type VideoControllerRef = (a: VideoController) => void
export type VideoCastEventCallback = (
  ref: [HTMLVideoElement, MovieSpecialCast[]]
) => void
export type VideoCastRefCallback = (
  ref: [VideoController, MovieSpecialCast[]]
) => void

interface VideoElProps {
  url: string
  volume: number
  casts: MovieSpecialCast[]
  looping: boolean
  onVideoRef: VideoControllerRef
  onVideoEnded: VideoEvent
  onVideoCanPlayThrough: VideoEvent
}

const VideoEl = ({
  url,
  volume,
  looping,
  casts,
  onVideoRef,
  onVideoEnded,
  onVideoCanPlayThrough,
}: VideoElProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasRegistered = useRef(false)
  // Store latest values in refs to avoid callback dependencies
  const castsRef = useRef(casts)
  const onVideoRefRef = useRef(onVideoRef)
  castsRef.current = casts
  onVideoRefRef.current = onVideoRef

  const handleVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (el && !hasRegistered.current) {
      hasRegistered.current = true
      const currentCasts = castsRef.current
      const controller = {
        el,
        castIds: currentCasts.map(c => c.castId),
        async play() {
          if (!videoRef.current) {
            return 'failed'
          }
          return startMediaPlayback(videoRef.current)
        },
        pause() {
          if (videoRef.current) {
            videoRef.current.pause()
          }
        },
        end() {
          if (videoRef.current) {
            videoRef.current.pause()
          }
        },
      }
      onVideoRefRef.current(controller)
    } else if (!el) {
      hasRegistered.current = false
    }
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
    }
  }, [volume])

  return (
    <video
      ref={handleVideoRef}
      style={{
        display: 'none',
      }}
      autoPlay={false}
      crossOrigin="anonymous"
      webkit-playsinline="webkit-playsinline"
      loop={looping}
      onEnded={onVideoEnded}
      onCanPlayThrough={onVideoCanPlayThrough}
    >
      <source src={getAssetUrl(`${url}.webm`)} type="video/webm" />
      <source src={getAssetUrl(`${url}.mp4`)} type="video/mp4" />
    </video>
  )
}

interface IVideoProps {
  movieSpecialCasts: MovieSpecialCast[]
  volume: number
  onVideoCastEnded: VideoCastEventCallback
  onVideoCastCanPlaythrough: VideoCastEventCallback
  onVideoCastRef: VideoCastRefCallback
}

// Used to compute VideoMovieCastCollection
interface MovieCastCollectionMap {
  [key: string]: MovieSpecialCast[]
}

// A single HTMLVideoElement a collection of movieCasts the reference it
interface VideoMovieCastCollection {
  url: string
  looping: boolean
  casts: MovieSpecialCast[]
  onVideoEnded: VideoEvent
  onVideoCanPlaythrough: VideoEvent
  onVideoRef: VideoControllerRef
}

const Video = ({
  movieSpecialCasts,
  volume,
  onVideoCastRef,
  onVideoCastCanPlaythrough,
  onVideoCastEnded,
}: IVideoProps) => {
  const aggregatedCastRefs = useMemo(
    () =>
      Object.entries(
        movieSpecialCasts.reduce(
          (memo: MovieCastCollectionMap, curr: MovieSpecialCast) => {
            const { fileName } = curr
            const ref = (memo[fileName] = memo[fileName] || [])
            ref.push(curr)
            return memo
          },
          {} as MovieCastCollectionMap
        )
      ).map(([url, movieCasts]) => {
        return {
          url,
          casts: movieCasts,
          // autoplay: !!castRefs.find(({ autoplay }) => autoplay),
          looping: !!movieCasts.find(({ looping }) => looping),
          onVideoRef(ref) {
            onVideoCastRef([ref, movieCasts])
          },
          onVideoCanPlaythrough(e: SyntheticEvent<HTMLVideoElement>) {
            onVideoCastCanPlaythrough([e.currentTarget, movieCasts])
          },
          onVideoEnded(e: SyntheticEvent<HTMLVideoElement>) {
            onVideoCastEnded([e.currentTarget, movieCasts])
          },
        } as VideoMovieCastCollection
      }),
    [
      movieSpecialCasts,
      onVideoCastCanPlaythrough,
      onVideoCastEnded,
      onVideoCastRef,
    ]
  )

  return (
    <React.Fragment>
      {aggregatedCastRefs.map(
        ({
          casts,
          url,
          looping,
          onVideoRef,
          onVideoCanPlaythrough,
          onVideoEnded,
        }) => {
          return (
            <VideoEl
              key={url}
              url={url}
              casts={casts}
              looping={looping}
              volume={volume}
              onVideoRef={onVideoRef}
              onVideoEnded={onVideoEnded}
              onVideoCanPlayThrough={onVideoCanPlaythrough}
            />
          )
        }
      )}
    </React.Fragment>
  )
}

export default Video
