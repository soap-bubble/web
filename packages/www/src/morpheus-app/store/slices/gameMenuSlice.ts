import { createSlice } from '@reduxjs/toolkit';

import { resetGame } from '../actions';

export type GameMenuState = {
  open: boolean;
  screen: 'main' | 'save-slots';
};

const createInitialState = (): GameMenuState => ({
  open: false,
  screen: 'main',
});

const gameMenuSlice = createSlice({
  name: 'gameMenu',
  initialState: createInitialState(),
  reducers: {
    openGameMenu(state) {
      state.open = true;
      state.screen = 'main';
    },
    closeGameMenu(state) {
      state.open = false;
      state.screen = 'main';
    },
    showGameMenuMain(state) {
      state.screen = 'main';
    },
    showGameMenuSaveSlots(state) {
      state.screen = 'save-slots';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetGame, createInitialState);
  },
});

export const {
  closeGameMenu,
  openGameMenu,
  showGameMenuMain,
  showGameMenuSaveSlots,
} = gameMenuSlice.actions;

export const gameMenuReducer = gameMenuSlice.reducer;
export default gameMenuSlice.reducer;

export const selectGameMenu = (state: { gameMenu: GameMenuState }) =>
  state.gameMenu;
