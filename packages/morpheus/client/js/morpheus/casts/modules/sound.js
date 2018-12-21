import {
  get,
  once,
  differenceBy,
} from 'lodash';
import memoize from 'utils/memoize';
import {
  createSelector,
} from 'reselect';
import {
  Tween,
} from 'tween';
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
  isActive,
} from 'morpheus/gamestate';
import {
  handleEventFactory,
} from 'morpheus/input';
import Promise from 'bluebird';
import renderEvents from 'utils/render';
import {
  createSound,
} from 'utils/sound';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  forMorpheusType,
  isAudio,
} from '../matchers';
import {
  and,
  or,
  not,
} from 'utils/matchers';

function startRenderLoop({ update }) {
  renderEvents.onRender(update);
}

const selectors = memoize((scene) => {
  const selectCasts = createSelector(
    () => scene,
    s => get(s, 'casts', []),
  );

  const selectSoundCastsData = createSelector(
    selectCasts,
    gamestateSelectors.forState,
    (casts, gamestates) => casts.filter((cast) => {
      if (cast.__t === 'SoundCast') {
        if (cast.comparators.length) {
          return isActive({ cast, gamestates });
        }
        return true;
      }
      return false;
    }),
  );

  const selectIsEmptyScene = createSelector(
    selectCasts,
    selectSoundCastsData,
    (casts, soundCastData) => soundCastData.length && !casts.some(cast =>
      ['PanoCast', 'ControlledMovieCast', 'MovieSpecialCast'].indexOf(cast.__t) !== -1),
  );

  const selectHotspotsData = createSelector(
    () => scene,
    s => get(s, 'casts', [])
      .filter(c => c.castId === 0),
  );

  const selectAssetsUrl = createSelector(
    selectSoundCastsData,
    casts => casts.map(cast => get(cast, 'fileName')),
  );

  return {
    soundCastsData: selectSoundCastsData,
    assetsUrl: selectAssetsUrl,
    isEmpty: selectIsEmptyScene,
    hotspotData: selectHotspotsData,
  };
});

const isSoundCast = forMorpheusType('SoundCast');

function isActiveSound({
  casts,
  gamestates,
}) {
  return casts.filter((cast) => {
    if (isSoundCast(cast)) {
      if (cast.comparators.length) {
        return isActive({ cast, gamestates });
      }
      return true;
    }
    return false;
  });
}


function isEmptySoundCast({
  casts,
  gamestates,
}) {
  const soundCastData = isActiveSound({
    casts,
    gamestates,
  });
  return soundCastData.length && !casts.some(cast =>
    ['PanoCast', 'ControlledMovieCast', 'MovieSpecialCast'].indexOf(cast.__t) !== -1);
}

function noComparators(cast) {
  return !cast.comparators || cast.comparators.length === 0
}

