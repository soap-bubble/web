import { configureStore } from '@reduxjs/toolkit';
import type { AnyAction } from '@reduxjs/toolkit';
import type { ThunkDispatch } from 'redux-thunk';
import sceneReducer from './slices/sceneSlice';
import rotationReducer from './slices/rotationSlice';
import gamestateReducer from './slices/gamestateSlice';
import livingSavesReducer from './slices/livingSavesSlice';
import gameMenuReducer from './slices/gameMenuSlice';

export const createAppStore = () =>
  configureStore({
    reducer: {
      scene: sceneReducer,
      rotation: rotationReducer,
      gamestate: gamestateReducer,
      livingSaves: livingSavesReducer,
      gameMenu: gameMenuReducer,
    },
  });

export type AppStore = ReturnType<typeof createAppStore>;

export const store = createAppStore();

export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;
