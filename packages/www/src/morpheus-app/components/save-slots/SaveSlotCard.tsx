import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';

import type {
  LivingSaveHealth,
  LivingSaveSlotSummary,
} from '@/morpheus-app/store/slices/livingSavesSlice';

import styles from './save-slots.module.css';

type SaveSlotCardProps = {
  slot: LivingSaveSlotSummary;
  saveHealth: LivingSaveHealth;
  disabled?: boolean;
  onSelect: (slotId: LivingSaveSlotSummary['slotId']) => void;
  renderManagementActions?: (slot: LivingSaveSlotSummary) => ReactNode;
};

const formatSavedAt = (savedAt: number): string =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(savedAt);

function statusForSlot(
  slot: LivingSaveSlotSummary,
  saveHealth: LivingSaveHealth,
): string {
  if (slot.state === 'empty') return 'Empty slot';
  if (slot.state === 'unloadable') return 'Unavailable save';
  if (!slot.active) return 'Saved';
  if (saveHealth === 'saving') return 'Saving';
  if (saveHealth === 'save-unavailable') return 'Save unavailable';
  if (saveHealth === 'volatile') return 'Playing without save';
  if (saveHealth === 'saved') return 'Saved';
  return 'Active save';
}

export const SaveSlotCard = ({
  slot,
  saveHealth,
  disabled = false,
  onSelect,
  renderManagementActions,
}: SaveSlotCardProps) => {
  const [actionsRevealed, setActionsRevealed] = useState(false);
  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const isUnloadable = slot.state === 'unloadable';
  const status = statusForSlot(slot, saveHealth);
  const statusId = `save-slot-${slot.slotId}-status`;

  const beginSwipe = (event: PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    suppressClickRef.current = false;
  };

  const updateSwipe = (event: PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (Math.abs(deltaX) < 24 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }
    suppressClickRef.current = true;
    if (deltaX < -40) setActionsRevealed(true);
    if (deltaX > 40) setActionsRevealed(false);
  };

  const endSwipe = (event: PointerEvent<HTMLButtonElement>) => {
    if (gestureRef.current?.pointerId === event.pointerId) {
      gestureRef.current = null;
    }
  };

  return (
    <article
      className={`${styles.slotCard} ${slot.active ? styles.active : ''} ${
        isUnloadable ? styles.unloadable : ''
      }`}
      data-actions-revealed={actionsRevealed}
    >
      <button
        type="button"
        className={styles.slotSelection}
        disabled={disabled || isUnloadable}
        aria-describedby={statusId}
        onPointerDown={beginSwipe}
        onPointerMove={updateSwipe}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          onSelect(slot.slotId);
        }}
      >
        <span className={styles.slotNumber}>Slot {slot.slotId.slice(-1)}</span>
        <span className={styles.slotState}>{status}</span>
        {slot.state === 'occupied' && slot.sceneId !== null && (
          <span className={styles.slotDetail}>Scene {slot.sceneId}</span>
        )}
        {slot.state === 'occupied' && slot.savedAt !== null && (
          <time
            className={styles.slotDetail}
            dateTime={new Date(slot.savedAt).toISOString()}
          >
            Saved {formatSavedAt(slot.savedAt)} UTC
          </time>
        )}
        {isUnloadable && slot.unloadableReason !== null && (
          <span className={styles.slotDetail}>
            {slot.unloadableReason.replace(/-/g, ' ')}
          </span>
        )}
      </button>
      <span id={statusId} className={styles.srOnly}>
        {status}
      </span>
      {renderManagementActions && (
        <div className={styles.managementActions}>
          {renderManagementActions(slot)}
        </div>
      )}
    </article>
  );
};
