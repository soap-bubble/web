import { reset } from 'utils/render';
import { Action, ActionCreator, Dispatch } from 'redux';
import Events from 'events';
import { actions as inputActions } from 'morpheus/input';
import { selectors as sceneSelectors } from 'morpheus/scene';
import { fetch as serviceFetchScene } from 'service/scene';
import loggerFactory from 'utils/logger';
import { Scene } from '../casts/types';
import createSceneQueue from './queue';
import { firebaseClient } from 'service/firebase';
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
import { ThunkAction } from 'redux-thunk';

const logger = loggerFactory('scene:actions');
export const events = new Events();
export const sceneLoadQueue = createSceneQueue();

export const sceneLoadComplete: ActionCreator<
  ThunkAction<void, any, any, Action>
> = (responseData: any) => {
  return (dispatch: Dispatch) => {
    logger.info(responseData);
    dispatch({
      type: SCENE_SET_CURRENT_SCENE,
      payload: responseData,
    });
  };
};

export const sceneLoadStarted: ActionCreator<Action> = (
  id: string,
  fetchPromise: Promise<any>,
) => {
  logger.info('sceneLoadStarted', id);
  return {
    type: SCENE_LOAD_START,
    payload: id,
    meta: fetchPromise,
  };
};

export const fetch: ActionCreator<
  ThunkAction<Promise<Scene | null>, any, any, Action>
> = (sceneId: number) => {
  return (dispatch: Dispatch) => {
    throw new Error('Use the new hook!');
    // const scene = await serviceFetchScene(sceneId);
    // if (scene) {
    //   // scene.casts = menuDecorator(scene.casts)
    //   dispatch({
    //     type: SCENE_LOAD_COMPLETE,
    //     payload: scene,
    //   });
    //   return scene;
    // }
    return null;
  };
};

export const fetchScene: ActionCreator<
  ThunkAction<Promise<Scene | null>, any, any, Action>
> = (id: string) => {
  logger.info('fetchScene', id);
  throw new Error('Use the new hook!');
  return async (dispatch) => {
    const sceneData = await dispatch(fetch(Number(id)));
    dispatch(sceneLoadComplete(sceneData));
    return sceneData;
  };
};

export const setBackgroundScene: ActionCreator<Action> = (scene: Scene) => {
  return {
    type: SCENE_SET_BACKGROUND_SCENE,
    payload: scene,
  };
};

export const setNextStartAngle: ActionCreator<Action> = (angle) => {
  return {
    type: SET_NEXT_START_ANGLE,
    payload: angle,
  };
};

const CURRENT_SCENE_STACK_SIZE = 6;

const doSceneEntering: ActionCreator<
  ThunkAction<Scene | undefined, any, any, Action>
> = (scene) => {
  return (dispatch, getState) => {
    let oldScene: Scene | undefined = undefined;
    let currentScenes = sceneSelectors.currentScenesData(getState()) as Scene[];
    const previousScene = sceneSelectors.currentSceneData(getState());
    const currentScene = scene;

    // Check if scene is already in scene stack
    const existingScene = currentScenes.find(
      (s) => (s && s.sceneId) === scene.sceneId,
    );
    if (existingScene) {
      const existingSceneIndex = currentScenes.indexOf(existingScene);
      if (existingSceneIndex !== 0) {
        currentScenes = [
          existingScene,
          ...currentScenes.slice(existingSceneIndex),
          ...currentScenes.slice(existingSceneIndex + 1),
        ];
      }
    } else if (
      currentScenes.length === CURRENT_SCENE_STACK_SIZE ||
      (currentScenes.length === 1 && currentScenes[0].sceneId === 100000)
    ) {
      oldScene = currentScenes[currentScenes.length - 1];
      currentScenes = [scene, ...currentScenes.slice(0, -1)];
    } else {
      currentScenes = [scene, ...currentScenes];
    }

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
};

export const runScene: ActionCreator<
  ThunkAction<Promise<void>, any, any, Action>
> = (scene) => {
  return async (dispatch, getState) => {
    logger.info('runScene', scene.sceneId);
    let userIncontrol = false;
    try {
      let currentScenes = sceneSelectors.currentScenesData(
        getState(),
      ) as Scene[];
      // Check if scene is already in scene stack
      const existingScene = currentScenes.find(
        (s) => s.sceneId === scene.sceneId,
      );

      if (!existingScene) {
        // await dispatch(castActions.lifecycle.doLoad(scene))
      }
      // await dispatch(castActions.lifecycle.doEnter(scene))
      const sceneToUnload = dispatch(doSceneEntering(scene));
      // await dispatch(castActions.lifecycle.onStage(scene))
      if (sceneToUnload) {
        // await dispatch(castActions.lifecycle.doUnload(sceneToUnload))
      }
      // await dispatch(castActions.unpreloadAll())

      dispatch({
        type: SCENE_ENTER_DONE,
        payload: scene.sceneId,
      });

      dispatch(inputActions.enableControl());
      userIncontrol = true;
      events.emit(`sceneEnter:${scene.sceneId}`);
    } catch (error) {
      logger.error('runScene error', {
        error,
      });
      // Make sure user has control anyways
      if (!userIncontrol) {
        dispatch(inputActions.enableControl());
      }
    }
  };
};

export const startAtScene: ActionCreator<
  ThunkAction<Promise<void>, any, any, Action>
> = (id) => {
  return (dispatch) =>
    dispatch(fetchScene(id))
      .then((scene) => dispatch(runScene(scene)))
      .catch((error) => {
        dispatch(inputActions.enableControl());
        dispatch({
          type: SCENE_LOAD_ERROR,
          error,
        });
      });
};

let isTransitioning = false;
export const goToScene: ActionCreator<
  ThunkAction<Promise<void>, any, any, Action>
> = (id: string, dissolve: boolean) => {
  throw new Error('Use the new hook!');
  return (dispatch, getState) => {
    logger.info('goToScene:queue', id);
    let currentSceneData = sceneSelectors.currentSceneData(getState());
    if (
      sceneLoadQueue.isPending(id) ||
      (currentSceneData && currentSceneData.sceneId === id)
    ) {
      logger.warn(
        `goToScene:isTransitioning=${isTransitioning}:currentSceneData:${currentSceneData.sceneId}`,
      );
      return Promise.resolve(currentSceneData);
    }
    sceneLoadQueue.cancel();
    return sceneLoadQueue.add({
      id,
      tasks: [
        () => {
          logger.info('goToScene:start', id);
          currentSceneData = sceneSelectors.currentSceneData(getState());

          function doSceneTransition() {
            isTransitioning = true;
            logger.info(
              'goToScene:exiting',
              currentSceneData && currentSceneData.sceneId,
            );
            dispatch({
              type: SCENE_DO_EXITING,
              payload: {
                sceneId: currentSceneData && currentSceneData.sceneId,
                dissolve,
              },
            });
            dispatch(inputActions.disableControl());
            reset();
            return dispatch(startAtScene(id)).then((scene: any) => {
              isTransitioning = false;
              return scene;
            });
            // return dispatch(
            //   castActions.lifecycle.doExit(currentSceneData),
            // ).then(() => {

            // })
          }

          if (
            isTransitioning ||
            (currentSceneData && currentSceneData.sceneId === id)
          ) {
            logger.warn(
              `goToScene:isTransitioning=${isTransitioning}:currentSceneData:${currentSceneData.sceneId}`,
            );
            return Promise.resolve(currentSceneData);
          }
          return doSceneTransition();
        },
      ],
    });
  };
};
