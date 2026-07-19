import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { LIVING_SAVE_SLOT_IDS } from '@/morpheus-app/storage/livingSaveTypes';
import type {
  LivingSaveCatalog,
  LivingSaveSlotId,
  LivingSaveTombstoneSummary,
  LivingSaveUnloadableReason,
} from '@/morpheus-app/storage/livingSaveTypes';
import { installLivingSaveRuntime, resetGame } from '../actions';

export type LivingSaveBootstrapPhase = 'idle' | 'booting' | 'ready' | 'failed';
export type LivingSaveOperationKind = 'bootstrap' | 'restore' | 'switch';
export type LivingSaveHealth =
  | 'idle'
  | 'saved'
  | 'saving'
  | 'volatile'
  | 'save-unavailable';

export type LivingSaveSlotSummary = {
  slotId: LivingSaveSlotId;
  revision: number;
  state: 'empty' | 'occupied' | 'unloadable';
  active: boolean;
  sceneId: number | null;
  savedAt: number | null;
  resumePointId: string | null;
  unloadableReason: LivingSaveUnloadableReason | null;
};

export type LivingSavesState = {
  bootstrapPhase: LivingSaveBootstrapPhase;
  catalogRevision: number;
  activeSlotId: LivingSaveSlotId | null;
  slots: LivingSaveSlotSummary[];
  tombstones: Partial<Record<LivingSaveSlotId, LivingSaveTombstoneSummary>>;
  runtimeGeneration: number;
  operation: {
    id: string;
    kind: LivingSaveOperationKind;
  } | null;
  saveHealth: LivingSaveHealth;
  failureReason: string | null;
};

const emptySlotSummaries = (): LivingSaveSlotSummary[] =>
  LIVING_SAVE_SLOT_IDS.map((slotId) => ({
    slotId,
    revision: 0,
    state: 'empty',
    active: false,
    sceneId: null,
    savedAt: null,
    resumePointId: null,
    unloadableReason: null,
  }));

const createInitialState = (): LivingSavesState => ({
  bootstrapPhase: 'idle',
  catalogRevision: 0,
  activeSlotId: null,
  slots: emptySlotSummaries(),
  tombstones: {},
  runtimeGeneration: 0,
  operation: null,
  saveHealth: 'idle',
  failureReason: null,
});

function summarizeCatalog(catalog: LivingSaveCatalog): LivingSaveSlotSummary[] {
  return LIVING_SAVE_SLOT_IDS.map((slotId) => {
    const slot = catalog.slots[slotId];
    if (slot.kind === 'occupied') {
      return {
        slotId,
        revision: slot.revision,
        state: slot.kind,
        active: catalog.activeSlotId === slotId,
        sceneId: slot.envelope.activeSceneId,
        savedAt: slot.envelope.savedAt,
        resumePointId: slot.envelope.resumePointId,
        unloadableReason: null,
      };
    }
    return {
      slotId,
      revision: slot.revision,
      state: slot.kind,
      active: catalog.activeSlotId === slotId,
      sceneId: null,
      savedAt: null,
      resumePointId: null,
      unloadableReason: slot.kind === 'unloadable' ? slot.reason : null,
    };
  });
}

function applyCatalog(
  state: LivingSavesState,
  catalog: LivingSaveCatalog,
): void {
  state.bootstrapPhase = 'ready';
  state.catalogRevision = catalog.revision;
  state.activeSlotId = catalog.activeSlotId;
  state.slots = summarizeCatalog(catalog);
  state.tombstones = catalog.tombstones;
}

