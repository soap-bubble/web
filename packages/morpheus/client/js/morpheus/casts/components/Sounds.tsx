import React, { useRef, useEffect, useMemo, SyntheticEvent } from 'react'
import { getAssetUrl } from 'service/gamedb'
import { MovieSpecialCast, SupportedSoundCasts } from '../types'

type AudioEvent = (e: SyntheticEvent<HTMLAudioElement>) => void
export interface AudioController {
  el: HTMLAudioElement | null
  castIds: number[]
  url: string
  play: () => void
  pause: () => void
  end: () => void
}
type AudioControllerRef = (a: AudioController) => void
export type AudioCastEventCallback = (
  ref: [HTMLAudioElement, SupportedSoundCasts[]]
) => void
export type AudioCastRefCallback = (
  ref: [AudioController, SupportedSoundCasts[]]
) => void

interface AudioElProps {
  url: string
  volume: number
  casts: SupportedSoundCasts[]
  looping: boolean
  onAudioRef: AudioControllerRef
  onAudioEnded: AudioEvent
  onAudioCanPlayThrough: AudioEvent
}

const AudioEl = ({
  url,
  volume,
  looping,
  casts,
  onAudioRef,
  onAudioEnded,
  onAudioCanPlayThrough,
}: AudioElProps) => {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    onAudioRef({
      el: audioRef.current,
      url,
      castIds: casts.map(c => c.castId),
      play() {
        if (audioRef.current) {
          audioRef.current.play()
          audioRef.current.setAttribute('data-played', '1')
        }
      },
      pause() {
        if (audioRef.current) {
          audioRef.current.pause()
        }
      },
      end() {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
      },
    })
  }, [audioRef.current])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume, audioRef.current])

  return (
    <audio
      ref={audioRef}
      autoPlay={false}
      crossOrigin="anonymous"
      loop={looping}
      onEnded={onAudioEnded}
      onCanPlayThrough={onAudioCanPlayThrough}
    >
      <source src={getAssetUrl(`${url}.mp3`)} type="audio/mp3" />
      <source src={getAssetUrl(`${url}.ogg`)} type="audio/ogg" />
    </audio>
  )
}

interface IAudioProps {
  soundCasts: SupportedSoundCasts[]
  volume: number
  onAudioCastEnded: AudioCastEventCallback
  onAudioCastCanPlaythrough: AudioCastEventCallback
  onAudioCastRef: AudioCastRefCallback
}

// Used to compute AudioCastCollection
interface SoundCastCollectionMap {
  [key: string]: SupportedSoundCasts[]
}

// A single HTMLAudioElement a collection of movieCasts the reference it
interface AudioCastCollection {
  url: string
  looping: boolean
  casts: SupportedSoundCasts[]
  onAudioEnded: AudioEvent
  onAudioCanPlaythrough: AudioEvent
  onAudioRef: AudioControllerRef
}

const Audio = ({
  soundCasts,
  volume,
  onAudioCastRef,
  onAudioCastCanPlaythrough,
  onAudioCastEnded,
}: IAudioProps) => {
  const aggregatedCastRefs = useMemo(
    () =>
      Object.entries(
        soundCasts.reduce(
          (memo: SoundCastCollectionMap, curr: SupportedSoundCasts) => {
            const { fileName } = curr
            const ref = (memo[fileName] = memo[fileName] || [])
            ref.push(curr)
            return memo
          },
          {} as SoundCastCollectionMap
        )
      ).map(([url, movieCasts]) => {
        return {
          url,
          casts: movieCasts,
          // autoplay: !!castRefs.find(({ autoplay }) => autoplay),
          looping: !!movieCasts.find(
            cast =>
              cast.hasOwnProperty('looping') &&
              (cast as MovieSpecialCast).looping
          ),
          onAudioRef(ref) {
            onAudioCastRef([ref, movieCasts])
          },
          onAudioCanPlaythrough(e: SyntheticEvent<HTMLAudioElement>) {
            onAudioCastCanPlaythrough([e.currentTarget, movieCasts])
          },
          onAudioEnded(e: SyntheticEvent<HTMLAudioElement>) {
            onAudioCastEnded([e.currentTarget, movieCasts])
          },
        } as AudioCastCollection
      }),
    [soundCasts, onAudioCastCanPlaythrough, onAudioCastEnded, onAudioCastRef]
  )

  return (
    <React.Fragment>
      {aggregatedCastRefs.map(
        ({
          casts,
          url,
          looping,
          onAudioRef,
          onAudioCanPlaythrough,
          onAudioEnded,
        }) => {
          return (
            <AudioEl
              key={url}
              url={url}
              casts={casts}
              looping={looping}
              volume={volume}
              onAudioRef={onAudioRef}
              onAudioEnded={onAudioEnded}
              onAudioCanPlayThrough={onAudioCanPlaythrough}
            />
          )
        }
      )}
    </React.Fragment>
  )
}

export default Audio
