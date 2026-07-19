'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { SaveSlotHub } from '@/morpheus-app/components/save-slots/SaveSlotHub';
import { useAppSelector } from '@/morpheus-app/store/hooks';
import { useLivingSaveCoordinator } from '@/morpheus-app/store/LivingSaveCoordinatorContext';
import type { LivingSaveSlotSummary } from '@/morpheus-app/store/slices/livingSavesSlice';
import { selectLivingSaves } from '@/morpheus-app/store/slices/livingSavesSlice';
import { getAssetUrl } from '@/service/gamedb';
import styles from './title-screen.module.css';

type TitlePhase = 'title' | 'intro' | 'error';

const FIRST_GAME_SCENE = 2000;
const INTRO_WEBM = getAssetUrl('GameDB/Deck1/introMOV.webm');
const INTRO_MP4 = getAssetUrl('GameDB/Deck1/introMOV.mp4');
const TITLE_ART_STYLE: CSSProperties & { '--title-image': string } = {
  '--title-image': `url("${getAssetUrl('image/texture/title.png')}")`,
};

export const Client = () => {
  const router = useRouter();
  const coordinator = useLivingSaveCoordinator();
  const livingSaves = useAppSelector(selectLivingSaves);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mountedRef = useRef(true);
  const selectingSlotRef = useRef(false);
  const [phase, setPhase] = useState<TitlePhase>('title');
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const startGame = useCallback(() => {
    router.push(`/scene/${FIRST_GAME_SCENE}`);
  }, [router]);

  const playIntro = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      setPhase('error');
      return;
    }

    video.currentTime = 0;
    setPhase('intro');
    void video.play().catch(() => {
      if (mountedRef.current) {
        setPhase('error');
      }
    });
  }, []);

  const selectSlot = useCallback(
    async (slot: LivingSaveSlotSummary) => {
      if (selectingSlotRef.current || phase !== 'title') {
        return;
      }
      if (slot.state === 'unloadable') {
        return;
      }

      selectingSlotRef.current = true;
      setSelectionError(null);
      const outcome =
        slot.state === 'empty'
          ? await coordinator.createNewSlot(slot.slotId)
          : await coordinator.restoreSlot(slot.slotId);

      if (!mountedRef.current) {
        return;
      }
      if (!outcome.ok) {
        selectingSlotRef.current = false;
        setSelectionError(outcome.reason);
        return;
      }
      if (slot.state === 'empty') {
        playIntro();
      }
    },
    [coordinator, phase, playIntro],
  );

  const isHubBusy =
    livingSaves.bootstrapPhase !== 'ready' ||
    livingSaves.operation !== null ||
    selectingSlotRef.current;

  return (
    <main className={styles.screen} data-title-phase={phase}>
      <section
        className={`${styles.title} ${phase === 'title' ? styles.visible : ''}`}
        aria-hidden={phase !== 'title'}
      >
        <div className={styles.titleArt} style={TITLE_ART_STYLE}>
          <div className={styles.slotHub}>
            <SaveSlotHub
              slots={livingSaves.slots}
              saveHealth={livingSaves.saveHealth}
              failureReason={selectionError ?? livingSaves.failureReason}
              isBusy={isHubBusy}
              title="Choose your journey"
              onSelect={(slot) => {
                void selectSlot(slot);
              }}
            />
          </div>
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
