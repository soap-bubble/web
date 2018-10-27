import {
  get,
  isUndefined,
} from 'lodash';
import Promise from 'bluebird';
import memoize from 'utils/memoize';
import uasParser from 'ua-parser-js';
import {
  Tween,
} from 'tween';
import {
  createSelector,
} from 'reselect';
import loggerFactory from 'utils/logger';
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
  isActive,
} from 'morpheus/gamestate';
import {
  selectors as gameSelectors,
  actions as gameActions,
} from 'morpheus/game';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  actions as sceneActions,
} from 'morpheus/scene';
import {
  special as inputHandlerFactory,
  eventInterface,
} from 'morpheus/hotspot';
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
import linkPreload from 'utils/linkPreload';
import renderEvents from 'utils/render';
import {
  GESTURES,
} from 'morpheus/constants';
import {
  and,
  or,
  not,
} from 'utils/matchers';
import {
  forMorpheusType,
  isMovie,
  isAudio,
  isHotspot,
} from '../matchers';

const logger = loggerFactory('cast:special');
const selectSpecialCastDataFromSceneAndType = (scene, sceneType) => {
  if (sceneType === 3) {
    return get(scene, 'casts', []).find(c => c.__t === 'MovieSpecialCast');
  }
  return null;
};

const ORIGINAL_HEIGHT = 400;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;
const userAgentString = (global.navigator && global.navigator.userAgent) || '';
const uas = uasParser(userAgentString);
const movExt = uas.browser.name.indexOf('Safari') !== -1 ? 'mp4' : 'webm';

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
  const gs = gamestates.byId(gameStateId);
  const value = Math.round(gs.value, 0);
  const frames = get(controlledMovieCallbacks, '[0].frames', 1);
  const currentOffset = value * frames;

  const source = {
    x: value * width,
    y: 0,
    sizeX: width,
    sizeY: height,
  };

  return (context) => {
    if (typeof controlledMovieCallbacks[0].currentValue === 'undefined' || frames <= 1) {
      controlledMovieCallbacks[0].currentValue = currentOffset;
    } else if (controlledMovieCallbacks[0].currentValue < currentOffset) {
      controlledMovieCallbacks[0].ticks = controlledMovieCallbacks[0].ticks || 0;
      if (controlledMovieCallbacks[0].ticks < 4) {
        controlledMovieCallbacks[0].ticks++;
      } else {
        controlledMovieCallbacks[0].ticks = 0;
        controlledMovieCallbacks[0].currentValue += 1;
      }
    } else if (controlledMovieCallbacks[0].currentValue > currentOffset) {
      if (controlledMovieCallbacks[0].ticks < 4) {
        controlledMovieCallbacks[0].ticks++;
      } else {
        controlledMovieCallbacks[0].ticks = 0;
        controlledMovieCallbacks[0].currentValue -= 1;
      }
    }
    context.drawImage(
      img,
      Math.floor(controlledMovieCallbacks[0].currentValue) * width,
      source.y,
      source.sizeX,
      source.sizeY,
      rect.x,
      rect.y,
      rect.sizeX,
      rect.sizeY,
    );
  };
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

async function generateSpecialImages({ images, controlledFrames, canvas }) {
  if (canvas) {
    let allDone;
    const notDone = () => { allDone = false; };
    do {
      allDone = true;
      const ctx = canvas.getContext('2d');
      images.forEach(op => ctx.drawImage(...op));
      controlledFrames.map(cf => cf(ctx, notDone));
      if (!allDone) {
        await Promise.delay(60);
      }
    } while (!allDone);
  }
}

