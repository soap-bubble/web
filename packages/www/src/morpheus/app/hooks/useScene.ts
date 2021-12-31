import { Dispatch, useContext, useMemo } from 'react';
import { useEffect } from 'react';
import { useReducer } from 'react';
import { fetch } from 'service/scene';
import { Scene } from '../../casts/types';
import createContext from 'utils/createContext';

const FETCHING = 'fetching';
const ERRORED = 'errored';
const LOADING = 'loading';
const LOADED = 'loaded';
const ENTERED = 'enetered';
const CULL = 'cull';

interface FetchAction {
  type: typeof FETCHING;
  payload: number;
}
function fetchActionCreator(sceneId: number): FetchAction {
  return {
    type: FETCHING,
    payload: sceneId,
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
  | ErroredAction
  | LoadingAction
  | LoadedAction
  | EnteredAction
  | CullAction;

interface State {
  fetching: boolean;
  fetchingScene: number | null;
  error: Error | null;
  loading: boolean;
  transitioning: boolean;
  entered: boolean;
  scenes: Scene[];
}
const initialState: State = {
  fetching: false,
  fetchingScene: null,
  error: null,
  loading: false,
  transitioning: false,
  entered: false,
  scenes: [],
};

function reducer(state: State, action: Actions): State {
  switch (action.type) {
    case FETCHING:
      return {
        ...state,
        fetching: true,
        fetchingScene: action.payload,
        loading: false,
        transitioning: false,
        entered: false,
      };
    case ERRORED:
      return {
        ...state,
        fetching: false,
        fetchingScene: null,
        error: action.payload,
        loading: false,
        transitioning: false,
        entered: false,
      };
    case LOADING:
      return {
        ...state,
        fetching: false,
        fetchingScene: null,
        loading: true,
        transitioning: false,
        entered: false,
        scenes: [
          ...state.scenes.filter(
            ({ sceneId }) => sceneId !== action.payload.sceneId,
          ),
          action.payload,
        ],
      };
    case LOADED:
      return {
        ...state,
        fetching: false,
        fetchingScene: null,
        loading: false,
        transitioning: true,
        entered: false,
      };
    case ENTERED:
      return {
        ...state,
        fetching: false,
        fetchingScene: null,
        loading: false,
        transitioning: false,
        entered: true,
      };
    case CULL:
      // Remove the scene and all other scenes before the payload from the scene list
      const culledScenes: Scene[] = [];
      let culled = false;
      for (const scene of state.scenes) {
        if (scene.sceneId === action.payload.sceneId) {
          culled = true;
        } else if (culled) {
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
  useEffect(() => {
    if (state.fetching && state.fetchingScene !== null) {
      let wasCancelled = false;
      fetch(state.fetchingScene).then(
        (scene) => {
          if (!wasCancelled) {
            if (scene) {
              dispatch(loadedActionCreator(scene));
            } else {
              dispatch(erroredActionCreator(new Error('Scene not found')));
            }
          }
        },
        (err) => {
          if (!wasCancelled) {
            dispatch(erroredActionCreator(err));
          }
        },
      );
      return () => {
        wasCancelled = true;
      };
    }
  }, [state.fetching, state.fetchingScene]);

  return useMemo(
    () => ({
      ...state,
      fetch(sceneId: number) {
        dispatch(fetchActionCreator(sceneId));
      },
      run(scene: Scene) {
        dispatch(loadingActionCreator(scene));
      },
      loaded(scene: Scene) {
        dispatch(loadedActionCreator(scene));
      },
      transitioned(scene: Scene) {
        dispatch(enteredActionCreator(scene));
      },
      cull(scene: Scene) {
        dispatch(cullActionCreator(scene));
      },
    }),
    [state, dispatch],
  );
}
