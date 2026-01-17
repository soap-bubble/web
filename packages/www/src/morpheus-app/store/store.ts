import { configureStore } from '@reduxjs/toolkit';
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
export type AppDispatch = typeof store.dispatch;