export const delegate = memoize((scene) => {
  const soundSelectors = selectors(scene);
  const inputHandler = handleEventFactory();
  function applies(state) {
    return scene.casts.filter(isSoundCast).length > 0;
  }

  function updateAssets({
    getState,
    autoplay,
    assets,
    soundCasts,
    dispatch,
    sounds,
  }) {
    function existsInAssets(cast) {
      return assets.find(a => a.data === cast);
    }
    return Promise.all(soundCasts
      .filter(cast => !existsInAssets(cast) && isActive({
        cast,
        gamestates: gamestateSelectors.forState(getState()),
      }))
      .map(soundCast => new Promise((resolve, reject) => {
        const findParent = once(() => document.querySelector(`div#sounds${scene.sceneId}`));
        const {
          fileName,
          nextSceneId,
          dissolveToNextScene,
        } = soundCast;
        const sound = createSound(getAssetUrl(fileName), {
          autoplay,
        });
        function onSoundEnded() {
          let startAngle;
          if (nextSceneId && nextSceneId !== 0x3FFFFFFF && !onSoundEnded.__aborted) {
            dispatch(sceneActions.goToScene(nextSceneId, dissolveToNextScene));
          }
        }
        function onCanPlayThrough() {
          sound.removeEventListener('canplaythrough', onCanPlayThrough);
          const descriptor = {
            el: sound,
            listeners: {
              ended: onSoundEnded,
              canplaythrough: onCanPlayThrough,
            },
            data: soundCast,
          };
          assets.push(descriptor);
          const parent = findParent();
          if (parent) {
            parent.appendChild(sound);
          }
          resolve(descriptor);
        }
        sound.addEventListener('ended', onSoundEnded);
        sound.addEventListener('canplaythrough', onCanPlayThrough);
      })));
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
      const assets = [];
      const soundCasts = scene.casts.filter(or(
        and(
          or(
            forMorpheusType('MovieSpecialCast'),
            forMorpheusType('ControlledMovieCast'),
          ),
          isAudio,
        ),
        and(
          forMorpheusType('SoundCast'),
          not(noComparators),
        )
      ));

      const promise = updateAssets({
        dispatch,
        setState,
        getState,
        assets,
        autoplay: true,
        soundCasts,
      }).then(() => ({
        assets,
      }));
      setState({
        isLoading: promise,
      });
      return promise;
    };
  }

  function doEnter({
    setState,
    assets,
  }) {
    return (dispatch, getState) => {
      const soundCasts = scene.casts.filter(or(
        and(
          or(
            forMorpheusType('MovieSpecialCast'),
            forMorpheusType('ControlledMovieCast'),
          ),
          isAudio,
        ),
        and(
          forMorpheusType('SoundCast'),
          not(noComparators),
        )
      ));
      return updateAssets({
        dispatch,
        setState,
        getState,
        assets,
        autoplay: true,
        soundCasts,
      }).then(() => {
        let lastPlayed = assets.filter(({ data: cast }) => isActive({
          cast,
          gamestates: gamestateSelectors.forState(getState()),
        }));
        lastPlayed.forEach(({ el: sound }) => sound.play());
        startRenderLoop({
          update() {
            updateAssets({
              dispatch,
              setState,
              getState,
              assets,
              autoplay: true,
              soundCasts,
            });
            const nextPlay = assets.filter(({ data: cast }) => isActive({
              cast,
              gamestates: gamestateSelectors.forState(getState()),
            }));
            differenceBy(nextPlay, lastPlayed, a => a.data)
              .filter(({ data: cast }) => isActive({
                cast,
                gamestates: gamestateSelectors.forState(getState()),
              }))
              .forEach(({ el: sound }) => sound.play());
            lastPlayed = nextPlay;
          }
        });
        const assetsUrl = scene.casts.filter(and(
          isSoundCast,
          noComparators,
        )).map(cast => get(cast, 'fileName'));

        return Promise.resolve({
          assetsUrl,
        });
      });
    };
  }

  function onStage() {
    return (dispatch, getState) => {
      if (isEmptySoundCast({
        casts: scene.casts,
        gamestates: gamestateSelectors.forState(getState()),
      })) {
        Promise.delay(500).then(() => {
          const eventOptions = {
            currentPosition: { top: 1, left: 1 },
            startingPosition: { top: 1, left: 1 },
            hotspots: soundSelectors.hotspotData(getState()),
            nowInHotspots: [],
            leavingHotspots: [],
            enteringHotspots: [],
            noInteractionHotspots: [],
            isClick: false,
            isMouseDown: false,
            wasMouseMoved: false,
            wasMouseUpped: false,
            wasMouseDowned: false,
            handleHotspot: gamestateActions.handleHotspot,
          };
          return dispatch(inputHandler(eventOptions));
        });
      }
      return Promise.resolve();
    };
  }

  function doExit({
    controlledCasts,
    assets,
  }) {
    return (dispatch, getState) => {
      const v = {
        volume: 1,
      };
      const tween = new Tween(v)
        .to({
          volume: 0,
        }, 1000);
      tween.onUpdate(() => {
        assets.forEach(({ el, listeners }) => {
          if (!listeners.ended) {
            // Only fade out sounds that do not need to finish
            el.volume = v.volume;
          }
        });
      });
      tween.start();

      assets.forEach(({ el, listeners }) => {
        Object.keys(listeners).forEach((eventName) => {
          const handler = listeners[eventName];
          if (eventName === 'ended') {
            // Used to keep handler from doing things it shouldn't
            handler.__aborted = true;
          }
        });
      });

      return Promise.resolve();
    };
  }

  function doUnload({
    assets,
  }) {
    return () => {
      assets.forEach(({ el, listeners }) => {
        if (listeners && listeners.ended) {
          el.removeEventListener('ended', listeners.ended);
        }
      });
      return Promise.resolve({
        assets: [],
        isLoaded: false,
      });
    };
  }

  return {
    applies,
    doPreload: doLoad,
    doLoad,
    doEnter,
    onStage,
    doExit,
    doUnload,
    doPreunload: doUnload,
  };
});
