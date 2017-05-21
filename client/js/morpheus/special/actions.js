import {
  map,
  each,
} from 'lodash';
import Promise from 'bluebird';
import {
  actions as gameActions,
} from 'morpheus/game';
import {
  actions as gameStateActions,
} from 'morpheus/gameState';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  loadAsImage,
} from 'service/image';
import {
  ACTION_TYPES,
  GESTURES,
} from 'morpheus/constants';
import {
  GAME_SET_CURSOR,
  SPECIAL_START,
  SPECIAL_IS_LOADED,
  SPECIAL_IMAGES_LOADED,
  SPECIAL_CANVAS,
  SPECIAL_CONTROLLED_FRAMES,
  SPECIAL_HOTSPOTS_LIST,
} from './actionTypes';

export function specialImgIsLoaded() {
  return {
    type: SPECIAL_IS_LOADED,
  };
}

export function specialCanvasCreated(canvas) {
  return {
    type: SPECIAL_CANVAS,
    payload: canvas,
  };
}

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

function calculateControlledFrameLocation({ cast, gameStates, rect }) {
  const { controlledMovieCallbacks, width, height } = cast;
  const { gameState: gameStateId } = controlledMovieCallbacks[0];
  const gameState = gameStates[gameStateId];
  const { value } = gameState;

  const source = {
    x: value * width,
    y: 0,
    sizeX: width,
    sizeY: height,
  };

  return [
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

export function generateControlledFrames() {
  return (dispatch, getState) => {
    const { gameState, special, dimensions } = getState();
    const { idMap: gameStates } = gameState;
    const { data: sceneData } = special;
    const { casts } = sceneData;
    const controlledCasts = casts.filter(c => c.__t === 'ControlledMovieCast');
    const { width, height } = dimensions;
    dispatch({
      type: SPECIAL_CONTROLLED_FRAMES,
      payload: controlledCasts.reduce((memo, cast) => {
        const { castId, controlledLocation } = cast;
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
      }, {}),
    });
  };
}

export function generateSpecialImages() {
  return (dispatch, getState) => {
    const { special } = getState();
    const { controlledFrames, images, canvas } = special;
    const ctx = canvas.getContext('2d');
    if (Object.keys(images).length && Object.keys(controlledFrames).length) {
      const canvasDrawOps = map(controlledFrames,
        (op, castId) => [images[castId], ...op],
      );
      for (let i = 0; i < canvasDrawOps.length; i += 1) {
        const op = canvasDrawOps[i];
        ctx.drawImage(...op);
      }
      // canvasDrawOps.forEach(op =>
      //   ctx.drawImage(...op),
      // );
    }
  };
}

export function generateHotspots(hotspots) {
  return {
    type: SPECIAL_HOTSPOTS_LIST,
    payload: hotspots,
  };
}

export function handleMouseEvent({ type, top, left, hotspot }) {
  return (dispatch, getState) => {
    const {
      comparators,
      gesture,
      cursorShapeWhenActive,
    } = hotspot;
    const gestureType = GESTURES[gesture];
    if (type === gestureType) {
      dispatch(gameStateActions.handleHotspot(hotspot));
    }
  };
}
//
// switch(gestureType) {
//   case 'MouseDown':  // 0
//
//     break;
//   case 'MouseUp':    // 1
//
//     break;
//   case 'MouseClick': // 2
//
//     break;
//   case 'MouseEnter': // 3
//
//     break;
//   case 'MouseLeave': // 4
//
//     break;
//   case 'MouseNone':  // 5
//
//     break;
//   case 'Always':     // 6
//
//     break;
//   case 'SceneEnter': // 7
//
//     break;
//   case 'SceneExit':  // 8
//
//     break;
// }

export function setHoverIndex(index) {
  return (dispatch, getState) => {
    const { special } = getState();
    const { hotspots } = special;

    const hotspot = hotspots[index];
    const { cursorShapeWhenActive: morpheusCursor  } = hotspot;
    dispatch({
      type: GAME_SET_CURSOR,
      payload: morpheusCursor,
    });
  };
}

export function activateHotspotIndex(index) {

}

export function display(sceneData) {
  return (dispatch) => {
    const { casts } = sceneData;
    // The lead cast is the cast whoms castId matches the sceneId
    const leadCast = casts.find(c => c.castId === sceneData.sceneId);
    const hotspotsData = casts.filter(c => c.castId === 0);
    const url = getAssetUrl(leadCast.fileName, 'png');
    dispatch(gameActions.resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    dispatch(generateHotspots(hotspotsData));
    dispatch(generateControlledFrames());
    dispatch({
      type: SPECIAL_START,
      payload: sceneData,
      meta: {
        url,
        hotspotsData,
      },
    });
  };
}

export function load(sceneData) {
  return (dispatch) => {
    const { casts } = sceneData;
    // Extras are casts with non-zero castId that does not match sceneId
    const extrasCasts = casts.filter(c => c.castId && c.castId !== sceneData.sceneId);
    const controlledCasts = extrasCasts.filter(c => c.__t === 'ControlledMovieCast');
    Promise.all(controlledCasts.map(cast => loadAsImage(cast.fileName)
      .then(img => ({
        img,
        castId: cast.castId,
      }))))
      .then((images) => {
        dispatch({
          payload: images,
          type: SPECIAL_IMAGES_LOADED,
        });
        dispatch(display(sceneData));
      });
  };
}
