'use client';

import type { PointerEvent, ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/morpheus-app/store/hooks';
import {
  closeGameMenu,
  openGameMenu,
  selectGameMenu,
  showGameMenuMain,
  showGameMenuSaveSlots,
} from '@/morpheus-app/store/slices/gameMenuSlice';
import styles from './game-menu.module.css';

type GameMenuProps = {
  saveSlots: ReactNode;
  onBeforeOpen: () => void;
};

export const GameMenu = ({ saveSlots, onBeforeOpen }: GameMenuProps) => {
  const dispatch = useAppDispatch();
  const menu = useAppSelector(selectGameMenu);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wheelButtonRef = useRef<HTMLButtonElement>(null);
  const backdropPressedRef = useRef(false);
  const wasOpenRef = useRef(false);

  const close = useCallback(() => {
    dispatch(closeGameMenu());
  }, [dispatch]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (menu.open && !dialog.open) {
      dialog.showModal();
      wasOpenRef.current = true;
      return;
    }
    if (!menu.open && dialog.open) {
      dialog.close();
    }
    if (!menu.open && wasOpenRef.current) {
      wasOpenRef.current = false;
      wheelButtonRef.current?.focus();
    }
  }, [menu.open]);

  const open = useCallback(() => {
    onBeforeOpen();
    dispatch(openGameMenu());
  }, [dispatch, onBeforeOpen]);

  const handleBackdropPointerDown = (
    event: PointerEvent<HTMLDialogElement>,
  ) => {
    event.stopPropagation();
    backdropPressedRef.current = event.target === event.currentTarget;
  };

  const handleBackdropPointerUp = (
    event: PointerEvent<HTMLDialogElement>,
  ) => {
    event.stopPropagation();
    const closes =
      backdropPressedRef.current && event.target === event.currentTarget;
    backdropPressedRef.current = false;
    if (closes) close();
  };

  return (
    <>
      <button
        ref={wheelButtonRef}
        type="button"
        className={styles.wheelButton}
        aria-label="Open game menu"
        aria-haspopup="dialog"
        aria-expanded={menu.open}
        onClick={(event) => {
          event.stopPropagation();
          open();
        }}
      >
        <img src="/image/icon/gear.png" alt="" />
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label="Game menu"
        onCancel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          close();
        }}
        onClose={() => {
          if (menu.open) close();
        }}
        onPointerDown={handleBackdropPointerDown}
        onPointerUp={handleBackdropPointerUp}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={`${styles.wheelButton} ${styles.dialogWheel}`}
          aria-label="Close game menu"
          onClick={(event) => {
            event.stopPropagation();
            close();
          }}
        >
          <img src="/image/icon/gear.png" alt="" />
        </button>

        <section
          className={styles.panel}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
        >
          {menu.screen === 'main' ? (
            <nav className={styles.mainActions} aria-label="Game menu">
              <button type="button" onClick={close}>
                Resume Game
              </button>
              <button
                type="button"
                onClick={() => dispatch(showGameMenuSaveSlots())}
              >
                Save Slots
              </button>
            </nav>
          ) : (
            <div className={styles.saveSlots}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => dispatch(showGameMenuMain())}
              >
                Back
              </button>
              {saveSlots}
            </div>
          )}
        </section>
      </dialog>
    </>
  );
};
