import {
  Action,
  createAction,
  createSelector,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import { Scene } from 'morpheus/casts/types';
import { ofType } from 'redux-observable';
import {
  Observable,
  BehaviorSubject,
  filter,
  mergeMap,
  of,
  Subject,
  takeUntil,
  withLatestFrom,
  concatWith,
  concat,
  map,
  tap,
  from,
  catchError,
} from 'rxjs';
import createEpic from 'utils/createEpic';
import { actions as inputActions } from 'morpheus/input';
import { fetch as fetchScene } from 'service/scene';
import createReducer, { install } from 'utils/createReducer';

/*
 * Manages the fetching of, entering and exiting of scenes.
 *
 * The flow of scenes is from an initial unknown state to the loading of the first scene.
 * Loading additional scenes is an asynchronous process whereby first scene exits, which
 * could involve an animation, and then the next scene is loaded. After a scene is loaded, there
 * is a secondary process whereby all assets for the sceen are also loaded and then the scene
 * can be entered, which again could involve an animation.
 *
 */

export enum GlobalSceneState {
  UNKNOWN,
  FETCHING,
  ERROR,
  WAITING_ON_ASSET_LOADING,
  PENDING,
  EXITING,
  ENTERING,
  ENTERED,
  READY,
}

export enum SceneState {
  UNKNOWN,
  FETCHING,
  ASSET_LOADING,
  READY,
  ERROR,
}

interface SceneCacheEntry {
  promiseScene: Promise<Scene>;
  scene?: Scene;
  state: SceneState;
}

interface SceneTransitionRequest {
  sceneId: number;
  dissolve?: boolean;
  angle?: number;
}

interface State {
  status: GlobalSceneState;
  sceneStack: Scene[];
  scenesToFetch: number[];
  nextSceneRequest: SceneTransitionRequest | null;
  currentScene: Scene | null;
  previousScene: Scene | null;
  cache: { [sceneId: number]: SceneCacheEntry };
}

const initialState: State = {
  status: GlobalSceneState.UNKNOWN,
  scenesToFetch: [],
  sceneStack: [],
  nextSceneRequest: null,
  currentScene: null,
  previousScene: null,
  cache: {},
};

const slice = createSlice({
  name: 'scene',
  initialState,
  reducers: {
    // High level actions, intended to be dispatched by the app
    init: (state, action: PayloadAction<Scene>) => {
      state.status = GlobalSceneState.READY;
      state.sceneStack = [action.payload];
    },
    nextScene(state, action: PayloadAction<SceneTransitionRequest>) {
      const { sceneId, dissolve, angle } = action.payload;
      state.nextSceneRequest = { sceneId, dissolve, angle };
    },
    go() {
      // Empty action, used to signal that the scene manager should go to the next scene
    },
    // Low level actions, intended to be dispatched by the scene manager
    request(state, action: PayloadAction<number>) {
      state.status = GlobalSceneState.FETCHING;
      if (
        !state.scenesToFetch.includes(action.payload) &&
        !state.cache[action.payload]
      ) {
        state.scenesToFetch = [...state.scenesToFetch, action.payload];
      }
    },
    fetch(
      state,
      action: PayloadAction<{ sceneId: number; promiseScene: Promise<Scene> }>,
    ) {
      state.cache[action.payload.sceneId] = {
        promiseScene: action.payload.promiseScene,
        state: SceneState.FETCHING,
      };
      state.scenesToFetch = state.scenesToFetch.filter(
        (id) => id !== action.payload.sceneId,
      );
    },
    fetchSuccess(state, action: PayloadAction<Scene>) {
      state.cache[action.payload.sceneId] =
        state.cache[action.payload.sceneId] || {};
      state.cache[action.payload.sceneId].scene = action.payload;
      state.cache[action.payload.sceneId].state = SceneState.ASSET_LOADING;
    },
    fetchError(state, action: PayloadAction<number>) {
      state.cache[action.payload].state = SceneState.ERROR;
    },
    assetsLoaded(state, action: PayloadAction<Scene>) {
      state.status = GlobalSceneState.PENDING;
      state.cache[action.payload.sceneId].state = SceneState.READY;
    },
    waitingOnAssetsLoading(state) {
      state.status = GlobalSceneState.WAITING_ON_ASSET_LOADING;
    },
    entering(state, action: PayloadAction<Scene>) {
      state.status = GlobalSceneState.ENTERING;
      state.previousScene = state.currentScene;
      state.currentScene = action.payload;
    },
    exiting(state) {
      state.status = GlobalSceneState.EXITING;
    },
    entered(state, action: PayloadAction<Scene>) {
      state.status = GlobalSceneState.ENTERED;
    },
    ready(state, action: PayloadAction<Scene>) {
      state.status = GlobalSceneState.READY;
      state.currentScene = action.payload;
      state.nextSceneRequest = null;
      state.sceneStack = [
        action.payload,
        ...state.sceneStack.filter(
          ({ sceneId }) => sceneId !== action.payload.sceneId,
        ),
      ];
    },
    error(state) {
      state.status = GlobalSceneState.ERROR;
    },
  },
});

// Action types
type PropertyReturnTypes<T> = T[keyof T] extends (a: any) => any
  ? ReturnType<T[keyof T]>
  : never;

export type InitAction = ReturnType<typeof slice.actions.init>;
export type GoAction = ReturnType<typeof slice.actions.go>;
export type ExitingAction = ReturnType<typeof slice.actions.exiting>;
export type EnteringAction = ReturnType<typeof slice.actions.entering>;
export type EnteredAction = ReturnType<typeof slice.actions.entered>;
export type FetchAction = ReturnType<typeof slice.actions.fetch>;
export type FetchedAction = ReturnType<typeof slice.actions.fetchSuccess>;
export type FetchErrorAction = ReturnType<typeof slice.actions.fetchError>;
export type WaitingOnAssetsLoadingAction = ReturnType<
  typeof slice.actions.waitingOnAssetsLoading
>;
export type AssetsLoadedAction = ReturnType<typeof slice.actions.assetsLoaded>;
export type ReadyAction = ReturnType<typeof slice.actions.ready>;

// Related input actions
type EnableInputControlAction = ReturnType<typeof inputActions.enableControl>;
type DisableInputControlAction = ReturnType<typeof inputActions.disableControl>;

type AnySceneAction = PropertyReturnTypes<typeof slice.actions>;

createEpic<AnySceneAction, AnySceneAction, { scene: State }>(
  (action$, state$) =>
    action$.pipe(
      ofType<AnySceneAction, typeof slice.actions.go.type, GoAction>(
        slice.actions.go.type,
      ),
      withLatestFrom(state$),
      filter(
        ([_, state]) =>
          selectCurrentSceneId(state) !== selectNextSceneId(state),
      ),
      mergeMap(([_, state]) => {
        const nextSceneId = selectNextSceneId(state);
        if (!!nextSceneId) {
          const existsInCache = !!selectCache(state)[nextSceneId];
          let actions: Observable<
            | ExitingAction
            | DisableInputControlAction
            | FetchAction
            | FetchedAction
            | FetchErrorAction
            | WaitingOnAssetsLoadingAction
          > = of(inputActions.disableControl(), slice.actions.exiting());
          if (!existsInCache) {
            const promiseScene = fetchScene(nextSceneId).then((scene) => {
              if (!scene) {
                throw new Error('Scene not found');
              }
              return scene;
            });
            actions = concat(
              actions,
              of(
                slice.actions.fetch({
                  sceneId: nextSceneId,
                  promiseScene,
                }),
              ),
              from(promiseScene).pipe(
                map((scene) => slice.actions.fetchSuccess(scene)),
                catchError(() => of(slice.actions.fetchError(nextSceneId))),
              ),
              action$.pipe(
                withLatestFrom(state$),
                mergeMap(([_, state]) => {
                  return action$.pipe(
                    ofType<
                      AnySceneAction,
                      typeof slice.actions.fetchSuccess.type,
                      FetchedAction
                    >(slice.actions.fetchSuccess.type),
                    filter(
                      ({ payload }) =>
                        payload.sceneId === selectNextSceneId(state),
                    ),
                    map(() => slice.actions.waitingOnAssetsLoading()),
                  );
                }),
              ),
            );
          }
          return actions;
        }
        return [];
      }),

      // Maybe this should just be component state?
      // mergeMap(() =>
      //   action$.pipe(
      //     ofType<
      //       AnySceneAction,
      //       typeof slice.actions.assetsLoaded.type,
      //       AssetsLoadedAction
      //     >(slice.actions.ready.type),
      //     withLatestFrom(state$),
      //     filter(
      //       ([{ payload }, state]) =>
      //         !!selectNextSceneId(state) &&
      //         payload.sceneId === selectNextSceneId(state),
      //     ),
      //     map(([action, state]) => slice.actions.entering(action.payload)),
      //     mergeMap(() =>
      //       action$.pipe(
      //         ofType<
      //           AnySceneAction,
      //           typeof slice.actions.entered.type,
      //           EnteredAction
      //         >(slice.actions.ready.type),
      //         map(() => inputActions.enableControl()),
      //       ),
      //     ),
      //   ),
      // ),
    ),
);

const selectRoot = (state: { scene: State }): State => state.scene;
const selectCurrentScenesData = createSelector(
  selectRoot,
  (scene) => scene.sceneStack,
);
const selectCurrentSceneData = createSelector(
  selectRoot,
  (scene) => scene.currentScene,
);
const selectPreviousSceneData = createSelector(
  selectRoot,
  (scene) => scene.previousScene,
);
const selectIsEntering = createSelector(
  selectRoot,
  (scene) => scene.status === GlobalSceneState.ENTERING,
);
const selectIsExiting = createSelector(
  selectRoot,
  (scene) => scene.status === GlobalSceneState.EXITING,
);
const selectIsLive = createSelector(
  selectRoot,
  (scene) => scene.status === GlobalSceneState.READY,
);
const selectNextSceneId = createSelector(
  selectRoot,
  (scene) => scene.nextSceneRequest?.sceneId,
);
const selectCache = createSelector(selectRoot, (scene) => scene.cache);
const selectCurrentSceneId = createSelector(selectCurrentSceneData, (cs) =>
  cs ? cs.sceneId : null,
);
const selectCurrentSceneType = createSelector(selectCurrentSceneData, (cs) =>
  cs ? cs.sceneType : null,
);
const selectPreviousSceneType = createSelector(selectPreviousSceneData, (ps) =>
  ps ? ps.sceneType : null,
);
const selectPreviousSceneId = createSelector(selectPreviousSceneData, (cs) =>
  cs ? cs.sceneId : null,
);
const selectNextSceneStartAngle = createSelector(
  selectRoot,
  (scene) => scene.nextSceneRequest?.angle,
);
const selectDissolve = createSelector(
  selectRoot,
  (scene) => scene.nextSceneRequest?.dissolve,
);

export const selectors = {
  currentScenesData: selectCurrentScenesData,
  currentSceneData: selectCurrentSceneData,
  previousSceneData: selectPreviousSceneData,
  isEntering: selectIsEntering,
  isExiting: selectIsExiting,
  isLive: selectIsLive,
  nextSceneId: selectNextSceneId,
  currentSceneId: selectCurrentSceneId,
  currentSceneType: selectCurrentSceneType,
  previousSceneType: selectPreviousSceneType,
  previousSceneId: selectPreviousSceneId,
  nextSceneStartAngle: selectNextSceneStartAngle,
  dissolve: selectDissolve,
  cache: selectCache,
};
export const actions = slice.actions;
export const reducer = slice.reducer;

install('scene', reducer);
