// import { get, isUndefined, once, remove } from 'lodash'
// import Promise from 'bluebird'
// import memoize from 'utils/memoize'
// import uasParser from 'ua-parser-js'
// import loggerFactory from 'utils/logger'
// import {
//   actions as gamestateActions,
//   selectors as gamestateSelectors,
//   isActive,
// } from 'morpheus/gamestate'
// import {
//   selectors as gameSelectors,
//   actions as gameActions,
// } from 'morpheus/game'
// import { selectors as castSelectors } from 'morpheus/casts'
// import { actions as sceneActions } from 'morpheus/scene'
// import { sceneLoadQueue } from 'morpheus/scene/actions'
// import {
//   special as inputHandlerFactory,
//   eventInterface,
// } from 'morpheus/hotspot'
// import { getAssetUrl } from 'service/gamedb'
// import { loadAsImage } from 'service/image'
// import { createVideo } from 'utils/video'
// import { resizeToScreen, generateMovieTransform } from 'utils/resize'
// import linkPreload from 'utils/linkPreload'
// import renderEvents from 'utils/render'
// import { GESTURES } from 'morpheus/constants'
// import { and, or, not } from 'utils/matchers'
// import { forMorpheusType, isMovie, isAudio, isHotspot } from '../matchers'

// const logger = loggerFactory('cast:special')
// const selectSpecialCastDataFromSceneAndType = (scene, sceneType) => {
//   if (sceneType === 3) {
//     return get(scene, 'casts', []).find(c => c.__t === 'MovieSpecialCast')
//   }
//   return null
// }

// const userAgentString = (global.navigator && global.navigator.userAgent) || ''
// const uas = uasParser(userAgentString)
// const movExt = uas.browser.name.indexOf('Safari') !== -1 ? 'mp4' : 'webm'

// function startRenderLoop({ update }) {
//   renderEvents.onRender(update)
// }

// export const delegate = memoize(scene => {
//   function applies() {
//     return selectSpecialCastDataFromSceneAndType(scene, get(scene, 'sceneType'))
//   }

//   function updateAssets({
//     getState,
//     autoplay,
//     assets,
//     loadingAssets,
//     movieCasts,
//     dispatch,
//   }) {
//     const loadedData = [
//       ...assets.map(({ data }) => data),
//       ...loadingAssets.map(({ data }) => data),
//     ]
//     function existsInAssets(cast) {
//       return loadedData.find(data => data === cast)
//     }
//     return Promise.all(
//       movieCasts
//         .filter(
//           cast =>
//             !existsInAssets(cast) &&
//             isActive({
//               cast,
//               gamestates: gamestateSelectors.forState(getState()),
//             }),
//         )
//         .map(movieCast => {
//           return new Promise((resolve, reject) => {
//             console.log(`-----------------> Loading ${movieCast.fileName}`)
//             loadingAssets.push({
//               data: movieCast,
//             })
//             const video = createVideo(getAssetUrl(movieCast.fileName), {
//               loop: movieCast.looping,
//               autoplay,
//               onerror: reject,
//             })
//             video.volume = gameSelectors.htmlVolume(getState())
//             video.classList.add('MovieSpecialCast')
//             function onVideoEnded() {
//               let startAngle
//               const { nextSceneId, angleAtEnd, dissolveToNextScene } = movieCast
//               if (
//                 nextSceneId &&
//                 nextSceneId !== 0x3fffffff &&
//                 nextSceneId !== scene.sceneId
//               ) {
//                 if (
//                   !isUndefined(angleAtEnd) &&
//                   angleAtEnd !== -1 &&
//                   !onVideoEnded.__aborted
//                 ) {
//                   startAngle = (angleAtEnd * Math.PI) / 1800
//                   startAngle -= Math.PI - Math.PI / 6
//                 }
//                 logger.info(
//                   `End of movie transition from ${scene.sceneId} to ${nextSceneId}`,
//                 )
//                 dispatch(
//                   sceneActions.goToScene(nextSceneId, dissolveToNextScene),
//                 ).catch(() =>
//                   console.error('Failed to load scene', nextSceneId),
//                 )
//                 dispatch(sceneActions.setNextStartAngle(startAngle))
//               }
//             }
//             function onCanPlayThrough() {
//               video.removeEventListener('canplaythrough', onCanPlayThrough)
//               resolve({
//                 el: video,
//                 listeners: {
//                   ended: onVideoEnded,
//                   canplaythrough: onCanPlayThrough,
//                 },
//               })
//             }
//             video.addEventListener('ended', onVideoEnded)
//             video.addEventListener('canplaythrough', onCanPlayThrough)
//           }).then(({ el, listeners }) => ({
//             el,
//             listeners,
//             data: movieCast,
//           }))
//         }),
//     ).then(videos => {
//       // Check is there is already a parent... we will immediately add there.
//       const findParent = once(() => videos.find(v => v.parentElement))
//       videos.forEach(video => {
//         const { el, data, listeners } = video
//         applyTransformToVideo({
//           transform: generateMovieTransform({
//             dimensions: gameSelectors.dimensions(getState()),
//             cast: data,
//           }),
//           video: el,
//         })
//         assets.push({
//           el,
//           data,
//           listeners,
//         })
//         remove(loadingAssets, ({ data: lData }) => data === lData)
//         const parent = findParent()
//         if (parent) {
//           parent.parentElement.appendChild(el)
//         }
//       })
//       return videos
//     })
//   }

