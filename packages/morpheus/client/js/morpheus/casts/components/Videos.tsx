import React, { useRef, useEffect, useMemo, SyntheticEvent } from 'react'
import { getAssetUrl } from 'service/gamedb'
import { MovieSpecialCast } from '../types'

type VideoEvent = (e: SyntheticEvent<HTMLVideoElement>) => void
type VideoRef = (el: HTMLVideoElement | null) => void
export interface VideoController {
  el: HTMLVideoElement | null
  castIds: number[]
  play: () => void
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

  useEffect(() => {
    onVideoRef({
      el: videoRef.current,
      castIds: casts.map(c => c.castId),
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
      end() {
        if (videoRef.current) {
          videoRef.current.pause()
          // videoRef.current.currentTime = 0
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
