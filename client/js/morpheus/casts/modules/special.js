import {
  get,
  memoize,
  isUndefined,
} from 'lodash';
import {
  createSelector,
} from 'reselect';
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
  isActive,
} from 'morpheus/gamestate';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  actions as sceneActions,
} from 'morpheus/scene';
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
  createSound,
} from 'utils/sound';
import {
  GESTURES,
} from 'morpheus/constants';

const selectSpecialCastDataFromSceneAndType = (scene, sceneType) => {
  if (sceneType === 3) {
    return get(scene, 'casts', []).find(c => c.__t === 'MovieSpecialCast');
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

function generateMovieTransform({ cast, dimensions }) {
  const { width, height } = dimensions;
  const { scale, location: { y: top, x: left } } = cast;
  const bottom = top + cast.height;
  const right = left + cast.width;
  const { x, y, sizeX, sizeY } = resizeToScreen({ top, left, bottom, right, width, height });
  return {
    left: x * scale,
    top: y * scale,
    width: sizeX * scale,
    height: sizeY * scale,
  };
}

function applyTransformToVideo({ transform, video }) {
  video.width = transform.width;
  video.height = transform.height;
  video.style.left = `${transform.left}px`;
  video.style.top = `${transform.top}px`;
}

function calculateImageOperation({ cast, img, rect }) {
  const { scale, width, height } = cast;

  const source = {
    x: 0,
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
    rect.x * scale,
    rect.y * scale,
    rect.sizeX * scale,
    rect.sizeY * scale,
  ];
}

function calculateControlledFrameOperation({ cast, img, gamestates, rect }) {
  const { controlledMovieCallbacks, width, height } = cast;
  const gameStateId = get(controlledMovieCallbacks, '[0].gameState', null);
  const value = Math.round(get(gamestates, `[${gameStateId}].value`, 0));

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

function generateImages({
  images,
  dimensions,
  gamestates,
}) {
  const { width, height } = dimensions;
  const generatedImages = [];
  images.forEach(({ data: cast, el: img }) => {
    if (isActive({ cast, gamestates })) {
      const location = cast.location;
      generatedImages.push(calculateImageOperation({
        cast,
        img,
        rect: resizeToScreen({
          left: location.x,
          top: location.y,
          right: location.x + cast.width,
          bottom: location.y + cast.height,
          width,
          height,
        }),
      }));
    }
  });
  return generatedImages;
}

function generateControlledFrames({
  controlledCasts,
  dimensions,
  gamestates,
}) {
  const { width, height } = dimensions;
  return controlledCasts.map(({ data: cast, el: img }) => {
    const location = cast.location || cast.controlledLocation;
    return calculateControlledFrameOperation({
      cast,
      img,
      gamestates,
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

function generateSpecialImages({ images, controlledFrames, canvas }) {
  if (canvas) {
    const ctx = canvas.getContext('2d');
    images.forEach(op => ctx.drawImage(...op));
    controlledFrames.forEach(op => ctx.drawImage(...op));
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
    s => get(s, 'casts', []),
  );

  const selectControlledCastsData = createSelector(
    selectExtraCasts,
    extraCasts => extraCasts.filter(c => c.__t === 'ControlledMovieCast', []),
  );

  const selectAllMovieCasts = createSelector(
    selectExtraCasts,
    extraCasts => extraCasts.filter(c =>
      c.__t === 'MovieSpecialCast',
    ),
  );

  const selectMovieCasts = createSelector(
    selectAllMovieCasts,
    extraCasts => extraCasts.filter(c =>
      !c.audioOnly
      && !c.image,
    ),
  );

  const selectImageCasts = createSelector(
    selectAllMovieCasts,
    extraCasts => extraCasts.filter(c => c.image),
  );

  const selectSoundCasts = createSelector(
    selectAllMovieCasts,
    extraCasts => extraCasts.filter(c => c.audioOnly),
  );

  const selectHotspotsData = createSelector(
    () => scene,
    s => get(s, 'casts', [])
      .filter(c => c.castId === 0),
  );

  const selectNextSceneId = createSelector(
    selectAllMovieCasts,
    (casts) => {
      const cast = casts.find(c => c.nextSceneId);
      return cast && cast.nextSceneId;
    },
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
  const selectSounds = createSelector(
    selectSpecial,
    special => get(special, 'sounds'),
  );
  const selectImages = createSelector(
    selectSpecial,
    special => get(special, 'images'),
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
    imageCasts: selectImageCasts,
    soundCasts: selectSoundCasts,
    hotspotData: selectHotspotsData,
    nextSceneId: selectNextSceneId,
    canvas: selectCanvas,
    videos: selectVideos,
    sounds: selectSounds,
    images: selectImages,
  };
}

export const delegate = memoize((scene) => {
  const specialSelectors = selectors(scene);

  function applies(state) {
    return specialSelectors.data(state);
  }

  function doEnter() {
    return (dispatch, getState) => {
      const state = getState();
      const controlledCastsData = specialSelectors.controlledCastsData(state);
      const movieCasts = specialSelectors.movieCasts(state);
      const imageCasts = specialSelectors.imageCasts(state);
      const soundCasts = specialSelectors.soundCasts(state);
      const gamestates = gamestateSelectors.gamestates(state);
      const dimensions = gameSelectors.dimensions(state);

      const loadImages = Promise.all(imageCasts.map((imageCast) => {
        const {
          fileName,
          startFrame,
        } = imageCast;
        return loadAsImage(getAssetUrl(fileName, `${startFrame}.png`))
          .then(img => ({
            el: img,
            data: imageCast,
          }));
      }));

      const loadSounds = Promise.all(soundCasts.map((soundCast) => {
        const {
          fileName,
          nextSceneId,
          angleAtEnd,
        } = soundCast;
        const sound = createSound(getAssetUrl(fileName));
        if (nextSceneId && nextSceneId !== 0x3FFFFFFF) {
          sound.addEventListener('ended', function onSoundEnded() {
            let startAngle;
            if (!isUndefined(angleAtEnd) && angleAtEnd !== -1) {
              startAngle = (angleAtEnd * Math.PI) / 1800;
              startAngle -= Math.PI - (Math.PI / 6);
            }
            sound.removeEventListener('ended', onSoundEnded);
            dispatch(sceneActions.goToScene(nextSceneId));
            dispatch(sceneActions.setNextStartAngle(startAngle));
          });
        }
        return {
          el: sound,
          data: soundCast,
        };
      }));

      const loadMovies = Promise.all(movieCasts.map(movieCast => new Promise((resolve, reject) => {
        const video = createVideo(getAssetUrl(movieCast.fileName), {
          loop: movieCast.looping,
          autoplay: true,
          oncanplaythrough() {
            resolve(video);
          },
          onerror: reject,
        });
        const { nextSceneId, angleAtEnd } = movieCast;
        video.classList.add('MovieSpecialCast');
        if (nextSceneId && nextSceneId !== 0x3FFFFFFF) {
          video.addEventListener('ended', function onSoundEnded() {
            let startAngle;
            if (!isUndefined(angleAtEnd) && angleAtEnd !== -1) {
              startAngle = (angleAtEnd * Math.PI) / 1800;
              startAngle -= Math.PI - (Math.PI / 6);
            }
            video.removeEventListener('ended', onSoundEnded);
            dispatch(sceneActions.goToScene(nextSceneId));
            dispatch(sceneActions.setNextStartAngle(startAngle));
          });
        }
        return video;
      })
        .then(video => ({
          el: video,
          data: movieCast,
        }))));

      const loadControlledMovies = Promise.all(controlledCastsData
        .map(cast => loadAsImage(getAssetUrl(cast.fileName, 'png'))
          .then(img => ({
            el: img,
            data: cast,
          })),
      ));

      return Promise.all([
        loadImages,
        loadSounds,
        loadMovies,
        loadControlledMovies,
      ])
        .then(([images, sounds, videos, controlledCasts]) => {
          const canvas = createCanvas(dimensions);
          videos.forEach(({ el: video, data }) => {
            applyTransformToVideo({
              transform: generateMovieTransform({
                dimensions,
                cast: data,
              }),
              video,
            });
          });

          generateSpecialImages({
            images: generateImages({
              gamestates,
              images,
              dimensions,
            }),
            controlledFrames: generateControlledFrames({
              gamestates,
              controlledCasts,
              dimensions,
            }),
            canvas,
          });
          return {
            images,
            sounds,
            videos,
            canvas,
            controlledCasts,
          };
        });
    };
  }

  return {
    applies,
    doEnter,
  };
});

export const actions = memoize((scene) => {
  const specialSelectors = selectors(scene);
  function update() {
    return (dispatch, getState) => {
      const gamestates = gamestateSelectors.gamestates(getState());
      const dimensions = gameSelectors.dimensions(getState());
      const canvas = specialSelectors.canvas(getState());
      const controlledCasts = specialSelectors.controlledCasts(getState());
      const images = specialSelectors.images(getState());
      const videos = specialSelectors.videos(getState());

      videos.forEach(({ el: video, data }) => {
        applyTransformToVideo({
          transform: generateMovieTransform({
            dimensions,
            cast: data,
          }),
          video,
        });
      });

      generateSpecialImages({
        images: generateImages({
          gamestates,
          images,
          dimensions,
        }),
        controlledFrames: generateControlledFrames({
          gamestates,
          controlledCasts,
          dimensions,
        }),
        canvas,
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
