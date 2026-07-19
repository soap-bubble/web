'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  MAX_LIVING_SAVE_FILE_BYTES,
  serializeLivingSaveFile,
} from '@/morpheus-app/storage/livingSaveFiles';
import { useAppSelector } from '@/morpheus-app/store/hooks';
import { useLivingSaveCoordinator } from '@/morpheus-app/store/LivingSaveCoordinatorContext';
import { requestLivingSaveCheckpoint } from '@/morpheus-app/store/livingSaveCheckpoint';
import {
  selectLivingSaves,
  type LivingSaveSlotSummary,
} from '@/morpheus-app/store/slices/livingSavesSlice';

import { SaveSlotHub } from './SaveSlotHub';
import styles from './save-slots.module.css';

type LivingSaveSlotManagerProps = {
  title?: string;
  description?: string;
  onSelect: (slot: LivingSaveSlotSummary) => void;
};

const fileNameForSlot = (
  slot: LivingSaveSlotSummary,
  resumePointId: string,
): string =>
  `morpheus-${slot.slotId}-${resumePointId.replace(/[^a-zA-Z0-9_-]/g, '-')}.json`;

export const LivingSaveSlotManager = ({
  title,
  description,
  onSelect,
}: LivingSaveSlotManagerProps) => {
  const coordinator = useLivingSaveCoordinator();
  const livingSaves = useAppSelector(selectLivingSaves);
  const [now, setNow] = useState(() => Date.now());
  const [localFailure, setLocalFailure] = useState<string | null>(null);

  useEffect(() => {
    if (Object.keys(livingSaves.tombstones).length === 0) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [livingSaves.tombstones]);

  const runManagement = useCallback(
    async (operation: () => Promise<{ ok: boolean; reason?: string }>) => {
      setLocalFailure(null);
      const outcome = await operation();
      if (!outcome.ok) {
        setLocalFailure(outcome.reason ?? 'The save operation failed.');
      }
    },
    [],
  );

  const exportSlot = useCallback(
    async (slot: LivingSaveSlotSummary) => {
      setLocalFailure(null);
      const result = await coordinator.readEnvelope(slot.slotId);
      if (!result.ok) {
        setLocalFailure(result.code);
        return;
      }

      const blob = new Blob([serializeLivingSaveFile(result.value)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileNameForSlot(slot, result.value.resumePointId);
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    },
    [coordinator],
  );
  const countdownNow = Math.max(now, Date.now());

  return (
    <SaveSlotHub
      slots={livingSaves.slots}
      saveHealth={livingSaves.saveHealth}
      failureReason={localFailure ?? livingSaves.failureReason}
      isBusy={livingSaves.operation !== null}
      title={title}
      description={description}
      onSelect={onSelect}
      renderManagementActions={(slot) => {
        const tombstone = livingSaves.tombstones[slot.slotId];
        const undoSeconds = tombstone
          ? Math.max(
              0,
              Math.ceil((tombstone.expiresAt - countdownNow) / 1000),
            )
          : 0;

        return (
          <>
            {slot.state === 'empty' && undoSeconds > 0 && (
              <button
                type="button"
                className={styles.slotAction}
                onClick={() => {
                  void runManagement(() =>
                    coordinator.undoDelete(slot.slotId),
                  );
                }}
              >
                Undo ({undoSeconds}s)
              </button>
            )}
            {slot.state === 'empty' && undoSeconds === 0 && (
              <label className={styles.slotAction}>
                Import
                <input
                  className={styles.fileInput}
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => {
                    const input = event.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    if (file.size > MAX_LIVING_SAVE_FILE_BYTES) {
                      setLocalFailure('The save file is too large.');
                      input.value = '';
                      return;
                    }
                    void (async () => {
                      try {
                        const text = await file.text();
                        await runManagement(() =>
                          coordinator.importFileText(slot.slotId, text),
                        );
                      } catch {
                        setLocalFailure('The save file could not be read.');
                      } finally {
                        input.value = '';
                      }
                    })();
                  }}
                />
              </label>
            )}
            {slot.state === 'occupied' && (
              <button
                type="button"
                className={styles.slotAction}
                onClick={() => {
                  void exportSlot(slot);
                }}
              >
                Export
              </button>
            )}
            {slot.state !== 'empty' && (
              <button
                type="button"
                className={`${styles.slotAction} ${styles.deleteAction}`}
                aria-label={`Delete slot ${slot.slotId.slice(-1)}`}
                onClick={() => {
                  void runManagement(() =>
                    coordinator.deleteSlot(slot.slotId),
                  );
                }}
              >
                <span aria-hidden="true">🗑</span> Delete
              </button>
            )}
            {slot.active &&
              livingSaves.saveHealth === 'save-unavailable' && (
                <button
                  type="button"
                  className={styles.slotAction}
                  onClick={() => {
                    void requestLivingSaveCheckpoint(
                      livingSaves.runtimeGeneration,
                    );
                  }}
                >
                  Retry save
                </button>
              )}
          </>
        );
      }}
    />
  );
};
