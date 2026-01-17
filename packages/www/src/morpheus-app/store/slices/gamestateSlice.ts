import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchInitial } from '@soapbubble/morpheus-client/service/gameState';
import type { Gamestate } from 'morpheus/casts/types';

export type GamestateState = {
  byId: Record<number, Gamestate>;
};

const initialGamestates = fetchInitial();

const initialState: GamestateState = {
  byId: Object.fromEntries(
    initialGamestates.map((state) => [state.stateId, state]),
  ),
};

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
  (byId): GamestatesAccessor => ({
    byId(id: number) {
      const gamestate = byId[id];
      if (!gamestate) {
        throw new Error(`VariableNotFound ${id} inside ${Object.keys(byId).length} elements`);
      }
      return gamestate;
    },
  }),
);
