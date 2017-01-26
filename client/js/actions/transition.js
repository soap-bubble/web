import {
  resize,
} from './dimensions';
import {
  videoLoad,
} from './video';
import {
  fetchScene,
  goToScene,
} from './scene';
import {
  load as loadPano,
} from './pano';
import {
  getAssetUrl,
} from '../service/gamedb';
import {
  TRANSITION_START,
  TRANSITION_END,
} from './types';

export function display(sceneData) {
  return (dispatch) => {
    const { casts } = sceneData;
    const transitionCast = casts.find(c => c.castId === sceneData.sceneId);
    const { nextSceneId }= transitionCast;
    const fileName = getAssetUrl(`${transitionCast.fileName}`);
    dispatch(resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    dispatch({
      type: TRANSITION_START,
      payload: transitionCast,
    });
    dispatch(videoLoad(fileName, 'MovieSpecialCast', true));
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
    dispatch(goToScene(nextSceneId));
  };
}
