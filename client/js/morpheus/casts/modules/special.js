import {
  get,
  memoize,
} from 'lodash';
import {
  createSelector,
} from 'reselect';
import {
  getSceneType,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  actions as gamestateActions,
  selectors as gameStateSelectors,
} from 'morpheus/gamestate';
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
  loadAsImage,
} from 'service/image';
import {
  createVideo,
} from 'utils/video';
import {
  GESTURES,
} from 'morpheus/constants';

const selectSpecialCastDataFromSceneAndType = (scene, sceneType) => {
  if (sceneType === 3) {
    const rootCast = get(scene, 'casts', []).find(c => c.castId === scene.sceneId)
    if (rootCast && !rootCast.nextSceneId) {
      return rootCast;
    }
  }
  return null;
};

const ORIGINAL_HEIGHT = 400;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

function resizeToScreen({ width, height, top, left, right, bottom, clip = false }) {
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

function generateMovieTransform({ cast, video, dimensions }) {
  const { width, height } = dimensions;
  const { y: top, x: left } = cast.location;
  const bottom = top + cast.height;
  const right = left + cast.width;
  const { x, y, sizeX, sizeY } = resizeToScreen({ top, left, bottom, right, width, height });
  return {
    left: x,
    top: y,
    width: sizeX,
    height: sizeY,
  };
}

function applyTransformToVideo({ transform, video }) {
  video.width = transform.width;
  video.height = transform.height;
  video.style.left = `${transform.left}px`;
  video.style.top = `${transform.top}px`;
}

function calculateControlledFrameLocation({ cast, img, gameStates, rect }) {
  const { controlledMovieCallbacks, width, height } = cast;
  const gameStateId = get(controlledMovieCallbacks, '[0].gameState', null);
  const value = Math.round(get(gameStates, `[${gameStateId}].value`, 0));

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
    const location = cast.location || cast.controlledLocation;
    return calculateControlledFrameLocation({
      cast,
      img,
      gameStates,
      rect: resizeToScreen({
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
  if (canvas) {
    const ctx = canvas.getContext('2d');
    specials.forEach(op => ctx.drawImage(...op));  
  }
}

function createCanvas({ width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function selectors(scene) {
  const selectSpecialCastData = createSelector(
    () => scene,
    () => get(scene, 'sceneType'),
    selectSpecialCastDataFromSceneAndType,
  );

  const selectExtraCasts = createSelector(
    () => scene,
    scene => get(scene, 'casts', [])
      .filter(c => c.castId && c.castId !== scene.sceneId),
  );

  const selectControlledCastsData = createSelector(
    selectExtraCasts,
    extraCasts => extraCasts.filter(c => c.__t === 'ControlledMovieCast', []),
  );

  const selectMovieCasts = createSelector(
    selectExtraCasts,
    extraCasts => extraCasts.filter(c => c.__t === 'MovieSpecialCast'),
  );

  const selectControlledCastImgUrl = createSelector(
    selectSpecialCastData,
    cast => {
      const asset = get(cast, 'fileName');
      if (asset) {
        return getAssetUrl(asset, 'png');
      }
    },
  );

  const selectHotspotsData = createSelector(
    () => scene,
    scene => get(scene, 'casts', []).filter(c => c.castId === 0),
  );

  const selectSpecial = createSelector(
    castSelectors.forScene(scene).cache,
    castCache => get(castCache, 'special'),
  );
  const selectCanvas = createSelector(
    selectSpecial,
    special => get(special, 'canvas'),
  );
  const selectVideos = createSelector(
    selectSpecial,
    special => get(special, 'videos'),
  );
  const selectControlledCasts = createSelector(
    selectSpecial,
    special => get(special, 'controlledCasts', []),
  );

  return {
    data: selectSpecialCastData,
    controlledCastsData: selectControlledCastsData,
    extraCasts: selectExtraCasts,
    controlledCasts: selectControlledCasts,
    movieCasts: selectMovieCasts,
    controlledCastImgUrl: selectControlledCastImgUrl,
    hotspotData: selectHotspotsData,
    canvas: selectCanvas,
    videos: selectVideos,
    controlledCasts: selectControlledCasts,
  };
};

export const delegate = memoize(function delegate(scene) {
  const specialSelectors = selectors(scene);

  function applies(state) {
    return specialSelectors.data(state);
  }

  function doEnter() {
    return (dispatch, getState) => {
      const leadCast = specialSelectors.data(getState());
      const controlledCastsData = specialSelectors.controlledCastsData(getState());
      const movieCasts = specialSelectors.movieCasts(getState());
      const gameStates = gameStateSelectors.gamestates(getState());
      const dimensions = gameSelectors.dimensions(getState());

      return Promise.all([
        Promise.all(movieCasts
          .map(movieCast => new Promise((resolve, reject) => {
            const video = createVideo(getAssetUrl(movieCast.fileName), {
              loop: true,
              autoplay: true,
              oncanplaythrough() {
                resolve(video);
              },
              onerror: reject,
            });
          })
            .then(video => {
              video.classList.add('MovieSpecialCast');
              return video;
            })))
          .then(videos => {
            const transforms = videos.map((video, index) => generateMovieTransform({
              video,
              dimensions,
              cast: movieCasts[index],
            }));
            transforms.forEach((transform, index) => applyTransformToVideo({
              transform,
              video: videos[index],
            }));
            return videos;
          }),
        Promise.all(
          [
            loadAsImage(specialSelectors.controlledCastImgUrl(getState()))
              .then(img => ({
                img,
                data: leadCast,
              })),
          ].concat(controlledCastsData
            .map(cast => loadAsImage(getAssetUrl(cast.fileName, 'png'))
              .then(img => ({
                img,
                data: cast,
              }))
            ),
        ))
          .then((controlledCasts) => {
            const canvas = createCanvas(dimensions);
            generateSpecialImages({
              specials: generateControlledFrames({
                gameStates,
                controlledCasts,
                dimensions,
              }),
              canvas
            });
            return {
              canvas,
              controlledCasts,
            };
          })
      ])
        .then(([ videos, { canvas, controlledCasts } ]) => ({
          videos,
          canvas,
          controlledCasts,
        }));
    };
  }

  return {
    applies,
    doEnter,
  };
});

export const actions = memoize(function actions (scene) {
  const specialSelectors = selectors(scene);
  function update() {
    return (dispatch, getState) => {
      const gameStates = gameStateSelectors.gamestates(getState());
      const dimensions = gameSelectors.dimensions(getState());
      const canvas = specialSelectors.canvas(getState());
      const controlledCasts = specialSelectors.controlledCasts(getState());

      generateSpecialImages({
        specials: generateControlledFrames({
          gameStates,
          controlledCasts,
          dimensions,
        }),
        canvas
      });
    };
  }

  function handleMouseEvent({ type, hotspot, top, left }) {
    return (dispatch) => {
      const {
        gesture,
      } = hotspot;
      const gestureType = GESTURES[gesture];
      if (type === gestureType) {
        return dispatch(gamestateActions.handleHotspot({ hotspot, top, left }));
      } else if (type === 'MouseDown') {
        return dispatch(gamestateActions.handleMouseDown({ hotspot, top, left }));
      } else if (type === 'MouseStillDown') {
        return dispatch(gamestateActions.handleMouseStillDown({ hotspot, top, left }));
      } else if (type === 'MouseEnter') {
        return dispatch(gamestateActions.handleMouseOver({ hotspot, top, left }));
      }
      return true;
    };
  }

  return {
    update,
    handleMouseEvent,
  };
});
