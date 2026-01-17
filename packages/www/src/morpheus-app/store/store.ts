import { configureStore } from '@reduxjs/toolkit';
import type { AnyAction } from '@reduxjs/toolkit';
import type { ThunkDispatch } from 'redux-thunk';
import sceneReducer from './slices/sceneSlice';
import rotationReducer from './slices/rotationSlice';
import gamestateReducer from './slices/gamestateSlice';

export const store = configureStore({
  reducer: {
    scene: sceneReducer,
    rotation: rotationReducer,
    gamestate: gamestateReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;
