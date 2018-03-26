import { Observable } from 'rxjs';
import storage from 'local-storage';
import createEpic from 'utils/createEpic';
import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate';
import {
  selectors as titleSelectors,
} from 'morpheus/title';
import {
  loadAsImage,
} from 'service/image';
import * as userService from 'service/user';
import {
  login as loginModule,
} from 'soapbubble';
import {
  MORPHEUS_TO_CURSOR,
  CURSOR_NAMES,
} from './cursors';
import {
  BROWSER_LOAD,
  BROWSER_SAVE,
  CLOUD_LOAD,
  CLOUD_SAVE_NEW,
  CLOUD_SAVE_OPEN,
  CLOUD_SAVE,
  DIMENSIONS_RESIZE,
  GAME_SET_VOLUME,
  GAME_SET_CURSOR,
  CREATE_CANVAS,
  LOGGED_IN,
  LOGIN_START,
  SAVE_ERROR,
  SAVE_LOAD,
  SAVE_LOAD_SUCCESS,
  SAVE_LOAD_ERROR,
  SET_SAVE_ID,
} from './actionTypes';

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

export function login() {
  return {
    type: LOGIN_START,
  };
}

export function logout() {
  return loginModule.actions.logout();
}

export function loggedIn(user) {
  return {
    type: LOGGED_IN,
    payload: user,
  };
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
            name: CURSOR_NAMES[cursor],
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
    width -= widthOffset;
    horizontalPadding = widthOffset / 2;
  } else {
    // Need to add padding to top and bottom
    const heightOffset = height - (width / ORIGINAL_ASPECT_RATIO);
    height -= heightOffset;
    verticalPadding = heightOffset / 2;
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
    function setSize({ camera, renderer, dimensionSelector }) {
      if (camera && renderer) {
        const { width: w, height: h }
          = dimensionSelector ? dimensionSelector(getState()) : { width, height };
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }
    const scene = sceneSelectors.currentSceneData(getState());
    if (scene) {
      setSize(castSelectors.forScene(scene).pano.renderElements(getState()));
      setSize(castSelectors.forScene(scene).hotspot.renderElements(getState()));
    } else {
      setSize(titleSelectors.renderElements(getState()));
    }
    const canvas = gameSelectors.canvas(getState());
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
  };
}

export function getAllSaves() {
  return {
    type: SAVE_LOAD,
  };
}

export function cloudSaveNew() {
  return {
    type: CLOUD_SAVE_NEW,
  };
}

export function cloudSave() {
  return {
    type: CLOUD_SAVE,
  };
}

export function browserSave() {
  return {
    type: BROWSER_SAVE,
  };
}

export function cloudLoad(saveId) {
  return {
    type: CLOUD_LOAD,
    payload: saveId,
  };
}

export function openSave() {
  return {
    type: CLOUD_SAVE_OPEN,
  };
}

export const cloudSaveEpic = createEpic((action$, store) => action$
  .ofType(CLOUD_SAVE)
  .mergeMap(() => userService.saveGame({
    token: loginModule.selectors.token(store.getState()),
    gamestates: gamestateSelectors.gamestates(store.getState()).toJS(),
    currentSceneId: sceneSelectors.currentSceneId(store.getState()),
    previousSceneId: sceneSelectors.previousSceneId(store.getState()),
    saveId: gameSelectors.saveId(store.getState()),
  }))
  .catch(err => ({
    type: SAVE_ERROR,
    payload: err,
  })),
);

export const newSaveGameEpic = createEpic((action$, store) => action$
  .ofType(CLOUD_SAVE_NEW)
  .mergeMap(() => userService.newSaveGame({
    token: loginModule.selectors.token(store.getState()),
    gamestates: gamestateSelectors.gamestates(store.getState()).toJS(),
    currentSceneId: sceneSelectors.currentSceneId(store.getState()),
    previousSceneId: sceneSelectors.previousSceneId(store.getState()),
  }))
  .map((response) => {
    const { saveId } = response.data;
    return {
      type: SET_SAVE_ID,
      payload: saveId,
    };
  }),
);

export const browserSaveEpic = createEpic((action$, store) => action$
  .ofType(BROWSER_SAVE)
  .forEach(() => storage.set('save', {
    gamestates: gamestateSelectors.gamestates(store.getState()).toJS(),
    currentSceneId: sceneSelectors.currentSceneId(store.getState()),
    previousSceneId: sceneSelectors.previousSceneId(store.getState()),
    saveId: gameSelectors.saveId(store.getState()),
  }))
  .catch(err => ({
    type: SAVE_ERROR,
    payload: err,
  })),
);

export function browserLoad() {
  return {
    type: BROWSER_LOAD,
  };
}

export const browserLoadEpic = createEpic(action$ => action$
  .ofType(BROWSER_LOAD)
  .map(() => storage.get('save'))
  .mergeMap(({
    gamestates,
    currentSceneId,
    previousSceneId,
  }) => Observable.from([
    gamestateActions.inject(gamestates),
    sceneActions.goToScene(currentSceneId, true, previousSceneId),
  ])),
);

export const loadGameEpic = createEpic((action$, store) => action$
  .ofType(CLOUD_LOAD)
  .mergeMap(({
    payload: saveId,
  }) => userService.getSaveGame({
    token: loginModule.selectors.token(store.getState()),
    saveId: saveId || gameSelectors.saveId(store.getState()),
  }))
  .map((response) => {
    const {
      currentSceneId,
      previousSceneId,
      gamestates,
      saveId,
    } = response.data;
    return {
      currentSceneId,
      previousSceneId,
      gamestates,
      saveId,
    };
  })
  .mergeMap(({
    currentSceneId,
    previousSceneId,
    gamestates,
    saveId,
  }) => Observable.from([
    {
      type: SET_SAVE_ID,
      payload: saveId,
    },
    gamestateActions.inject(gamestates),
    sceneActions.goToScene(currentSceneId, true, previousSceneId),
  ]))
  .catch(err => ({
    type: 'GAME_LOAD_ERROR',
    payload: err,
  })),
);

export const openSaveEpic = createEpic(action$ => action$
  .ofType(CLOUD_SAVE_OPEN)
  .map(() => ({
    type: SAVE_LOAD,
  })),
);

export const loadSavesEpic = createEpic((action$, store) => action$
  .ofType(SAVE_LOAD)
  .mergeMap(() => userService.getAllSaves({
    token: loginModule.selectors.token(store.getState()),
  }))
  .map(response => ({
    type: SAVE_LOAD_SUCCESS,
    payload: response.data,
  }))
  .catch(err => ({
    type: SAVE_LOAD_ERROR,
    payload: err,
  })),
);
