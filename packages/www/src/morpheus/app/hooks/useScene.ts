import { Dispatch, useContext, useMemo } from 'react';
import { useEffect } from 'react';
import { useReducer } from 'react';
import { fetch } from 'service/scene';
import { Scene } from '../../casts/types';
import createContext from 'utils/createContext';

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

const EXITING = 'exiting';
const EXITED = 'exited';
const FETCH = 'fetch';
const ERRORED = 'errored';
const LOADING = 'loading';
const LOADED = 'loaded';
const ENTERED = 'enetered';
const CULL = 'cull';

interface FetchAction {
  type: typeof FETCH;
  payload: number;
}
function fetchActionCreator(sceneId: number): FetchAction {
  return {
    type: FETCH,
    payload: sceneId,
  };
}

interface ExitingAction {
  type: typeof EXITING;
}
function exitingActionCreator(): ExitingAction {
  return {
    type: EXITING,
  };
}

interface ExitedAction {
  type: typeof EXITED;
  payload: Scene;
}
function exitedActionCreator(scene: Scene): ExitedAction {
  return {
    type: EXITED,
    payload: scene,
  };
}

interface ErroredAction {
  type: typeof ERRORED;
  payload: Error;
}
function erroredActionCreator(error: Error): ErroredAction {
  return {
    type: ERRORED,
    payload: error,
  };
}

interface LoadingAction {
  type: typeof LOADING;
  payload: Scene;
}
function loadingActionCreator(scene: Scene): LoadingAction {
  return {
    type: LOADING,
    payload: scene,
  };
}

interface LoadedAction {
  type: typeof LOADED;
  payload: Scene;
}
function loadedActionCreator(scene: Scene): LoadedAction {
  return {
    type: LOADED,
    payload: scene,
  };
}

interface EnteredAction {
  type: typeof ENTERED;
  payload: Scene;
}
function enteredActionCreator(scene: Scene): EnteredAction {
  return {
    type: ENTERED,
    payload: scene,
  };
}

interface CullAction {
  type: typeof CULL;
  payload: Scene;
}
function cullActionCreator(scene: Scene): CullAction {
  return {
    type: CULL,
    payload: scene,
  };
}

type Actions =
  | FetchAction
  | ExitingAction
  | ExitedAction
  | ErroredAction
  | LoadingAction
  | LoadedAction
  | EnteredAction
  | CullAction;

enum Status {
  UNKNOWN,
  EXITING,
  EXITED,
  ERRORED,
  LOADING,
  LOADED,
  ENTERED,
}

interface State {
  fetchingScene: number | null;
  error: Error | null;
  isFetching: boolean;
  status: Status;
  scenes: Scene[];
}
const initialState: State = {
  fetchingScene: null,
  isFetching: false,
  error: null,
  status: Status.UNKNOWN,
  scenes: [],
};

function reducer(state: State, action: Actions): State {
  switch (action.type) {
    case FETCH:
      return {
        ...state,
        fetchingScene: action.payload,
        isFetching: true,
        error: null,
      };
    case EXITING:
      return {
        ...state,
        error: null,
        status: Status.EXITING,
      };
    case EXITED:
      return {
        ...state,
        status: Status.EXITED,
      };
    case ERRORED:
      return {
        ...state,
        fetchingScene: null,
        error: action.payload,
        status: Status.ERRORED,
      };
    case LOADING:
      return {
        ...state,
        fetchingScene: null,
        scenes: [
          action.payload,
          ...state.scenes.filter(
            ({ sceneId }) => sceneId !== action.payload.sceneId,
          ),
        ],
        status: Status.LOADING,
      };
    case LOADED:
      return {
        ...state,
        status: Status.LOADED,
      };
    case ENTERED:
      return {
        ...state,
        status: Status.ENTERED,
      };
    case CULL:
      // Remove the scene and all other scenes after the payload from the scene list
      const culledScenes: Scene[] = [];
      let culled = false;
      for (const scene of state.scenes) {
        if (scene.sceneId === action.payload.sceneId) {
          culled = true;
        } else if (!culled) {
          culledScenes.push(scene);
        }
      }
      return {
        ...state,
        scenes: culledScenes,
      };
    default:
      return state;
  }
}

const [getContext, Provider] = createContext<
  Record<string, any>,
  [State, Dispatch<Actions>]
>(() => useReducer(reducer, initialState));

export { Provider };

export default function useScene() {
  const [state, dispatch] = useContext(getContext());

  // Fetch scene when requested
  // useEffect(() => {
  //   if (!state.isFetching && state.fetchingScene !== null) {
  //     let wasCancelled = false;
  //     fetch(state.fetchingScene).then(
  //       (scene) => {
  //         if (!wasCancelled) {
  //           if (scene) {
  //             dispatch(loadingActionCreator(scene));
  //           } else {
  //             dispatch(erroredActionCreator(new Error('Scene not found')));
  //           }
  //         }
  //       },
  //       (err) => {
  //         if (!wasCancelled) {
  //           dispatch(erroredActionCreator(err));
  //         }
  //       },
  //     );
  //     return () => {
  //       wasCancelled = true;
  //     };
  //   }
  // }, [state.status, state.fetchingScene]);

  // // If the scene is exiting and a fetchScene is defined, then fetch it if needed
  // useEffect(() => {
  //   if (state.status === Status.EXITING && state.fetchingScene !== null) {
  //     dispatch(fetchActionCreator(state.fetchingScene));
  //   }
  // }, [state.status]);

  // If a scene has exited and the next scene has been fetched, then
  return useMemo(
    () => ({
      ...state,
      fetch(sceneId: number) {
        if (
          // Safetly valve for now.... only allow fetch when stable
          state.status !== Status.ENTERED &&
          state.scenes.find(({ sceneId }) => sceneId === sceneId) === undefined
        ) {
          dispatch(fetchActionCreator(sceneId));
        }
      },
      exiting() {
        dispatch(exitingActionCreator());
      },
      exited(scene: Scene) {
        dispatch(exitedActionCreator(scene));
      },
      loaded(scene: Scene) {
        dispatch(loadedActionCreator(scene));
      },
      entered(scene: Scene) {
        dispatch(enteredActionCreator(scene));
      },
      cull(scene: Scene) {
        dispatch(cullActionCreator(scene));
      },
      status: state.status,
    }),
    [state, dispatch],
  );
}
