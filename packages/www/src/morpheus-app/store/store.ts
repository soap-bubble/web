import { configureStore } from '@reduxjs/toolkit';
import sceneReducer from './slices/sceneSlice';
import rotationReducer from './slices/rotationSlice';

export const store = configureStore({
  reducer: {
    scene: sceneReducer,
    rotation: rotationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
