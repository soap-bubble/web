import {
  get,
} from 'lodash';
import {
  createSelector,
} from 'reselect';
import {
  createVideo,
} from 'utils/video';
import {
  getSceneType,
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  actions as videoActions,
} from 'morpheus/video';
import {
  defer,
} from 'utils/promise';

const selectTransitionCastData = createSelector(
  sceneSelectors.currentSceneData,
  sceneSelectors.currentSceneType,
  (scene, sceneType) => {
    if (sceneType === 3) {
      return get(scene, 'casts', []).find(c => c.castId === scene.sceneId)
    }
    return null;
  },
);

const selectNextSceneId = createSelector(
  selectTransitionCastData,
  transitionCast => get(transitionCast, 'nextSceneId'),
);

const selectTransitionFileName = createSelector(
  selectTransitionCastData,
  transitionCast => get(transitionCast, 'fileName'),
);

const selectAssetUrl = createSelector(
  selectTransitionFileName,
  getAssetUrl,
);

const selectTransition = state => get(state, 'casts.transition');
const selectTransitionVideo = createSelector(
  selectTransition,
  transition => get(transition, 'video'),
);

function applies(state) {
  return selectTransitionCastData(state);
}

function doEnter() {
  return (dispatch, getState) => {
    const transitionCast = selectTransitionCastData(getState());
    const fileName = selectAssetUrl(getState());
    let video;
    return new Promise((resolve, reject) => {
      video = createVideo(fileName, {
        fullscreen: true,
        volume: gameSelectors.volume(getState()),
        width: gameSelectors.width(getState()),
        height: gameSelectors.height(getState()),
        oncanplaythrough() {
          resolve(video);
        },
        onerror: reject,
        onended() {
          const nextSceneId = selectNextSceneId(getState());
          dispatch(sceneActions.goToScene(nextSceneId));
        }
      });
      video.style.objectFit = 'cover';
    })
      .then(video => ({
        video,
      }));
  };
}

function onStage() {
  return (dispatch, getState) => {
    const video = selectTransitionVideo(getState());
    video.play();
    return Promise.resolve();
  };
}

export const delegate = {
  applies,
  doEnter,
  onStage,
};

export const selectors = {
  video: selectTransitionVideo,
};

export const actions = {};