function createCanvas({ width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function startRenderLoop({ update }) {
  renderEvents.onRender(update);
}

const selectors = memoize((scene) => {
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
    selectControlledCastsData,
    (extraCasts, controlledCasts) => controlledCasts.concat(extraCasts).filter(c => c.audioOnly),
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
    special => get(special, 'videos', []),
  );
  const selectSounds = createSelector(
    selectSpecial,
    special => get(special, 'sounds', []),
  );
  const selectImages = createSelector(
    selectSpecial,
    special => get(special, 'images', []),
  );
  const selectControlledCasts = createSelector(
    selectSpecial,
    special => get(special, 'controlledCasts', []),
  );
  const selectIsLoaded = createSelector(
    selectSpecial,
    special => get(special, 'isLoaded', false),
  );
  const selectIsLoading = createSelector(
    selectSpecial,
    special => get(special, 'isLoading', false),
  );
  const selectInputHandler = createSelector(
    selectSpecial,
    special => get(special, 'specialHandler'),
  );
  const selectVideoPreloads = createSelector(
    selectSpecial,
    special => get(special, 'videoPreloads'),
  );

  return {
    data: selectSpecialCastData,
    cache: selectSpecial,
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
    isLoaded: selectIsLoaded,
    isLoading: selectIsLoading,
    inputHandler: selectInputHandler,
    videoPreloads: selectVideoPreloads,
  };
});

export const delegate = memoize((scene) => {
  function applies() {
    return selectSpecialCastDataFromSceneAndType(scene, get(scene, 'sceneType'));
  }

  function doLoad({
    setState,
    isLoaded,
    isLoading,
  }) {
    return (dispatch, getState) => {
      if (isLoaded) {
        return Promise.resolve({});
      }
      if (isLoading) {
        return isLoading;
      }
      const controlledCastsData = scene.casts.filter(and(
        forMorpheusType('ControlledMovieCast'),
        not(isAudio),
      ));
      const movieCasts = scene.casts.filter(isMovie);
      const imageCasts = scene.casts.filter(c => c.image);
      const soundCasts = scene.casts.filter(and(
        or(
          forMorpheusType('MovieSpecialCast'),
          forMorpheusType('ControlledMovieCast'),
        ),
        isAudio,
      ));
      const gamestates = gamestateSelectors.forState(getState());

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

      const loadSounds = Promise.all(soundCasts
        .filter(soundCast => isActive({ cast: soundCast, gamestates }))
        .map((soundCast) => {
          const {
            fileName,
            nextSceneId,
            angleAtEnd,
            dissolveToNextScene,
          } = soundCast;
          const sound = createSound(getAssetUrl(fileName));
          function onSoundEnded() {
            let startAngle;
            sound.removeEventListener('ended', onSoundEnded);
            if (nextSceneId && nextSceneId !== 0x3FFFFFFF && !onSoundEnded.__aborted) {
              if (!isUndefined(angleAtEnd) && angleAtEnd !== -1) {
                startAngle = (angleAtEnd * Math.PI) / 1800;
                startAngle -= Math.PI - (Math.PI / 6);
              }
              dispatch(sceneActions.goToScene(nextSceneId, dissolveToNextScene));
              dispatch(sceneActions.setNextStartAngle(startAngle));
            }
          }
          sound.addEventListener('ended', onSoundEnded);
          return {
            el: sound,
            listeners: {
              ended: onSoundEnded,
            },
            data: soundCast,
          };
        }));

      const loadMovies = Promise.all(movieCasts
        .map(movieCast => linkPreload(getAssetUrl(movieCast.fileName, movExt))));

      const loadControlledMovies = Promise.all(controlledCastsData
        .filter(cast => !cast.audioOnly)
        .map(cast => loadAsImage(getAssetUrl(cast.fileName, 'png'))
          .then(img => ({
            el: img,
            data: cast,
          })),
      ));

      const promise = Promise.all([
        loadImages,
        loadSounds,
        loadMovies,
        loadControlledMovies,
      ]).then(([images, sounds, videoPreloads, controlledCasts]) => ({
        images,
        sounds,
        videoPreloads,
        controlledCasts,
        isLoaded: true,
      }));
      setState({
        isLoading: promise,
      });
      return promise;
    };
  }

  function doEnter({
    setState,
    images,
    controlledCasts,
  }) {
    return (dispatch, getState) => {
      const state = getState();
      const dimensions = gameSelectors.dimensions(state);
      const movieCasts = scene.casts.filter(isMovie);
      const canvas = createCanvas(dimensions);
      dispatch(gameActions.setCursor(null));

      const assets = [];

      function existsInAssets(cast) {
        return assets.find(a => a.data === cast);
      }

      function updateAssets() {
        return Promise.all(movieCasts
          .filter(cast => !existsInAssets(cast) && isActive({
            cast,
            gamestates: gamestateSelectors.forState(getState()),
          }))
          .map(movieCast => new Promise((resolve, reject) => {
            const video = createVideo(getAssetUrl(movieCast.fileName), {
              loop: movieCast.looping,
              autoplay: 'true',
              onerror: reject,
            });
            video.classList.add('MovieSpecialCast');
            function onSoundEnded() {
              let startAngle;
              const {
                nextSceneId,
                angleAtEnd,
                dissolveToNextScene,
              } = movieCast;
              video.removeEventListener('ended', onSoundEnded);
              if (nextSceneId && nextSceneId !== 0x3FFFFFFF) {
                if (!isUndefined(angleAtEnd) && angleAtEnd !== -1 && !onSoundEnded.__aboted) {
                  startAngle = (angleAtEnd * Math.PI) / 1800;
                  startAngle -= Math.PI - (Math.PI / 6);
                }
                dispatch(sceneActions.goToScene(nextSceneId, dissolveToNextScene))
                  .catch(() => console.error('Failed to load scene', nextSceneId));
                dispatch(sceneActions.setNextStartAngle(startAngle));
              }
            }
            function onCanPlayThrough() {
              video.removeEventListener('canplaythrough', onCanPlayThrough);
              resolve({
                el: video,
                listeners: {
                  ended: onSoundEnded,
                  canplaythrough: onCanPlayThrough,
                },
              });
            }
            video.addEventListener('ended', onSoundEnded);
            video.addEventListener('canplaythrough', onCanPlayThrough);
          })
            .then(({ el, listeners }) => ({
              el,
              data: movieCast,
              listeners,
            }))))
        .then((videos) => {
          videos.forEach(({ el: video, data }) => {
            applyTransformToVideo({
              transform: generateMovieTransform({
                dimensions,
                cast: data,
              }),
              video,
            });
            assets.push({
              el: video,
              data,
            });
            setState({
              videos,
            });
          });
        });
      }

      return updateAssets().then(() => generateSpecialImages({
        images: generateImages({
          gamestates: gamestateSelectors.forState(getState()),
          images,
          dimensions: gameSelectors.dimensions(getState()),
        }),
        controlledFrames: generateControlledFrames({
          gamestates: gamestateSelectors.forState(getState()),
          controlledCasts,
          dimensions: gameSelectors.dimensions(getState()),
        }),
        canvas,
      }).then(() => {
        const specialHandler = eventInterface.touchDisablesMouse(inputHandlerFactory({
          dispatch,
          scene,
        }));

        startRenderLoop({
          update() {
              // Need updated versions of these vars
              // eslint-disable-next-line no-shadow
            const dimensions = gameSelectors.dimensions(getState());
              // eslint-disable-next-line no-shadow
            const gamestates = gamestateSelectors.forState(getState());
            updateAssets().then(() => assets.forEach(({ el: video, data }) => {
              applyTransformToVideo({
                transform: generateMovieTransform({
                  dimensions,
                  cast: data,
                }),
                video,
              });
            }));

            dispatch(gameActions.drawCursor());

            return generateSpecialImages({
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
          },
        });
        return {
          canvas,
          specialHandler,
        };
      }));
    };
  }

  function onStage({
    sounds,
    images,
  }) {
    return (dispatch, getState) => {
      const hotspotData = scene.casts.filter(isHotspot);
      const gamestates = gamestateSelectors.forState(getState());
      hotspotData
        .filter(cast => isActive({ cast, gamestates }))
        .forEach((hotspot) => {
          const { gesture } = hotspot;
          if (
            GESTURES[gesture] === 'Always'
            || GESTURES[gesture] === 'SceneEnter'
          ) {
            dispatch(gamestateActions.handleHotspot({ hotspot }));
          }
        });
      sounds.forEach(({ el: sound }) => sound.play());
      images.some(({ data: cast }) => {
        if (cast.actionAtEnd) {
          // FIXME this is a disconnected promise chain because trying to sychronize
          // on the new action while within the scene pipeline did not work
          Promise
            .delay(1000)
            .then(() => dispatch(
              sceneActions.goToScene(cast.actionAtEnd, cast.dissolveToNextScene)),
            );
        }
        return null;
      });
      return Promise.resolve();
    };
  }

  function doExit({
    controlledCasts,
    sounds,
  }) {
    return (dispatch, getState) => {
      // FIXME: Clean this up!!
      // const videos = specialSelectors.videos(getState());

      const everything = sounds;
      const v = {
        volume: 1,
      };
      const tween = new Tween(v)
        .to({
          volume: 0,
        }, 1000);
      tween.onUpdate(() => {
        everything.forEach(({ el, listeners }) => {
          if (!listeners.ended) {
            // Only fade out sounds that do not need to finish
            el.volume = v.volume;
          }
        });
      });
      tween.start();

      everything.forEach(({ el, listeners }) => {
        Object.keys(listeners).forEach((eventName) => {
          const handler = listeners[eventName];
          if (eventName !== 'ended') {
            // Ended events will clean themselves up
            el.removeEventListener(eventName, handler);
          } else {
            // Used to keep handler from doing things it shouldn't
            handler.__aborted = true;
          }
        });
      });
      // Reset animated controlledMovieCallbacks
      controlledCasts
        .map(ref => ref.data)
        .filter(cast => cast.controlledMovieCallbacks && cast.controlledMovieCallbacks.length)
        .forEach(({ controlledMovieCallbacks }) => controlledMovieCallbacks.forEach(
          (controlledMovieCallback) => {
            delete controlledMovieCallback.currentValue;
            delete controlledMovieCallback.tick;
          },
        ));

      return Promise.resolve();
    };
  }

  function doUnload({
    videos = [],
    sounds,
    videoPreloads,
  }) {
    return () => {
      Object.keys([...videos, ...sounds]).forEach(({ el, listeners }) => {
        if (listeners && listeners.ended) {
          el.removeEventListener('ended', listeners.ended);
        }
        if (listeners && listeners.canplaythrough) {
          el.removeEventListener('canplaythrough', listeners.canplaythrough);
        }
      });

      videoPreloads.forEach(el => el.parentNode.removeChild(el));

      return Promise.resolve({
        videos: [],
        sounds: [],
        images: [],
        videoPreloads: [],
        canvas: null,
        isLoaded: false,
      });
    };
  }

  return {
    applies,
    doLoad,
    doPreload: doLoad,
    doEnter,
    onStage,
    doExit,
    doUnload,
    doPreunload: doUnload,
  };
});
