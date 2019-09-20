import React, {
  useState,
  useCallback,
  useRef,
  useReducer,
  useEffect,
  useMemo,
  SyntheticEvent,
} from 'react'
import { getAssetUrl } from 'service/gamedb'
import { MovieSpecialCast } from '../types'

type VideoEvent = (e: SyntheticEvent<HTMLVideoElement>) => void
type VideoRef = (el: HTMLVideoElement | null) => void
export interface VideoController {
  el: HTMLVideoElement | null
  castIds: number[]
  play: () => void
  pause: () => void
}
type VideoControllerRef = (a: VideoController) => void
export type VideoCastEventCallback = (
  e: SyntheticEvent<HTMLVideoElement>,
  movieCasts: MovieSpecialCast[],
) => void
export type VideoCastRefCallback = (
  ref: VideoController,
  movieCasts: MovieSpecialCast[],
) => void

interface VidelElProps {
  url: string
  volume: number
  looping: boolean
  onVideoRef: VideoControllerRef
  onVideoEnded: VideoEvent
  onVideoCanPlayThrough: VideoEvent
}

const VideoEl = ({
  url,
  volume,
  looping,
  onVideoRef,
  onVideoEnded,
  onVideoCanPlayThrough,
}: VidelElProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    onVideoRef({
      el: videoRef.current,
      castIds: [],
      play() {
        if (videoRef.current) {
          videoRef.current.play()
        }
      },
      pause() {
        if (videoRef.current) {
          videoRef.current.pause()
        }
      },
    })
  }, [videoRef.current])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
    }
  }, [volume, videoRef.current])

  return (
    <video
      ref={videoRef}
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
          {} as MovieCastCollectionMap,
        ),
      ).map(([url, movieCasts]) => {
        return {
          url,
          // autoplay: !!castRefs.find(({ autoplay }) => autoplay),
          looping: !!movieCasts.find(({ looping }) => looping),
          onVideoRef(ref) {
            onVideoCastRef(ref, movieCasts)
          },
          onVideoCanPlaythrough(e: SyntheticEvent<HTMLVideoElement>) {
            onVideoCastCanPlaythrough(e, movieCasts)
          },
          onVideoEnded(e: SyntheticEvent<HTMLVideoElement>) {
            onVideoCastEnded(e, movieCasts)
          },
        } as VideoMovieCastCollection
      }),
    [movieSpecialCasts],
  )

  return (
    <React.Fragment>
      {aggregatedCastRefs.map(
        ({ url, looping, onVideoRef, onVideoCanPlaythrough, onVideoEnded }) => {
          return (
            <VideoEl
              key={url}
              url={url}
              looping={looping}
              volume={volume}
              onVideoRef={onVideoRef}
              onVideoEnded={onVideoEnded}
              onVideoCanPlayThrough={onVideoCanPlaythrough}
            />
          )
        },
      )}
    </React.Fragment>
  )
}

export default Video
