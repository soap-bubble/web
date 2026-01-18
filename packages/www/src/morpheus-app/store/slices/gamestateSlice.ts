import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchInitial } from '@soapbubble/morpheus-client/service/gameState';
import type { Gamestate } from 'morpheus/casts/types';
import type { GamestateDelta } from '@/morpheus-app/storage/types';
import type { GamestateValues } from '@/morpheus-app/storage/gamestateStorage';
import {
  createEntry,
  getEntry,
  resolveValues,
  saveEntry,
  setMeta,
} from '@/morpheus-app/storage/gamestateStorage';

export type GamestateState = {
  byId: Record<number, Gamestate>;
  pendingUpdates: GamestateDelta;
  currentEntryId: string | null;
};

const initialGamestates = fetchInitial();

const genesisValues = (): GamestateValues =>
  Object.fromEntries(initialGamestates.map((state) => [state.stateId, state.value]));

const initialState: GamestateState = {
  byId: Object.fromEntries(
    initialGamestates.map((state) => [state.stateId, state]),
  ),
  pendingUpdates: {},
  currentEntryId: null,
};

function hasPendingUpdates(delta: GamestateDelta): boolean {
  return Object.keys(delta).length > 0;
}

export const commitSceneUpdates = createAsyncThunk<
  { entryId: string | null },
  { sceneId: number },
  { state: { gamestate: GamestateState } }
>('gamestate/commitSceneUpdates', async ({ sceneId }, { getState }) => {
  const { pendingUpdates, currentEntryId } = getState().gamestate;
  if (!hasPendingUpdates(pendingUpdates)) {
    return { entryId: currentEntryId };
  }

  const entry = await createEntry({
    parentId: currentEntryId,
    sceneId,
    delta: pendingUpdates,
  });
  await saveEntry(entry);
  await setMeta({ stackHead: entry.id, version: 1 });

  return { entryId: entry.id };
});

export const popHistory = createAsyncThunk<
  { entryId: string | null; values: GamestateValues },
  void,
  { state: { gamestate: GamestateState } }
>('gamestate/popHistory', async (_, { getState }) => {
  const { currentEntryId } = getState().gamestate;
  const baseValues = genesisValues();
  if (!currentEntryId) {
    await setMeta({ stackHead: null, version: 1 });
    return { entryId: null, values: baseValues };
  }

  const entry = await getEntry(currentEntryId);
  const nextId = entry?.parentId ?? null;
  if (!nextId) {
    await setMeta({ stackHead: null, version: 1 });
    return { entryId: null, values: baseValues };
  }

  const values = await resolveValues(nextId, baseValues);
  await setMeta({ stackHead: nextId, version: 1 });
  return { entryId: nextId, values };
});

const gamestateSlice = createSlice({
  name: 'gamestate',
  initialState,
  reducers: {
    updateGamestate(
      state,
      action: PayloadAction<{ stateId: number; value: number }>,
    ) {
      const { stateId, value } = action.payload;
      const existing = state.byId[stateId];
      if (existing) {
        existing.value = value;
        state.pendingUpdates = { ...state.pendingUpdates, [stateId]: value };
      }
    },
    restoreGamestate(
      state,
      action: PayloadAction<{ values: GamestateValues; entryId: string | null }>,
    ) {
      for (const [key, value] of Object.entries(action.payload.values)) {
        const id = Number(key);
        const existing = state.byId[id];
        if (existing) {
          existing.value = value;
        }
      }
      state.pendingUpdates = {};
      state.currentEntryId = action.payload.entryId;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(commitSceneUpdates.fulfilled, (state, action) => {
      state.currentEntryId = action.payload.entryId;
      state.pendingUpdates = {};
    });
    builder.addCase(popHistory.fulfilled, (state, action) => {
      for (const [key, value] of Object.entries(action.payload.values)) {
        const id = Number(key);
        const existing = state.byId[id];
        if (existing) {
          existing.value = value;
        }
      }
      state.pendingUpdates = {};
      state.currentEntryId = action.payload.entryId;
    });
  },
});

export const { updateGamestate, restoreGamestate } = gamestateSlice.actions;

export default gamestateSlice.reducer;

export const selectGamestateById = (
  state: { gamestate: GamestateState },
  id: number,
) => state.gamestate.byId[id];

export const selectAllGamestates = (state: { gamestate: GamestateState }) =>
  state.gamestate.byId;

export const selectPendingUpdates = (state: { gamestate: GamestateState }) =>
  state.gamestate.pendingUpdates;

export const selectCurrentEntryId = (state: { gamestate: GamestateState }) =>
  state.gamestate.currentEntryId;

export type GamestatesAccessor = {
  byId: (id: number) => Gamestate;
};

export const selectGamestatesAccessor = createSelector(
  [
    (state: { gamestate: GamestateState }) => state.gamestate.byId,
    (state: { gamestate: GamestateState }) => state.gamestate.pendingUpdates,
  ],
  (byId, pendingUpdates): GamestatesAccessor => {
    console.log('[Selector] selectGamestatesAccessor recomputed, pendingUpdates:', Object.keys(pendingUpdates));
    return {
      byId(id: number) {
        const gamestate = byId[id];
        if (!gamestate) {
          throw new Error(`VariableNotFound ${id} inside ${Object.keys(byId).length} elements`);
        }
        return gamestate;
      },
    };
  },
);
