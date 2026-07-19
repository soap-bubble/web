import { describe, expect, it } from 'vitest';

import {
  closeGameMenu,
  gameMenuReducer,
  openGameMenu,
  showGameMenuMain,
  showGameMenuSaveSlots,
} from './gameMenuSlice';

describe('gameMenuSlice', () => {
  it('opens on the two-action main screen and resets there after close', () => {
    let state = gameMenuReducer(undefined, openGameMenu());
    expect(state).toEqual({ open: true, screen: 'main' });

    state = gameMenuReducer(state, showGameMenuSaveSlots());
    expect(state.screen).toBe('save-slots');

    state = gameMenuReducer(state, closeGameMenu());
    expect(state).toEqual({ open: false, screen: 'main' });
  });

  it('supports explicit return to the main screen', () => {
    let state = gameMenuReducer(undefined, openGameMenu());
    state = gameMenuReducer(state, showGameMenuSaveSlots());
    state = gameMenuReducer(state, showGameMenuMain());
    expect(state.screen).toBe('main');
  });
});
