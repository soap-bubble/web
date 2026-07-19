import { createAction } from '@reduxjs/toolkit';
import type { Scene } from 'morpheus/casts/types';

import type {
  LivingSaveCatalog,
  LivingSaveSessionEnvelope,
  LivingSaveSlotId,
} from '@/morpheus-app/storage/livingSaveTypes';

export const resetGame = createAction('game/reset');

export type InstallLivingSaveRuntimePayload = {
  operationId: string;
  catalog: LivingSaveCatalog;
  slotId: LivingSaveSlotId | null;
  envelope: LivingSaveSessionEnvelope;
  activeScene: Scene;
  returnScene: Scene | null;
  saveHealth: 'saved' | 'volatile';
};

export const installLivingSaveRuntime =
  createAction<InstallLivingSaveRuntimePayload>('livingSaves/installRuntime');
