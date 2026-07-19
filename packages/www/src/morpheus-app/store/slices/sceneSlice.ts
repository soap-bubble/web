import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Scene } from 'morpheus/casts/types';
import { fetch as fetchScene } from '@soapbubble/morpheus-client/service/scene';
import { createSelector } from 'reselect';

import { resetGame } from '@/morpheus-app/store/actions';
import { installLivingSaveRuntime } from '@/morpheus-app/store/actions';

export type SceneStackEntry = {
  sceneId: number;
  status: 'active' | 'background';
  loadedAt: number;
};

export type SceneState = {
  byId: Record<number, Scene>;
  stack: SceneStackEntry[];
  activeSceneId: number | null;
  returnSceneId: number | null;
  requestedSceneId: number | null;
  maxStackSize: number;
};

const createInitialState = (): SceneState => ({
  byId: {},
  stack: [],
  activeSceneId: null,
  returnSceneId: null,
  requestedSceneId: null,
  maxStackSize: 5,
});

const initialState = createInitialState();

export const loadScene = createAsyncThunk(
  'scene/loadScene',
  async (sceneId: number) => {
    const scene = await fetchScene(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }
    return scene;
  },
);

const sceneSlice = createSlice({
  name: 'scene',
  initialState,
  reducers: {
    scenePrefetched(state, action: PayloadAction<Scene>) {
      state.byId[action.payload.sceneId] = action.payload;
    },
    requestScene(state, action: PayloadAction<number>) {
      state.requestedSceneId = action.payload;
    },
    stageScene(state, action: PayloadAction<number>) {
      const sceneId = action.payload;
      if (!state.byId[sceneId]) {
        state.requestedSceneId = sceneId;
        return;
      }
      const existingIndex = state.stack.findIndex(
        (entry) => entry.sceneId === sceneId,
      );
      if (existingIndex >= 0) {
        return;
      }
      state.stack.splice(1, 0, {
        sceneId,
        status: 'background',
        loadedAt: Date.now(),
      });
      if (state.stack.length > state.maxStackSize) {
        state.stack = state.stack.slice(0, state.maxStackSize);
      }
    },
    activateScene(state, action: PayloadAction<number>) {
      const sceneId = action.payload;
      if (!state.byId[sceneId]) {
        state.requestedSceneId = sceneId;
        return;
      }
      const existingIndex = state.stack.findIndex(
        (entry) => entry.sceneId === sceneId,
      );
      if (existingIndex >= 0) {
        state.stack.splice(existingIndex, 1);
      }
      state.stack.unshift({
        sceneId,
        status: 'active',
        loadedAt: Date.now(),
      });
      state.stack = state.stack.map((entry, index) => ({
        ...entry,
        status: index === 0 ? 'active' : 'background',
      }));
      if (state.stack.length > state.maxStackSize) {
        state.stack = state.stack.slice(0, state.maxStackSize);
      }
      state.activeSceneId = sceneId;
      state.returnSceneId = state.stack[1]?.sceneId ?? null;
      state.requestedSceneId = null;
    },
    activateScenePrune(state, action: PayloadAction<number>) {
      const sceneId = action.payload;
      if (!state.byId[sceneId]) {
        state.requestedSceneId = sceneId;
        return;
      }
      const existingIndex = state.stack.findIndex(
        (entry) => entry.sceneId === sceneId,
      );
      if (existingIndex >= 0) {
        state.stack = state.stack.slice(existingIndex);
      }
      if (state.stack[0]?.sceneId !== sceneId) {
        state.stack.unshift({
          sceneId,
          status: 'active',
          loadedAt: Date.now(),
        });
      } else {
        state.stack[0] = {
          ...state.stack[0],
          status: 'active',
          loadedAt: Date.now(),
        };
      }
      state.activeSceneId = sceneId;
      state.stack = state.stack.map((entry, index) => ({
        ...entry,
        status: index === 0 ? 'active' : 'background',
      }));
      if (state.stack.length > state.maxStackSize) {
        state.stack = state.stack.slice(0, state.maxStackSize);
      }
      state.returnSceneId = state.stack[1]?.sceneId ?? null;
      state.requestedSceneId = null;
    },
    setMaxStackSize(state, action: PayloadAction<number>) {
      state.maxStackSize = action.payload;
      if (state.stack.length > state.maxStackSize) {
        state.stack = state.stack.slice(0, state.maxStackSize);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetGame, createInitialState);
    builder.addCase(installLivingSaveRuntime, (state, action) => {
      const { activeScene, returnScene } = action.payload;
      state.byId[activeScene.sceneId] = activeScene;
      if (returnScene) {
        state.byId[returnScene.sceneId] = returnScene;
      }
      state.activeSceneId = activeScene.sceneId;
      state.returnSceneId = returnScene?.sceneId ?? null;
      state.requestedSceneId = null;
      state.stack = [
        {
          sceneId: activeScene.sceneId,
          status: 'active',
          loadedAt: Date.now(),
        },
        ...(returnScene && returnScene.sceneId !== activeScene.sceneId
          ? [
              {
                sceneId: returnScene.sceneId,
                status: 'background' as const,
                loadedAt: Date.now(),
              },
            ]
          : []),
      ];
    });
    builder.addCase(loadScene.fulfilled, (state, action) => {
      state.byId[action.payload.sceneId] = action.payload;
    });
  },
});

export const {
  scenePrefetched,
  requestScene,
  stageScene,
  activateScene,
  activateScenePrune,
  setMaxStackSize,
} = sceneSlice.actions;

export default sceneSlice.reducer;

export const selectSceneById = (
  state: { scene: SceneState },
  sceneId: number,
) => state.scene.byId[sceneId];

export const selectSceneStack = (state: { scene: SceneState }) =>
  state.scene.stack;

export const selectActiveSceneId = (state: { scene: SceneState }) =>
  state.scene.activeSceneId;

export const selectStageScenes = createSelector(
  [
    (state: { scene: SceneState }) => state.scene.stack,
    (state: { scene: SceneState }) => state.scene.byId,
  ],
  (stack, byId) =>
    stack
      .map((entry) => byId[entry.sceneId])
      .filter((scene): scene is Scene => !!scene),
);