const livingSavesSlice = createSlice({
  name: 'livingSaves',
  initialState: createInitialState(),
  reducers: {
    livingSaveOperationStarted(
      state,
      action: PayloadAction<{
        operationId: string;
        kind: LivingSaveOperationKind;
      }>,
    ) {
      state.operation = {
        id: action.payload.operationId,
        kind: action.payload.kind,
      };
      state.failureReason = null;
      if (action.payload.kind === 'bootstrap') {
        state.bootstrapPhase = 'booting';
      }
    },
    livingSaveCatalogResolved(
      state,
      action: PayloadAction<{
        catalog: LivingSaveCatalog;
        operationId: string;
      }>,
    ) {
      if (
        state.operation !== null &&
        state.operation.id !== action.payload.operationId
      ) {
        return;
      }
      applyCatalog(state, action.payload.catalog);
    },
    livingSaveOperationCompleted(
      state,
      action: PayloadAction<{
        operationId: string;
        saveHealth: LivingSaveHealth;
      }>,
    ) {
      if (
        state.operation !== null &&
        state.operation.id !== action.payload.operationId
      ) {
        return;
      }
      state.operation = null;
      state.saveHealth = action.payload.saveHealth;
      state.failureReason = null;
    },
    livingSaveOperationFailed(
      state,
      action: PayloadAction<{
        operationId: string;
        reason: string;
        slotId?: LivingSaveSlotId;
        unloadableReason?: LivingSaveUnloadableReason;
      }>,
    ) {
      if (state.operation?.id !== action.payload.operationId) {
        return;
      }
      state.operation = null;
      state.failureReason = action.payload.reason;
      if (action.payload.slotId && action.payload.unloadableReason) {
        state.slots = state.slots.map((slot) =>
          slot.slotId === action.payload.slotId
            ? {
                ...slot,
                state: 'unloadable',
                unloadableReason: action.payload.unloadableReason ?? null,
              }
            : slot,
        );
      }
      if (state.bootstrapPhase === 'booting') {
        state.bootstrapPhase = 'failed';
      }
    },
    livingSaveCheckpointStarted(
      state,
      action: PayloadAction<{
        runtimeGeneration: number;
        slotId: LivingSaveSlotId;
      }>,
    ) {
      if (
        state.runtimeGeneration !== action.payload.runtimeGeneration ||
        state.activeSlotId !== action.payload.slotId
      ) {
        return;
      }
      state.saveHealth = 'saving';
      state.failureReason = null;
    },
    livingSaveCheckpointSucceeded(
      state,
      action: PayloadAction<{
        runtimeGeneration: number;
        slotId: LivingSaveSlotId;
        catalog: LivingSaveCatalog;
      }>,
    ) {
      if (
        state.runtimeGeneration !== action.payload.runtimeGeneration ||
        state.activeSlotId !== action.payload.slotId
      ) {
        return;
      }
      applyCatalog(state, action.payload.catalog);
      state.saveHealth = 'saved';
      state.failureReason = null;
    },
    livingSaveCheckpointFailed(
      state,
      action: PayloadAction<{
        runtimeGeneration: number;
        slotId: LivingSaveSlotId;
        reason: string;
      }>,
    ) {
      if (
        state.runtimeGeneration !== action.payload.runtimeGeneration ||
        state.activeSlotId !== action.payload.slotId
      ) {
        return;
      }
      state.saveHealth = 'save-unavailable';
      state.failureReason = action.payload.reason;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetGame, createInitialState);
    builder.addCase(installLivingSaveRuntime, (state, action) => {
      if (
        state.operation !== null &&
        state.operation.id !== action.payload.operationId
      ) {
        return;
      }
      applyCatalog(state, action.payload.catalog);
      state.runtimeGeneration += 1;
      state.activeSlotId = action.payload.slotId;
      state.slots = state.slots.map((slot) => ({
        ...slot,
        active: slot.slotId === action.payload.slotId,
      }));
      state.operation = null;
      state.saveHealth = action.payload.saveHealth;
      state.failureReason = null;
    });
  },
});

export const {
  livingSaveCheckpointFailed,
  livingSaveCheckpointStarted,
  livingSaveCheckpointSucceeded,
  livingSaveCatalogResolved,
  livingSaveOperationCompleted,
  livingSaveOperationFailed,
  livingSaveOperationStarted,
} = livingSavesSlice.actions;

export const livingSavesReducer = livingSavesSlice.reducer;
export default livingSavesSlice.reducer;

export const selectLivingSaves = (state: { livingSaves: LivingSavesState }) =>
  state.livingSaves;

export const selectLivingSaveInputEnabled = (state: {
  livingSaves: LivingSavesState;
}) =>
  state.livingSaves.bootstrapPhase === 'ready' &&
  state.livingSaves.operation === null;
