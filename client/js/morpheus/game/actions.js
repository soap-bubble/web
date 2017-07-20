import {
  getSceneType,
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  DIMENSIONS_RESIZE,
  GAME_SCENE_LOADING,
  GAME_SET_VOLUME,
  GAME_SET_CURSOR,
} from './actionTypes';

const MORPHEUS_TO_HTML_CURSOR = {
  [10001]: 'alias',
  [10002]: 'pointer',
  [10005]: 'alias',
  [10008]: '-webkit-grab',
  [10009]: '-webkit-grabbing'
};

export function setPointerCursor() {
  return {
    type: GAME_SET_CURSOR,
    payload: 10002,
  };
}

export function setOpenHandCursor() {
  return {
    type: GAME_SET_CURSOR,
    payload: 10008,
  };
}

export function setCloseHandCursor() {
  return (dispatch) => {
    setTimeout(() => {
      dispatch({
        type: GAME_SET_CURSOR,
        payload: 10009,
      });
    })
  }
}

export function setVolume(volume) {
  return {
    type: GAME_SET_VOLUME,
    payload: volume,
  };
}

export function setCursor(cursor) {
  return (dispatch, getState) => {
    const currentCursor = gameSelectors.morpheusCursor(getState());
    if (currentCursor !== cursor) {
      dispatch({
        type: GAME_SET_CURSOR,
        payload: cursor,
      });
    }
  };
}

export function resize({ width, height }) {
  function setSize({ camera, renderer }) {
    if (camera && renderer) {
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
  return (dispatch, getState) => {
    dispatch({
      type: DIMENSIONS_RESIZE,
      payload: {
        width,
        height,
      },
    });
    const scene = sceneSelectors.currentSceneData(getState());
    if (scene) {
      setSize(castSelectors.forScene(scene).pano.renderElements(getState()));
      setSize(castSelectors.forScene(scene).hotspot.renderElements(getState()));
    }
  };
}

export function display() {
  return (dispatch, getState) => {
    const { scene } = getState();
    const { currentScene: sceneData } = scene;
    const sceneActionMap = {
      panorama: panoActions.load,
      special: specialActions.load,
      transition: transitionActions.display,
    };
    const sceneType = getSceneType(sceneData);
    const sceneActionFunction = sceneActionMap[sceneType];
    if (sceneActionFunction) {
      dispatch({
        type: GAME_SCENE_LOADING,
        payload: sceneData,
      });
      dispatch(sceneActionFunction(sceneData))
        .then(() => dispatch(sceneActions.doEnter()));
    }
  };
}

// export function nextScene(id) {
//   return dispatch => {
//     dispatch(sceneActions.fetch(id))
//       .then(sceneData => {
//         return sceneActions.doEntering(id)
//           .doEnter(id)
//
//
//       })
//   };
// }
