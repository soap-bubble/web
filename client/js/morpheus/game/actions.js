import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  loadAsImage,
} from 'service/image';
import {
  DIMENSIONS_RESIZE,
  GAME_SET_VOLUME,
  GAME_SET_CURSOR,
  CREATE_CANVAS,
} from './actionTypes';

import cursor10001 from '../../../image/cursors/Bigarrow.png';
import cursor10011 from '../../../image/cursors/Card.png';
import cursor10008 from '../../../image/cursors/Open.png';
import cursor10009 from '../../../image/cursors/Closed.png';
import cursor10000 from '../../../image/cursors/Wheel.png';
import cursor10002 from '../../../image/cursors/Hand.png';
import cursor10003 from '../../../image/cursors/Tele.png';
import cursor10005 from '../../../image/cursors/Goback.png';
import cursor10007 from '../../../image/cursors/Down.png';
import cursor10010 from '../../../image/cursors/Tapest.png';
import cursor10004 from '../../../image/cursors/Micro.png';
import cursor10012 from '../../../image/cursors/Cur10012.png';
import cursor10013 from '../../../image/cursors/Cur10013.png';
import cursor10014 from '../../../image/cursors/Cur10014.png';
import cursor10015 from '../../../image/cursors/Cur10015.png';
import cursor10016 from '../../../image/cursors/Cur10016.png';
import cursor10017 from '../../../image/cursors/cur10017.png';
import cursor10018 from '../../../image/cursors/cur10018.png';
import cursor10019 from '../../../image/cursors/cur10019.png';
import cursor10020 from '../../../image/cursors/cur10020.png';
import cursor10021 from '../../../image/cursors/cur10021.png';
import cursor10022 from '../../../image/cursors/cur10022.png';
import cursor10023 from '../../../image/cursors/cur10023.png';
import cursor10024 from '../../../image/cursors/cur10024.png';

const MORPHEUS_TO_CURSOR = {
  10001: cursor10001,
  10011: cursor10011,
  10008: cursor10008,
  10009: cursor10009,
  10000: cursor10000,
  10002: cursor10002,
  10003: cursor10003,
  10005: cursor10005,
  10007: cursor10007,
  10010: cursor10010,
  10004: cursor10004,
  10012: cursor10012,
  10013: cursor10013,
  10014: cursor10014,
  10015: cursor10015,
  10016: cursor10016,
  10017: cursor10017,
  10018: cursor10018,
  10019: cursor10019,
  10020: cursor10020,
  10021: cursor10021,
  10022: cursor10022,
  10023: cursor10023,
  10024: cursor10024,
};

function createCanvas({ width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

const loadedCursors = {};
function promiseCursor(id) {
  const realId = id;
  if (realId && !loadedCursors[realId]) {
    loadedCursors[realId] = loadAsImage(MORPHEUS_TO_CURSOR[realId]);
  }
  return loadedCursors[realId] || Promise.resolve(null);
}

export function createUIOverlay() {
  return (dispatch, getState) => {
    const { width, height } = gameSelectors.dimensions(getState());
    const canvas = createCanvas({ width, height });
    dispatch({
      type: CREATE_CANVAS,
      payload: canvas,
    });
  };
}

export function setVolume(volume) {
  return {
    type: GAME_SET_VOLUME,
    payload: volume,
  };
}

export function setCursor(cursor) {
  return (dispatch, getState) => {
    const currentCursor = gameSelectors.morpheusCursor(getState());
    if (cursor !== 0 && currentCursor !== cursor) {
      return promiseCursor(cursor)
        .then(cursorImg => dispatch({
          type: GAME_SET_CURSOR,
          payload: {
            cursor,
            cursorImg,
          },
        }));
    }
    return Promise.resolve();
  };
}

export function setPointerCursor() {
  return dispatch => dispatch(setCursor(10002));
}

export function setOpenHandCursor() {
  return dispatch => dispatch(setCursor(10008));
}

export function setCloseHandCursor() {
  return dispatch => dispatch(setCursor(10009));
}

export function setCursorLocation({ top, left }) {
  return (dispatch, getState) => {
    const canvas = gameSelectors.canvas(getState());
    const cursor = gameSelectors.cursorImg(getState());
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (cursor) {
      ctx.drawImage(
        cursor,
        0,
        0,
        cursor.width,
        cursor.height, left - (cursor.width / 2),
        top - (cursor.height / 2),
        cursor.width,
        cursor.height,
      );
    }
  };
}

const ORIGINAL_HEIGHT = 400;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

export function resize({
  width: reqWidth = null,
  height: reqHeight = null,
} = {}) {
  let horizontalPadding = 0;
  let verticalPadding = 0;
  let width = reqWidth || window.innerWidth;
  let height = reqHeight || window.innerHeight;
  if (width / height > ORIGINAL_ASPECT_RATIO) {
    // Need to add padding to sides
    const widthOffset = width - (height * ORIGINAL_ASPECT_RATIO);
    width = width - widthOffset;
    horizontalPadding = widthOffset / 2;
  } else {
    // Need to add padding to top and bottom
    const heightOffset = height - (width / ORIGINAL_ASPECT_RATIO);
    height = height - heightOffset;
    verticalPadding = heightOffset / 2;
  }
  function setSize({ camera, renderer }) {
    if (camera && renderer) {
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
  return (dispatch, getState) => {
    dispatch({
      type: DIMENSIONS_RESIZE,
      payload: {
        width,
        height,
        location: {
          x: horizontalPadding,
          y: verticalPadding,
        },
      },
    });
    const scene = sceneSelectors.currentSceneData(getState());
    if (scene) {
      setSize(castSelectors.forScene(scene).pano.renderElements(getState()));
      setSize(castSelectors.forScene(scene).hotspot.renderElements(getState()));
    }
  };
}