//   function doLoad({ setState, isLoaded, isLoading }) {
//     return (dispatch, getState) => {
//       if (isLoaded) {
//         return Promise.resolve({})
//       }
//       if (isLoading) {
//         return isLoading
//       }
//       const assets = []
//       const videos = []
//       const loadingAssets = []
//       const controlledCastsData = scene.casts.filter(
//         and(forMorpheusType('ControlledMovieCast'), not(isAudio)),
//       )
//       const movieCasts = scene.casts.filter(isMovie)
//       const imageCasts = scene.casts.filter(c => c.image)
//       const gamestates = gamestateSelectors.forState(getState())

//       const loadImages = Promise.all(
//         imageCasts.map(imageCast => {
//           const { fileName, startFrame } = imageCast
//           return loadAsImage(getAssetUrl(fileName, `${startFrame}.png`)).then(
//             img => ({
//               el: img,
//               data: imageCast,
//             }),
//           )
//         }),
//       )

//       // let loadMovies = updateAssets({
//       //     dispatch,
//       //     setState,
//       //     getState,
//       //     movieCasts,
//       //     assets,
//       //     loadingAssets,
//       //     autoplay: false,
//       //   });

//       const loadMovies = movieCasts
//         .filter(cast =>
//           isActive({
//             cast,
//             gamestates,
//           }),
//         )
//         .map(cast => ({ cast }))

//       const activeMovieCasts = movieCasts
//         .filter(cast =>
//           isActive({
//             cast,
//             gamestates,
//           }),
//         )
//         .map(movieCast => ({
//           movieCast,
//           autoplay: false,
//         }))

//       const loadControlledMovies = Promise.all(
//         controlledCastsData
//           .filter(cast => !cast.audioOnly)
//           .map(cast =>
//             loadAsImage(getAssetUrl(cast.fileName, 'png')).then(img => ({
//               el: img,
//               data: cast,
//             })),
//           ),
//       )

//       function onVideoEnded(e, movieCast) {
//         let startAngle
//         const { nextSceneId, angleAtEnd, dissolveToNextScene } = movieCast
//         if (
//           nextSceneId &&
//           nextSceneId !== 0x3fffffff &&
//           nextSceneId !== scene.sceneId
//         ) {
//           if (
//             !isUndefined(angleAtEnd) &&
//             angleAtEnd !== -1 &&
//             !onVideoEnded.__aborted
//           ) {
//             startAngle = (angleAtEnd * Math.PI) / 1800
//             startAngle -= Math.PI - Math.PI / 6
//           }
//           logger.info(
//             `End of movie transition from ${scene.sceneId} to ${nextSceneId}`,
//           )
//           dispatch(
//             sceneActions.goToScene(nextSceneId, dissolveToNextScene),
//           ).catch(() => console.error('Failed to load scene', nextSceneId))
//           dispatch(sceneActions.setNextStartAngle(startAngle))
//         }
//       }

//       function onCanPlayThrough(e, movieCast) {
//         if (
//           activeMovieCasts.find(
//             ({ movieCast: a, autoplay }) => !autoplay && a === movieCast,
//           )
//         ) {
//           e.currentTarget.play()
//         }
//       }

//       const specialHandler = eventInterface.touchDisablesMouse(
//         inputHandlerFactory({
//           dispatch,
//           scene,
//         }),
//       )

//       const promise = Promise.all([
//         loadImages,
//         loadMovies,
//         loadControlledMovies,
//       ]).then(([images, movies, controlledCasts]) => ({
//         images,
//         controlledCasts,
//         isLoaded: true,
//         assets,
//         movieCasts,
//         movies,
//         loadingAssets,
//         activeMovieCasts,
//         onCanPlayThrough,
//         specialHandler,
//         onVideoEnded,
//         videoPreloads: [],
//       }))
//       setState({
//         isLoading: promise,
//       })
//       return promise
//     }
//   }

