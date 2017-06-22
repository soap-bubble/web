import {
  get,
  isUndefined,
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
  defer,
} from 'utils/promise';

const selectTransitionCastDataFromSceneAndType = (scene, sceneType) => {
  if (sceneType === 3) {
    const rootCast get(scene, 'casts', []).find(c => c.castId === scene.sceneId)
    if (rootCast && rootCast.nextSceneId) {
      return rootCast;
    }
  }
  return null;
};

const selectTransitionCastData = createSelector(
  sceneSelectors.currentSceneData,
  sceneSelectors.currentSceneType,
  selectTransitionCastDataFromSceneAndType,
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

const selecAngleAtEnd = createSelector(
  selectTransitionCastData,
  transitionCast => get(transitionCast, 'angleAtEnd'),
);

const selectAngleAtEndRadians = createSelector(
  selecAngleAtEnd,
  (angleAtEnd) => {
    let startAngle = 0;
    if (!isUndefined(angleAtEnd) && angleAtEnd !== -1) {
      startAngle = (angleAtEnd * Math.PI) / 1800;
      startAngle -= Math.PI - (Math.PI / 6);
    }
    return startAngle;
  },
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

function doExit() {
  return (dispatch, getState) => {
    const angleAtEnd = selectAngleAtEndRadians(getState());
    dispatch(sceneActions.setNextStartAngle(angleAtEnd));
    return Promise.resolve();
  };
}

export const delegate = {
  applies,
  doEnter,
  onStage,
  doExit,
};

export const selectors = {
  video: selectTransitionVideo,
};

export const actions = {};
