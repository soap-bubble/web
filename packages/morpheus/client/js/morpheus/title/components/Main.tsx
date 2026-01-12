import { useState, useRef, useEffect, useCallback } from 'react'
import cx from 'classnames'
import { Tween, Easing } from '@tweenjs/tween.js'
import { useSelector } from 'react-redux'
import { getAssetUrl } from 'service/gamedb'
import { selectors as gameSelectors } from 'morpheus/game'
import Title from './Title'
import qs from 'query-string'
import PlayOverlay from './PlayOverlay'
import WhyAmISeeingThis from './WhyAmISeeingThis'
import { isLeaving, isDone, titleStyle } from '../selectors'

const WHY_DO_I_NEED_TO_CLICK_PLAY =
  'Recent changes to Chrome require user interaction before WebAudio can be played.'

const qp =
  typeof window !== 'undefined' ? qs.parse(window.location?.search) : {}

function requestFullscreen() {
  const root = document.getElementById('root')
  if (!root) return

  const rootElement = root as HTMLElement & {
    webkitRequestFullScreen?: () => void
  }

  if (rootElement.requestFullscreen) {
    rootElement.requestFullscreen()
  } else if (rootElement.webkitRequestFullScreen) {
    rootElement.webkitRequestFullScreen()
    rootElement.style.width = '100%'
    rootElement.style.height = '100%'
  }
}

const Main: React.FC = () => {
  const [isLeavingState, setIsLeavingState] = useState(false)
  const [started, setStarted] = useState(
    Boolean(process.env.NEXT_PUBLIC_AUTOSTART) || Boolean(qp.quickstart)
  )

  const audioRef = useRef<HTMLAudioElement>(null)

  const leaving = useSelector(isLeaving)
  const done = useSelector(isDone)
  const style = useSelector(titleStyle)
  const volume = useSelector(gameSelectors.htmlVolume)

  const fadeOut = useCallback(() => {
    if (!isLeavingState && audioRef.current) {
      const v = { target: audioRef.current.volume }
      const tween = new Tween(v)
        .to({ target: 0 })
        .easing(Easing.Sinusoidal.Out)
        .onUpdate(() => {
          if (audioRef.current) {
            audioRef.current.volume = v.target
          }
        })

      tween.start()
      setIsLeavingState(true)
    }
  }, [isLeavingState])

  // Handle volume changes from redux
  useEffect(() => {
    if (audioRef.current && !isLeavingState) {
      audioRef.current.volume = volume
    }
  }, [volume, isLeavingState])

  // Handle leaving/done state changes
  useEffect(() => {
    if (leaving || done) {
      fadeOut()
    }
  }, [leaving, done, fadeOut])

  // Auto-start in dev mode
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTOSTART && audioRef.current) {
      audioRef.current.play()
    }
  }, [])

  const handlePlayClick = useCallback(() => {
    setStarted(true)
    if (audioRef.current) {
      audioRef.current.play()
    }
    requestFullscreen()
  }, [])

  const handleAudioRef = useCallback(
    (element: HTMLAudioElement | null) => {
      // Use a type assertion to assign to ref.current
      ;(audioRef as React.RefObject<HTMLAudioElement | null>).current =
        element
      if (element && !isLeavingState) {
        element.volume = volume
      }
    },
    [volume, isLeavingState]
  )

  return (
    <div
      className={cx('main-title', {
        'request-play': started,
      })}
      style={style}
    >
      {started ? <Title opacity={1} /> : null}
      {!started ? <PlayOverlay onClick={handlePlayClick} /> : null}
      {!started ? (
        <WhyAmISeeingThis reason={WHY_DO_I_NEED_TO_CLICK_PLAY} />
      ) : null}
      <audio ref={handleAudioRef} loop>
        <source
          src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'aac')}
          type="audio/aac"
        />
        <source
          src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'mp3')}
          type="audio/mp3"
        />
        <source
          src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'ogg')}
          type="audio/ogg"
        />
      </audio>
    </div>
  )
}

export default Main
