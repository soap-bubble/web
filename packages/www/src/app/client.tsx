'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { clearAll } from '@/morpheus-app/storage/gamestateStorage';
import { resetGame as resetGameState } from '@/morpheus-app/store/actions';
import { useAppDispatch } from '@/morpheus-app/store/hooks';
import { getAssetUrl } from '@/service/gamedb';
import styles from './title-screen.module.css';

type TitlePhase = 'title' | 'intro' | 'error';

const FIRST_GAME_SCENE = 2000;
const NEW_GAME_IMAGE = getAssetUrl('image/texture/new.png');
const INTRO_WEBM = getAssetUrl('GameDB/Deck1/introMOV.webm');
const INTRO_MP4 = getAssetUrl('GameDB/Deck1/introMOV.mp4');
const TITLE_ART_STYLE: CSSProperties & { '--title-image': string } = {
  '--title-image': `url("${getAssetUrl('image/texture/title.png')}")`,
};

export const Client = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(true);
  const resetGameRef = useRef<Promise<void> | null>(null);
  const startingGameRef = useRef(false);
  const [phase, setPhase] = useState<TitlePhase>('title');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const startGame = useCallback(() => {
    if (startingGameRef.current) {
      return;
    }
    startingGameRef.current = true;
    const gameReset = resetGameRef.current ?? clearAll();
    resetGameRef.current = gameReset;
    void gameReset
      .then(() => {
        if (!mountedRef.current) {
          return;
        }
        dispatch(resetGameState());
        router.push(`/scene/${FIRST_GAME_SCENE}`);
      })
      .catch(() => {
        if (!mountedRef.current) {
          return;
        }
        if (resetGameRef.current === gameReset) {
          resetGameRef.current = null;
        }
        startingGameRef.current = false;
        setPhase('error');
      });
  }, [dispatch, router]);

  const playIntro = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      setPhase('error');
      return;
    }

    video.currentTime = 0;
    const resetGame = clearAll();
    resetGameRef.current = resetGame;
    void resetGame.catch(() => {
      if (!mountedRef.current) {
        return;
      }
      if (resetGameRef.current === resetGame) {
        resetGameRef.current = null;
      }
      video.pause();
      setPhase('error');
    });
    setPhase('intro');
    void video.play().catch(() => {
      if (mountedRef.current) {
        setPhase('error');
      }
    });
  }, []);

  return (
    <main className={styles.screen} data-title-phase={phase}>
      <section
        className={`${styles.title} ${phase === 'title' ? styles.visible : ''}`}
        aria-hidden={phase !== 'title'}
      >
        <div className={styles.titleArt} style={TITLE_ART_STYLE}>
          <button
            type="button"
            className={styles.newGameButton}
            onClick={playIntro}
            tabIndex={phase === 'title' ? 0 : -1}
          >
            <img src={NEW_GAME_IMAGE} alt="Start a new game" />
          </button>
        </div>
      </section>

      <section
        className={`${styles.intro} ${phase === 'intro' ? styles.visible : ''}`}
        aria-hidden={phase !== 'intro'}
      >
        <video
          ref={videoRef}
          className={styles.introMovie}
          preload="metadata"
          playsInline
          onEnded={startGame}
          onError={() => setPhase('error')}
        >
          <source src={INTRO_WEBM} type="video/webm" />
          <source src={INTRO_MP4} type="video/mp4" />
        </video>
        <button
          type="button"
          className={styles.skipButton}
          onClick={startGame}
          tabIndex={phase === 'intro' ? 0 : -1}
        >
          Skip intro
        </button>
      </section>

      {phase === 'error' && (
        <section className={styles.error} role="alert">
          <p>The game could not start.</p>
          <button type="button" onClick={startGame}>
            Start game
          </button>
        </section>
      )}
    </main>
  );
};
