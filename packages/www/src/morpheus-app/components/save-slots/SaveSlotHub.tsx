import type { ReactNode } from 'react';

import type {
  LivingSaveHealth,
  LivingSaveSlotSummary,
} from '@/morpheus-app/store/slices/livingSavesSlice';

import { SaveSlotCard } from './SaveSlotCard';
import styles from './save-slots.module.css';

type SaveSlotHubProps = {
  slots: readonly LivingSaveSlotSummary[];
  saveHealth: LivingSaveHealth;
  failureReason: string | null;
  isBusy?: boolean;
  title?: string;
  description?: string;
  onSelect: (slot: LivingSaveSlotSummary) => void;
  renderManagementActions?: (slot: LivingSaveSlotSummary) => ReactNode;
};

export const SaveSlotHub = ({
  slots,
  saveHealth,
  failureReason,
  isBusy = false,
  title = 'Choose a living save',
  description = 'Select an empty slot to begin, or continue a saved journey.',
  onSelect,
  renderManagementActions,
}: SaveSlotHubProps) => (
  <section className={styles.hub} aria-busy={isBusy} aria-labelledby="save-slot-title">
    <div className={styles.hubHeading}>
      <h1 id="save-slot-title">{title}</h1>
      <p>{description}</p>
    </div>
    {failureReason && (
      <p className={styles.hubFailure} role="status">
        Save slots are unavailable right now: {failureReason.replace(/-/g, ' ')}.
      </p>
    )}
    <div className={styles.slotGrid}>
      {slots.map((slot) => (
        <SaveSlotCard
          key={slot.slotId}
          slot={slot}
          saveHealth={saveHealth}
          disabled={isBusy}
          onSelect={() => onSelect(slot)}
          renderManagementActions={renderManagementActions}
        />
      ))}
    </div>
  </section>
);
