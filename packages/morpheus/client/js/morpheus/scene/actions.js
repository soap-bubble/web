import {
  flow,
} from 'lodash';
import { reset } from 'utils/render';
import Events from 'events';
import { bySceneId } from 'service/scene';
import {
  actions as inputActions,
} from 'morpheus/input';
import {
  actions as castActions,
} from 'morpheus/casts';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import loggerFactory from 'utils/logger';
import SceneQueue from './queue';
import {
  SCENE_LOAD_START,
  SCENE_LOAD_ERROR,
  SCENE_LOAD_COMPLETE,
  SCENE_SET_BACKGROUND_SCENE,
  SCENE_SET_CURRENT_SCENE,
  SCENE_DO_ENTERING,
  SCENE_ENTER_DONE,
  SCENE_DO_EXITING,
  SET_NEXT_START_ANGLE,
} from './actionTypes';

const logger = loggerFactory('scene:actions');
export const events = new Events();
const sceneLoadQueue = new SceneQueue();

export function sceneLoadComplete(responseData) {
  return (dispatch) => {
    logger.info('sceneLoadComplete', responseData.sceneId);
    dispatch({
      type: SCENE_SET_CURRENT_SCENE,
      payload: responseData,
    });
  };
}

export function sceneLoadStarted(id, fetchPromise) {
  logger.info('sceneLoadStarted', id);
  return {
    type: SCENE_LOAD_START,
    payload: id,
    meta: fetchPromise,
  };
}

export function fetch(id) {
  return (dispatch, getState) => {
    logger.info('fetch', id);
    const loadedScenes = sceneSelectors.loadedScenes(getState());
    const cachedScene = loadedScenes.find(scene => scene.sceneId === id);
    if (cachedScene) {
      return Promise.resolve(cachedScene);
    }
    const fetchPromise = bySceneId(id)
      .then(response => response.data)
      .then((scene) => {
        dispatch({
          type: SCENE_LOAD_COMPLETE,
          payload: scene,
        });
        return scene;
      });
    dispatch(sceneLoadStarted(id, fetchPromise));
    return fetchPromise;
  };
}

export function fetchScene(id) {
  logger.info('fetchScene', id);
  return dispatch => dispatch(fetch(id))
      .then((sceneData) => {
        dispatch(sceneLoadComplete(sceneData));
        return sceneData;
      });
}

export function setBackgroundScene(scene) {
  return {
    type: SCENE_SET_BACKGROUND_SCENE,
    payload: scene,
  };
}

export function setNextStartAngle(angle) {
  return {
    type: SET_NEXT_START_ANGLE,
    payload: angle,
  };
}

const CURRENT_SCENE_STACK_SIZE = 6;

function doSceneEntering(scene) {
  return (dispatch, getState) => {
    let oldScene;
    let currentScenes = sceneSelectors.currentScenesData(getState());
    const previousScene = sceneSelectors.currentSceneData(getState());
    const currentScene = scene;

    // Check if scene is already in scene stack
    const existingScene = currentScenes.find(s => s.sceneId === scene.sceneId);
    if (existingScene) {
      // Promote existing scene to top...
      currentScenes = currentScenes.remove(currentScenes.indexOf(existingScene));
    } else if (currentScenes.count() === CURRENT_SCENE_STACK_SIZE
      || (currentScenes.count() === 1 && currentScenes.first().sceneId === 100000)) {
      oldScene = currentScenes.last();
      currentScenes = currentScenes.pop();
    }
    currentScenes = currentScenes.unshift(scene);

    dispatch({
      type: SCENE_DO_ENTERING,
      payload: {
        currentScenes,
        currentScene,
        previousScene,
        sceneId: scene.sceneId,
      },
    });
    return oldScene;
  };
}

export function runScene(scene) {
  return async (dispatch, getState) => {
    logger.info('runScene', scene.sceneId);
    let userIncontrol = false;
    try {
      await dispatch(castActions.lifecycle.doLoad(scene));
      await dispatch(castActions.lifecycle.doEnter(scene));
      const sceneToUnload = dispatch(doSceneEntering(scene));
      await dispatch(castActions.lifecycle.onStage(scene));
      if (sceneToUnload) {
        await dispatch(castActions.lifecycle.doUnload(sceneToUnload));
      }
      await dispatch(castActions.unpreloadAll());

      dispatch({
        type: SCENE_ENTER_DONE,
        payload: scene.sceneId,
      });

      dispatch(inputActions.enableControl());
      userIncontrol = true;
      events.emit(`sceneEnter:${scene.sceneId}`);
    } catch (error) {
      logger.error({
        message: 'runScene error',
        error,
      });
      // Make sure user has control anyways
      if (!userIncontrol) {
        dispatch(inputActions.enableControl());
      }
    }
  };
}

export function startAtScene(id) {
  return dispatch => dispatch(fetchScene(id))
      .then(scene => dispatch(runScene(scene)))
      .catch((error) => {
        dispatch(inputActions.enableControl());
        dispatch({
          type: SCENE_LOAD_ERROR,
          error,
        });
      });
}

let isTransitioning = false;
export function goToScene(id, dissolve) {
  logger.info('goToScene:queue', id);
  sceneLoadQueue.cancel();
  return (dispatch, getState) => sceneLoadQueue.add({
    id,
    tasks: [
      () => {
        logger.info('goToScene:start', id);
        const currentSceneData = sceneSelectors.currentSceneData(getState());

        function doSceneTransition() {
          isTransitioning = true;
          return dispatch(castActions.lifecycle.doExit(currentSceneData))
              .then(() => {
                logger.info('goToScene:exiting', id);
                dispatch({
                  type: SCENE_DO_EXITING,
                  payload: {
                    sceneId: currentSceneData && currentSceneData.sceneId,
                    dissolve,
                  },
                });
                dispatch(inputActions.disableControl());
                reset();
                return dispatch(startAtScene(id))
                  .then((scene) => {
                    isTransitioning = false;
                    return scene;
                  });
              });
        }

        if (isTransitioning || (currentSceneData && currentSceneData.sceneId === id)) {
          logger.warn(`goToScene:isTransitioning=${isTransitioning}:currentSceneData:${currentSceneData}`);
          return Promise.resolve(currentSceneData);
        }
        return doSceneTransition();
      },
    ],
  });
}
