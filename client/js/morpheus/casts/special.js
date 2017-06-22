import {
  get,
} from 'lodash';
import {
  createSelector,
} from 'reselect';
import {
  getSceneType,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as gameStateSelectors,
} from 'momrpheus/gamestate';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  loadAsImage,
} from 'service/image';

const selectSpecialCastDataFromSceneAndType = (scene, sceneType) => {
  if (sceneType === 3) {
    const rootCast = get(scene, 'casts', []).find(c => c.castId === scene.sceneId)
    if (rootCast && !rootCast.nextSceneId) {
      return rootCast;
    }
  }
  return null;
};

const selectSpecialCastData = createSelector(
  sceneSelectors.currentSceneData,
  sceneSelectors.currentSceneType,
  selectSpecialCastDataFromSceneAndType,
);

const selectExtraCasts = createSelector(
  sceneSelectors.currentSceneData,
  scene => get(scene, 'casts', [])
    .filter(c => c.castId && c.castId !== scene.sceneId),
);

const selectControlledCasts = createSelector(
  selectExtraCasts,
  extraCasts => const controlledCasts = extrasCasts.filter(c => c.__t === 'ControlledMovieCast'),
);

const selectControlledCastImgUrl = createSelector(
  selectSpecialCastData,
  cast => getAssetUrl(get(cast, 'fileName'), 'png'),
);

const selectHotspotsData = createSelector(
  sceneSelectors.currentSceneData,
  scene => get(scene, 'casts', []).filter(c => c.castId === 0),
);

function generateControlledFrames({
  gameStates,
  controlledCasts,
  dimensions,
}) {
  const { width, height } = dimensions;
  return controlledCasts.reduce((memo, cast) => {
    const { castId, location: controlledLocation } = cast;
    const rect = clipRect({
      left: controlledLocation.x,
      top: controlledLocation.y,
      right: controlledLocation.x + cast.width,
      bottom: controlledLocation.y + cast.height,
      width,
      height,
    });
    memo[castId] = calculateControlledFrameLocation({
      cast,
      gameStates,
      rect,
    });
    return memo;
  }, {});
}

function generateSpecialImages({ specialCasts, canvas }) {
  const ctx = canvas.getContext('2d');

  const canvasDrawOps = map(controlledFrames,
    (op, castId) => [images[castId], ...op],
  );
  for (let i = 0; i < canvasDrawOps.length; i += 1) {
    const op = canvasDrawOps[i];
    ctx.drawImage(...op);
  }
}

function createCanvas({ width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function doEnter() {
  return (dispatch, getState) => {
    const leadCast = selectSpecialCastData(getState());
    const controlledCastsData = selectControlledCasts(getState());
    return Promise.all(
      [
        loadAsImage(selectControlledCastImgUrl(getState()))
          .then(img => ({
            img,
            castId: leadCast.castId,
          })),
      ].concat(controlledCastsData
        .map(cast => loadAsImage(cast.fileName)
          .then(img => ({
            img,
            castId: cast.castId,
          }))
        ),
    )
      .then((controlledCasts) => {
        const root = controlledCasts.shift();
        return {
          root,
          extras: controlledCasts,
        };
      })
      .then((specialCasts) => {
        const controlledFrames = generateControlledFrames({
          gameStates,
          specialCasts,
          dimensions,
        });
      });
  };
}

function onStage() {
  return (dispatch, getState) => {
    const hotspotData = selectHotspotsData(getState());
    const gameStates = gameStateSelectors.gamestates(getState());
    const controlledCasts = selectControlledCasts(getState());
    const dimensions = gameSelectors.dimensions(getState());

    const canvas = createCanvas(dimensions);
  };
}
