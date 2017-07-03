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
} from 'morpheus/gamestate';
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
  extraCasts => extraCasts.filter(c => c.__t === 'ControlledMovieCast'),
);

const selectControlledCastImgUrl = createSelector(
  selectSpecialCastData,
  cast => getAssetUrl(get(cast, 'fileName'), 'png'),
);

const selectHotspotsData = createSelector(
  sceneSelectors.currentSceneData,
  scene => get(scene, 'casts', []).filter(c => c.castId === 0),
);

const selectCanvas = state => get(state, 'casts.special.canvas');

const ORIGINAL_HEIGHT = 400;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

function clipRect({ width, height, top, left, right, bottom, clip = false }) {
  if (width / height > ORIGINAL_ASPECT_RATIO) {
    const adjustedHeight = width / ORIGINAL_ASPECT_RATIO;
    const clipHeight = adjustedHeight - height;
    const widthScaler = width / ORIGINAL_WIDTH;
    const heightScaler = adjustedHeight / ORIGINAL_HEIGHT;
    const x = left * widthScaler;
    const sizeX = (right * widthScaler) - x;

    let y = (top * heightScaler) - (clipHeight / 2);
    let sizeY = (bottom - top) * heightScaler;

    if (clip) {
      if (y < 0) {
        sizeY += y;
        y = 0;
      } else if (y > height) {
        sizeY -= (y - height);
        y = height;
      }
      if (y + sizeY > height) {
        sizeY = height - y;
      }
    }


    return {
      x,
      y,
      sizeX,
      sizeY,
    };
  }
  const adjustedWidth = height * ORIGINAL_ASPECT_RATIO;
  const clipWidth = adjustedWidth - width;
  const widthScaler = adjustedWidth / ORIGINAL_WIDTH;
  const heightScaler = height / ORIGINAL_HEIGHT;
  const y = top * heightScaler;
  const sizeY = (bottom * heightScaler) - y;

  let x = (left * widthScaler) - (clipWidth / 2);
  let sizeX = (right - left) * widthScaler;

  if (clip) {
    if (x < 0) {
      sizeX += x;
      x = 0;
    } else if (x > width) {
      sizeX -= (y - width);
      x = width;
    }
    if (x + sizeX > width) {
      sizeX = width - x;
    }
  }

  return {
    x,
    y,
    sizeX,
    sizeY,
  };
}

function calculateControlledFrameLocation({ cast, img, gameStates, rect }) {
  const { controlledMovieCallbacks, width, height } = cast;
  const gameStateId = get(controlledMovieCallbacks, '[0].gameStateId', null);
  const value = get(gameStates, `[${gameStateId}].value`, 0);

  const source = {
    x: value * width,
    y: 0,
    sizeX: width,
    sizeY: height,
  };

  return [
    img,
    source.x,
    source.y,
    source.sizeX,
    source.sizeY,
    rect.x,
    rect.y,
    rect.sizeX,
    rect.sizeY,
  ];
}

function generateControlledFrames({
  controlledCasts,
  dimensions,
  gameStates,
}) {
  const { width, height } = dimensions;
  return controlledCasts.map(({ data: cast, img }) => {
    const { location } = cast;
    return calculateControlledFrameLocation({
      cast,
      img,
      gameStates,
      rect: clipRect({
        left: location.x,
        top: location.y,
        right: location.x + cast.width,
        bottom: location.y + cast.height,
        width,
        height,
      }),
    });
  }, {});
}

function generateSpecialImages({ specials, canvas }) {
  const ctx = canvas.getContext('2d');
  specials.forEach(op => ctx.drawImage(...op));
}

function createCanvas({ width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function applies(state) {
  return selectSpecialCastData(state)
}

function doEnter() {
  return (dispatch, getState) => {
    const leadCast = selectSpecialCastData(getState());
    const controlledCastsData = selectControlledCasts(getState());
    const gameStates = gameStateSelectors.gamestates(getState());
    const dimensions = gameSelectors.dimensions(getState());

    return Promise.all(
      [
        loadAsImage(selectControlledCastImgUrl(getState()))
          .then(img => ({
            img,
            data: leadCast,
          })),
      ].concat(controlledCastsData
        .map(cast => loadAsImage(cast.fileName)
          .then(img => ({
            img,
            data: cast,
          }))
        ),
    ))
      .then(controlledCasts => generateControlledFrames({
        gameStates,
        controlledCasts,
        dimensions,
      }))
      .then((specials) => {
        const canvas = createCanvas(dimensions);
        generateSpecialImages({ specials, canvas });
        return {
          canvas,
        };
      });
  };
}

export const delegate = {
  applies,
  doEnter,
}

export const selectors = {
  canvas: selectCanvas,
};

export const actions = {};
