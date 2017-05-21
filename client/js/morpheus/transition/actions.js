import {
  actions as gameActions,
} from 'morpheus/game';
import {
  action as videoActions,
} from 'morpheus/video';
import {
  actions as sceneActions,
} from 'morpheus/scene';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  TRANSITION_START,
  TRANSITION_END,
} from './actionTypes';

export function display(sceneData) {
  return (dispatch) => {
    const { casts } = sceneData;
    const transitionCast = casts.find(c => c.castId === sceneData.sceneId);
    const { nextSceneId }= transitionCast;
    const fileName = getAssetUrl(`${transitionCast.fileName}`);
    dispatch(gameActions.resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    dispatch({
      type: TRANSITION_START,
      payload: transitionCast,
    });
    dispatch(videoActions.videoLoad(fileName, transitionCast, true));
  };
}

export function ended() {
  return (dispatch, getState) => {
    const { transition } = getState();
    const { data } = transition;
    const { nextSceneId } = data;
    dispatch({
      type: TRANSITION_END,
      payload: data,
    });
    dispatch(sceneActions.goToScene(nextSceneId));
  };
}
