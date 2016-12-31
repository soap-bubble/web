import {
  resize,
} from './dimensions';
import {
  playFullscreenVideo,
} from './video';
import {
  goToScene,
} from './scene';
import {
  TRANSITION_START,
  TRANSITION_END,
} from './types';

export function display(sceneData) {
  return (dispatch) => {
    const { casts } = sceneData;
    const transitionCast = casts.find(c => c.castId === sceneData.sceneId);
    const { nextSceneId }= transitionCast;
    const fileName = `/${transitionCast.fileName}.webm`;
    dispatch(resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    dispatch(playFullscreenVideo(fileName));
    dispatch({
      type: TRANSITION_START,
      payload: nextSceneId,
    });
  };
}

export function ended() {
  return (dispatch, getState) => {
    const { transition } = getState();
    const { nextSceneId } = transition;
    dispatch({
      type: TRANSITION_END,
      payload: nextSceneId,
    });
    dispatch(goToScene(nextSceneId));
  };
}
