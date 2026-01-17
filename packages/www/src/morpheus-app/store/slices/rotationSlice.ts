import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type Rotation = {
  yaw3600: number;
  pitch: number;
};

export type RotationState = {
  current: Rotation;
  seededFromTransition: boolean;
};

const initialState: RotationState = {
  current: { yaw3600: 0, pitch: 0 },
  seededFromTransition: false,
};

const rotationSlice = createSlice({
  name: 'rotation',
  initialState,
  reducers: {
    setRotation(state, action: PayloadAction<Rotation>) {
      state.current = action.payload;
    },
    seedRotationFromTransition(state, action: PayloadAction<Rotation>) {
      state.current = action.payload;
      state.seededFromTransition = true;
    },
    clearRotationSeed(state) {
      state.seededFromTransition = false;
    },
  },
});

export const { setRotation, seedRotationFromTransition, clearRotationSeed } =
  rotationSlice.actions;

export default rotationSlice.reducer;

export const selectRotation = (state: { rotation: RotationState }) =>
  state.rotation.current;

export const selectRotationSeeded = (state: { rotation: RotationState }) =>
  state.rotation.seededFromTransition;
