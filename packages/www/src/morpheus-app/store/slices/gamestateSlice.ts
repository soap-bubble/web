import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchInitial } from '@soapbubble/morpheus-client/service/gameState';
import type { Gamestate } from 'morpheus/casts/types';
import {
  installLivingSaveRuntime,
  resetGame,
} from '@/morpheus-app/store/actions';

export type GamestateState = {
  byId: Record<number, Gamestate>;
};

const initialGamestates = fetchInitial();

const createInitialState = (): GamestateState => ({
  byId: Object.fromEntries(
    initialGamestates.map((state) => [state.stateId, { ...state }]),
  ),
});

const initialState = createInitialState();

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
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetGame, createInitialState);
    builder.addCase(installLivingSaveRuntime, (state, action) => {
      const replacement = createInitialState();
      for (const [key, value] of Object.entries(
        action.payload.envelope.gamestateValues,
      )) {
        const id = Number(key);
        const existing = replacement.byId[id];
        if (existing) {
          existing.value = value;
        }
      }
      return replacement;
    });
  },
});

export const { updateGamestate } = gamestateSlice.actions;

export default gamestateSlice.reducer;

export const selectGamestateById = (
  state: { gamestate: GamestateState },
  id: number,
) => state.gamestate.byId[id];

export const selectAllGamestates = (state: { gamestate: GamestateState }) =>
  state.gamestate.byId;

export type GamestatesAccessor = {
  byId: (id: number) => Gamestate;
};

export const selectGamestatesAccessor = createSelector(
  [(state: { gamestate: GamestateState }) => state.gamestate.byId],
  (byId): GamestatesAccessor => {
    return {
      byId(id: number) {
        const gamestate = byId[id];
        if (!gamestate) {
          throw new Error(
            `VariableNotFound ${id} inside ${Object.keys(byId).length} elements`,
          );
        }
        return gamestate;
      },
    };
  },
);
