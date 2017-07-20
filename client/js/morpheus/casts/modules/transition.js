import {
  get,
  isUndefined,
  memoize,
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
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  defer,
} from 'utils/promise';

const selectTransitionCastDataFromSceneAndType = (scene, sceneType) => {
  if (sceneType === 3) {
    const rootCast = get(scene, 'casts', []).find(c => c.castId === scene.sceneId)
    if (rootCast && rootCast.nextSceneId) {
      return rootCast;
    }
  }
  return null;
};

export const selectors = memoize(function selectors(scene) {
  const selectTransitionCastData = createSelector(
    () => scene,
    () => get(scene, 'sceneType'),
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

  const selectTransition = createSelector(
    castSelectors.forScene(scene).cache,
    cache => get(cache, 'transition'),
  );

  const selectTransitionVideo = createSelector(
    selectTransition,
    transition => get(transition, 'video'),
  );

  return {
    transitionCastData: selectTransitionCastData,
    video: selectTransitionVideo,
    transitionCastData: selectTransitionCastData,
    angleAtEndRadians: selectAngleAtEndRadians,
    assetUrl: selectAssetUrl,
    nextSceneId: selectNextSceneId,
  };
});

export const delegate = memoize(function actions(scene) {
  const transitionSelectors = selectors(scene);
  function applies(state) {
    return transitionSelectors.transitionCastData(state);
  }

  function doEnter() {
    return (dispatch, getState) => {
      const transitionCast = transitionSelectors.transitionCastData(getState());
      const fileName = transitionSelectors.assetUrl(getState());
      return new Promise((resolve, reject) => {
        const video = createVideo(fileName, {
          fullscreen: true,
          volume: gameSelectors.volume(getState()),
          width: gameSelectors.width(getState()),
          height: gameSelectors.height(getState()),
          oncanplaythrough() {
            resolve(video);
          },
          onerror: reject,
        });
        video.addEventListener('ended', function onVideoEnded() {
          video.removeEventListener('ended', onVideoEnded);
          const nextSceneId = transitionSelectors.nextSceneId(getState());
          dispatch(sceneActions.goToScene(nextSceneId));
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
      const video = transitionSelectors.video(getState());
      video.play();
      return Promise.resolve();
    };
  }

  function doExit() {
    return (dispatch, getState) => {
      const angleAtEnd = transitionSelectors.angleAtEndRadians(getState());
      dispatch(sceneActions.setNextStartAngle(angleAtEnd));
      return Promise.resolve();
    };
  }

  return {
    applies,
    doEnter,
    onStage,
    doExit,
  };
});
