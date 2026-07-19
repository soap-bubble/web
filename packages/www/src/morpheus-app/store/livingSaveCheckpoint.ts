import { writeLivingSaveCheckpoint } from '@/morpheus-app/storage/livingSaveStorage';
import {
  LIVING_SAVE_GAME_DATA_VERSION,
  LIVING_SAVE_SESSION_FORMAT,
  LIVING_SAVE_SESSION_SCHEMA_VERSION,
} from '@/morpheus-app/storage/livingSaveTypes';
import type {
  LivingSaveCatalog,
  LivingSaveResult,
  LivingSaveSessionEnvelope,
  LivingSaveSlotId,
} from '@/morpheus-app/storage/livingSaveTypes';
import {
  livingSaveCheckpointFailed,
  livingSaveCheckpointStarted,
  livingSaveCheckpointSucceeded,
} from './slices/livingSavesSlice';
import { store } from './store';
import type { AppDispatch, RootState } from './store';

type WriteCheckpointParams = {
  slotId: LivingSaveSlotId;
  envelope: LivingSaveSessionEnvelope;
  expectedCatalogRevision: number;
  expectedSlotRevision: number;
};

export type LivingSaveCheckpointDependencies = {
  dispatch: AppDispatch;
  getState: () => RootState;
  writeCheckpoint: (
    params: WriteCheckpointParams,
  ) => Promise<LivingSaveResult<LivingSaveCatalog>>;
  now: () => number;
  createResumePointId: () => string;
};

export type LivingSaveCheckpointCoordinator = {
  requestCheckpoint: (runtimeGeneration: number) => Promise<void>;
};

function browserResumePointId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `resume-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createLivingSaveCheckpointCoordinator(
  dependencies: LivingSaveCheckpointDependencies,
): LivingSaveCheckpointCoordinator {
  let inFlight: Promise<void> | null = null;
  let queuedGeneration: number | null = null;

  const persistGeneration = async (runtimeGeneration: number) => {
    const state = dependencies.getState();
    const { activeSlotId } = state.livingSaves;
    if (
      activeSlotId === null ||
      state.livingSaves.runtimeGeneration !== runtimeGeneration ||
      state.livingSaves.bootstrapPhase !== 'ready' ||
      state.scene.activeSceneId === null
    ) {
      return;
    }
    const slot = state.livingSaves.slots.find(
      (candidate) => candidate.slotId === activeSlotId,
    );
    if (!slot || slot.state !== 'occupied') return;

    const envelope: LivingSaveSessionEnvelope = {
      format: LIVING_SAVE_SESSION_FORMAT,
      schemaVersion: LIVING_SAVE_SESSION_SCHEMA_VERSION,
      gameDataVersion: LIVING_SAVE_GAME_DATA_VERSION,
      resumePointId: dependencies.createResumePointId(),
      savedAt: dependencies.now(),
      gamestateValues: Object.fromEntries(
        Object.values(state.gamestate.byId).map((gamestate) => [
          gamestate.stateId,
          gamestate.value,
        ]),
      ),
      activeSceneId: state.scene.activeSceneId,
      returnSceneId: state.scene.stack[1]?.sceneId ?? null,
      rotation: { ...state.rotation.current },
    };

    dependencies.dispatch(
      livingSaveCheckpointStarted({ runtimeGeneration, slotId: activeSlotId }),
    );
    const result = await dependencies.writeCheckpoint({
      slotId: activeSlotId,
      envelope,
      expectedCatalogRevision: state.livingSaves.catalogRevision,
      expectedSlotRevision: slot.revision,
    });
    if (!result.ok) {
      dependencies.dispatch(
        livingSaveCheckpointFailed({
          runtimeGeneration,
          slotId: activeSlotId,
          reason: result.code,
        }),
      );
      return;
    }
    dependencies.dispatch(
      livingSaveCheckpointSucceeded({
        runtimeGeneration,
        slotId: activeSlotId,
        catalog: result.value,
      }),
    );
  };

  const requestCheckpoint = (runtimeGeneration: number): Promise<void> => {
    if (inFlight) {
      queuedGeneration = runtimeGeneration;
      return inFlight;
    }
    inFlight = (async () => {
      let nextGeneration: number | null = runtimeGeneration;
      while (nextGeneration !== null) {
        queuedGeneration = null;
        await persistGeneration(nextGeneration);
        nextGeneration = queuedGeneration;
      }
    })().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };

  return { requestCheckpoint };
}

const browserCheckpointCoordinator = createLivingSaveCheckpointCoordinator({
  dispatch: store.dispatch,
  getState: store.getState,
  writeCheckpoint: writeLivingSaveCheckpoint,
  now: Date.now,
  createResumePointId: browserResumePointId,
});

export function requestLivingSaveCheckpoint(
  runtimeGeneration: number,
): Promise<void> {
  return browserCheckpointCoordinator.requestCheckpoint(runtimeGeneration);
}
