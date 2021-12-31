import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cx from 'classnames';
import {Tween, Easing} from '@tweenjs/tween.js';
import { getAssetUrl } from 'service/gamedb';
import Title from '../containers/Title';
import PlayOverlay from './PlayOverlay';
import WhyAmISeeingThis from './WhyAmISeeingThis';

import styles from './Main.module.css'
import useSize from 'morpheus/app/hooks/useSize';

const WHY_DO_I_NEED_TO_CLICK_PLAY = 'Recent changes to Chrome require user interaction before WebAudio can be played.';

interface IProps {
  leaving: boolean;
  volume: number;
  done: boolean;
}

const Main: FC<IProps> = ({ leaving, volume, done }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [started, setStarted] = useState(!!process.env.AUTOSTART);
  const [lastVolume, setLastVolume ] = useState(volume);
  const { width, height, x, y } = useSize()
  const style = useMemo(() => ({
    width: `${width}px`,
    height: `${height}px`,
    left: `${x}px`,
    top: `${y}px`,
  }), [width, height, x, y])
  const audioRef = useRef<HTMLAudioElement>(null);
  const onFullscreen = useCallback(() => {
    const root = document.getElementById('root')
    if (root) {
      if (root.requestFullscreen) {
        root.requestFullscreen();
        // @ts-ignore Safari doesn't support requestFullscreen
      } else if (root.webkitRequestFullScreen) {
        // @ts-ignore Safari
        root.webkitRequestFullScreen();
        root.style.width = '100%';
        root.style.height = '100%';
      }
    }
  }, [])
  const fadeOut = useCallback(() => {
    if (!isLeaving && audioRef.current) {
      const v = { target: audioRef.current.volume };
      const tween = new Tween(v)
        .to({
          target: 0,
        })
        .easing(Easing.Sinusoidal.Out)
        .onUpdate(() => {
          if (audioRef.current) {
            audioRef.current.volume = v.target;
          }
        });
      tween.start();
      setIsLeaving(true);
    }
  }, [isLeaving]);
  useEffect(() => {
    if (volume != lastVolume && audioRef.current && !isLeaving) {
      setLastVolume(volume);
      audioRef.current.volume = volume;
    }
  }, [volume, lastVolume, setLastVolume, audioRef.current, isLeaving]);
  useEffect(() => {
    if (!isLeaving && leaving && done) {
      fadeOut()
    }
  }, [isLeaving, leaving, done, fadeOut]);
  useEffect(() => {
    if (started && audioRef.current) {
      audioRef.current.play();
    }
  }, [started, audioRef.current]);

  const onPlayClicked = useCallback(() => {
    setStarted(true);
    // onFullscreen();
  }, []);

  return (
    <div
      className={cx(styles.mainTitle)}
      style={{
        ...style,
      }}
    >
      {started ? <Title opacity={1} /> : null}
      {!started ? <PlayOverlay onClick={onPlayClicked} /> : null}
      {!started ? <WhyAmISeeingThis
        reason={WHY_DO_I_NEED_TO_CLICK_PLAY}
      /> : null}
      <audio ref={audioRef} loop>
        <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'aac')} type="audio/aac" />
        <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'mp3')} type="audio/mp3" />
        <source src={getAssetUrl('GameDB/OAsounds/claireSRMSC', 'ogg')} type="audio/ogg" />
      </audio>
    </div>
  )
}

export default Main;