//   function doEnter() {
//     return (dispatch, getState) => {
//       dispatch(gameActions.setCursor(null))
//     }
//   }

//   function onStage({ images, activeMovieCasts }) {
//     return (dispatch, getState) => {
//       const hotspotData = scene.casts.filter(isHotspot)
//       const gamestates = gamestateSelectors.forState(getState())
//       activeMovieCasts.forEach(({ videoEl, autoplay }) => {
//         if (!autoplay) {
//           // videoEl.play()
//         }
//       })
//       hotspotData
//         .filter(cast => isActive({ cast, gamestates }))
//         .forEach(hotspot => {
//           const { gesture } = hotspot
//           if (
//             GESTURES[gesture] === 'Always' ||
//             GESTURES[gesture] === 'SceneEnter'
//           ) {
//             dispatch(gamestateActions.handleHotspot({ hotspot }))
//           }
//         })

//       images.some(({ data: cast }) => {
//         if (cast.actionAtEnd > 0) {
//           // FIXME this is a disconnected promise chain because trying to sychronize
//           // on the new action while within the scene pipeline did not work
//           function tryToTransition() {
//             if (!sceneLoadQueue.isPending(scene.sceneId)) {
//               logger.info(
//                 `Image transition from ${scene.sceneId} to ${cast.actionAtEnd}`,
//               )
//               dispatch(
//                 sceneActions.goToScene(
//                   cast.actionAtEnd,
//                   cast.dissolveToNextScene,
//                 ),
//               )
//             } else {
//               setTimeout(tryToTransition, 500)
//             }
//           }
//           setTimeout(tryToTransition, 500)
//         }
//         return null
//       })
//       return Promise.resolve()
//     }
//   }

//   function doExit({ controlledCasts }) {
//     return (dispatch, getState) => {
//       // // FIXME: Clean this up!!
//       // // const videos = specialSelectors.videos(getState());
//       //
//       // const everything = sounds;
//       // const v = {
//       //   volume: 1,
//       // };
//       // const tween = new Tween(v)
//       //   .to({
//       //     volume: 0,
//       //   }, 1000);
//       // tween.onUpdate(() => {
//       //   everything.forEach(({ el, listeners }) => {
//       //     if (!listeners.ended) {
//       //       // Only fade out sounds that do not need to finish
//       //       el.volume = v.volume;
//       //     }
//       //   });
//       // });
//       // tween.start();
//       //
//       // everything.forEach(({ el, listeners }) => {
//       //   Object.keys(listeners).forEach((eventName) => {
//       //     const handler = listeners[eventName];
//       //     if (eventName === 'ended') {
//       //       // Used to keep handler from doing things it shouldn't
//       //       handler.__aborted = true;
//       //     }
//       //   });
//       // });
//       // Reset animated controlledMovieCallbacks
//       controlledCasts
//         .map(ref => ref.data)
//         .filter(
//           cast =>
//             cast.controlledMovieCallbacks &&
//             cast.controlledMovieCallbacks.length,
//         )
//         .forEach(({ controlledMovieCallbacks }) =>
//           controlledMovieCallbacks.forEach(controlledMovieCallback => {
//             delete controlledMovieCallback.currentValue
//             delete controlledMovieCallback.tick
//           }),
//         )

//       return Promise.resolve({
//         exited: true,
//       })
//     }
//   }

//   function doUnload({ assets, loadingAssets, videoPreloads }) {
//     return () => {
//       return Promise.resolve({
//         images: [],
//         assets: [],
//         videoPreloads: [],
//         canvas: null,
//         isLoaded: false,
//         exited: null,
//       })
//     }
//   }

//   function doPause({ assets }) {
//     return () => {
//       assets.forEach(({ el }) => {
//         if (el && el.paused) {
//           el.__mWasPaused = true
//         } else if (el && el.pause) {
//           el.pause()
//           el.__mWasPaused = false
//         }
//       })
//     }
//   }

//   function doResume({ assets }) {
//     return () => {
//       assets.forEach(({ el }) => {
//         if (el && !el.__mWasPaused) {
//           el.play()
//         }
//       })
//     }
//   }

//   return {
//     applies,
//     doLoad,
//     doPreload: doLoad,
//     doEnter,
//     onStage,
//     doExit,
//     doUnload,
//     doPreunload: doUnload,
//     doPause,
//     doResume,
//   }
// })
