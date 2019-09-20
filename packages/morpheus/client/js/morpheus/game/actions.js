import { from, of } from 'rxjs'
import { map, mergeMap, filter, catchError } from 'rxjs/operators'
import storage from 'local-storage'
import createEpic from 'utils/createEpic'
import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene'
import { selectors as castSelectors } from 'morpheus/casts'
import { selectors as gameSelectors } from 'morpheus/game'
import {
  actions as inputActions,
  selectors as inputSelectors,
} from 'morpheus/input'
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate'
import { selectors as titleSelectors } from 'morpheus/title'
import { loadAsImage } from 'service/image'
import * as userService from 'service/user'

import { MORPHEUS_TO_CURSOR, CURSOR_NAMES } from './cursors'
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
  LOCAL_LOAD,
  LOCAL_SAVE,
  SAVE_ERROR,
  SAVE_LOAD,
  SAVE_LOAD_SUCCESS,
  SAVE_LOAD_ERROR,
  SET_SAVE_ID,
  LOGOUT_START,
} from './actionTypes'

function createCanvas({ width, height }) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const loadedCursors = {}
function promiseCursor(id) {
  const realId = id
  if (realId && !loadedCursors[realId]) {
    loadedCursors[realId] = loadAsImage(MORPHEUS_TO_CURSOR[realId])
  }
  return loadedCursors[realId] || Promise.resolve(null)
}

export function loginAction() {
  return {
    type: LOGIN_START,
  }
}

export function logoutAction() {
  return {
    type: LOGOUT_START,
  }
}

export function loggedIn(user) {
  return {
    type: LOGGED_IN,
    payload: user,
  }
}

export function createUIOverlay(canvas) {
  return {
    type: CREATE_CANVAS,
    payload: canvas,
  }
}

export function setVolume(volume) {
  return {
    type: GAME_SET_VOLUME,
    payload: volume,
  }
}

export function setCursor(cursor) {
  return (dispatch, getState) => {
    const currentCursor = gameSelectors.morpheusCursor(getState())
    if (cursor !== 0 && currentCursor !== cursor) {
      return promiseCursor(cursor).then(cursorImg =>
        dispatch({
          type: GAME_SET_CURSOR,
          payload: {
            name: CURSOR_NAMES[cursor],
            cursor,
            cursorImg,
          },
        }),
      )
    }
    return Promise.resolve()
  }
}

export function setPointerCursor() {
  return dispatch => dispatch(setCursor(10002))
}

export function setOpenHandCursor() {
  return dispatch => dispatch(setCursor(10008))
}

export function setCloseHandCursor() {
  return dispatch => dispatch(setCursor(10009))
}

// dispatch(inputActions.cursorSetPosition(screenPos));
export function drawCursor() {
  return (dispatch, getState) => {
    const canvas = gameSelectors.canvas(getState())
    const cursor = gameSelectors.cursorImg(getState())
    if (cursor) {
      const cursorPos = inputSelectors.cursorPosition(getState())
      const screenPos = {
        x: cursorPos.left - cursor.width / 2,
        y: cursorPos.top - cursor.height / 2,
      }
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(
        cursor,
        0,
        0,
        cursor.width,
        cursor.height,
        screenPos.x,
        screenPos.y,
        cursor.width,
        cursor.height,
      )
    }
  }
}

export function setCursorLocationFromPage({ pageX, pageY }) {
  return (dispatch, getState) => {
    const location = gameSelectors.location(getState())
    const top = pageY - location.y
    const left = pageX - location.x
    dispatch(
      inputActions.cursorSetPosition({
        top,
        left,
      }),
    )
  }
}

const ORIGINAL_HEIGHT = 400
const ORIGINAL_WIDTH = 640
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT

export function resize({
  width: reqWidth = null,
  height: reqHeight = null,
} = {}) {
  let horizontalPadding = 0
  let verticalPadding = 0
  let width = reqWidth || window.innerWidth
  let height = reqHeight || window.innerHeight
  if (width / height > ORIGINAL_ASPECT_RATIO) {
    // Need to add padding to sides
    const widthOffset = width - height * ORIGINAL_ASPECT_RATIO
    width -= widthOffset
    horizontalPadding = widthOffset / 2
  } else {
    // Need to add padding to top and bottom
    const heightOffset = height - width / ORIGINAL_ASPECT_RATIO
    height -= heightOffset
    verticalPadding = heightOffset / 2
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
    })
    function setSize({ camera, renderer, dimensionSelector }) {
      if (camera && renderer) {
        const { width: w, height: h } = dimensionSelector
          ? dimensionSelector(getState())
          : { width, height }
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
    }

    if (
      sceneSelectors.currentSceneData(getState()) &&
      titleSelectors.isDone(getState())
    ) {
      sceneSelectors.currentScenesData(getState()).forEach(scene => {
        const canvas = gameSelectors.canvas(getState())
        const sceneSelectors = castSelectors.forScene(scene).cache()

        const panoWebgl =
          sceneSelectors && sceneSelectors.pano && sceneSelectors.pano.webgl
        if (panoWebgl) {
          setSize({
            ...panoWebgl,
            canvas,
          })
        }

        const hotspotWebgl =
          sceneSelectors &&
          sceneSelectors.hotspot &&
          sceneSelectors.hotspot.webgl
        if (hotspotWebgl) {
          setSize({
            ...hotspotWebgl,
            canvas,
          })
        }

        const specialCanvas =
          sceneSelectors &&
          sceneSelectors.special &&
          sceneSelectors.special.canvas
        if (specialCanvas) {
          setSize({
            canvas: specialCanvas,
          })
        }
      })
    } else {
      setSize(titleSelectors.renderElements(getState()))
    }
  }
}

export function getAllSaves() {
  return {
    type: SAVE_LOAD,
  }
}

export function cloudSaveNew() {
  return {
    type: CLOUD_SAVE_NEW,
  }
}

export function cloudSave() {
  return {
    type: CLOUD_SAVE,
  }
}

export function browserSave() {
  return {
    type: BROWSER_SAVE,
  }
}

export function cloudLoad(saveId) {
  return {
    type: CLOUD_LOAD,
    payload: saveId,
  }
}

export function localSave() {
  return {
    type: LOCAL_SAVE,
  }
}

export function localLoad(payload) {
  return {
    type: LOCAL_LOAD,
    payload,
  }
}

export function openSave() {
  return {
    type: CLOUD_SAVE_OPEN,
  }
}

export const loginEpic = createEpic(action$ =>
  action$.pipe(
    filter(action => action.type === LOGIN_START),
    mergeMap(() =>
      from(
        firebase
          .auth()
          .signInWithPopup(new firebase.auth.GoogleAuthProvider())
          .then(({ user }) => user),
      ),
    ),
    catchError(err => ({
      type: SAVE_ERROR,
      payload: err,
    })),
    map(user => ({ type: LOGGED_IN, payload: user })),
  ),
)

export const logoutEpic = createEpic(action$ =>
  action$.pipe(
    filter(action => action.type === LOGOUT_START),
    mergeMap(() => from(firebase.auth().signOut())),
    map(user => ({ type: LOGGED_IN, payload: user })),
  ),
)

export const newSaveGameEpic = createEpic((action$, state$) =>
  action$.pipe(
    filter(({ type }) => type === CLOUD_SAVE_NEW),
    mergeMap(async () => {
      try {
        const { uid } = firebase.auth().currentUser
        const db = firebase.firestore()
        const saveRef = db.collection('saves')
        const saveData = {
          gamestates: gamestateSelectors.gamestates(state$.value).toJS() || [],
          currentSceneId: sceneSelectors.currentSceneId(state$.value) || null,
          previousSceneId: sceneSelectors.previousSceneId(state$.value) || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }

        const response = await saveRef.add({
          ...saveData,
          roles: {
            [uid]: 'owner',
          },
        })
        const { id } = response
        return {
          type: SET_SAVE_ID,
          payload: id,
        }
      } catch (err) {
        return {
          type: SAVE_ERROR,
          payload: err,
        }
      }
    }),
  ),
)

export const cloudSaveEpic = createEpic((action$, state$) =>
  action$.pipe(
    filter(({ type }) => type === CLOUD_SAVE),
    mergeMap(async () => {
      try {
        const db = firebase.firestore()
        const saveRef = db
          .collection('saves')
          .doc(gameSelectors.saveId(state$.value))
        const saveData = {
          gamestates: gamestateSelectors.gamestates(state$.value).toJS() || [],
          currentSceneId: sceneSelectors.currentSceneId(state$.value) || null,
          previousSceneId: sceneSelectors.previousSceneId(state$.value) || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }
        const response = await saveRef.set(saveData, { merge: true })
        const { id } = response
        return {
          type: SET_SAVE_ID,
          payload: id,
        }
      } catch (err) {
        return {
          type: SAVE_ERROR,
          payload: err,
        }
      }
    }),
  ),
)

export const loadSavesEpic = createEpic((action$, state$) =>
  action$.pipe(
    filter(({ type }) => type === SAVE_LOAD),
    mergeMap(async () => {
      try {
        const { uid } = firebase.auth().currentUser
        const db = firebase.firestore()
        const saveDocs = await db
          .collection('saves')
          .where(`roles.${uid}`, '==', 'owner')
          .get()
        return {
          type: SAVE_LOAD_SUCCESS,
          payload: saveDocs.docs.map(doc => {
            const { updatedAt } = doc.data()
            return {
              saveId: doc.id,
              timestamp: updatedAt.toDate(),
            }
          }),
        }
      } catch (err) {
        return {
          type: SAVE_LOAD_ERROR,
          payload: err,
        }
      }
    }),
  ),
)

export const loadGameEpic = createEpic((action$, state$) =>
  action$.pipe(
    filter(({ type }) => type === CLOUD_LOAD),
    mergeMap(async ({ payload: saveId }) => {
      try {
        const db = firebase.firestore()
        const saveDoc = await db
          .collection('saves')
          .doc(saveId || gameSelectors.saveId(store$.value))
          .get()
        const { currentSceneId, previousSceneId, gamestates } = saveDoc.data()
        return [
          {
            type: SET_SAVE_ID,
            payload: saveDoc.id,
          },
          gamestateActions.inject(gamestates),
          sceneActions.goToScene(currentSceneId, true, previousSceneId),
        ]
      } catch (err) {
        return {
          type: 'GAME_LOAD_ERROR',
          payload: err,
        }
      }
    }),
    mergeMap(from),
  ),
)

export const browserSaveEpic = createEpic((action$, store$) =>
  action$
    .ofType(BROWSER_SAVE)
    .forEach(() => {
      const pano = castSelectors.forScene(
        sceneSelectors.currentSceneData(store$.value),
      ).pano
      storage.set('save', {
        gamestates: gamestateSelectors.gamestates(store$.value).toJS(),
        currentSceneId: sceneSelectors.currentSceneId(store$.value),
        previousSceneId: sceneSelectors.previousSceneId(store$.value),
        saveId: gameSelectors.saveId(store$.value),
        rotation: (pano && pano.object3D.rotation) || null,
      })
    })
    .catch(err => ({
      type: SAVE_ERROR,
      payload: err,
    })),
)

export const localSaveEpic = createEpic((action$, store$) =>
  action$
    .ofType(LOCAL_SAVE)
    .forEach(() => {
      const pano = castSelectors.forScene(
        sceneSelectors.currentSceneData(store$.value),
      ).pano
      const saveFile = {
        gamestates: gamestateSelectors.gamestates(store$.value).toJS(),
        currentSceneId: sceneSelectors.currentSceneId(store$.value),
        previousSceneId: sceneSelectors.previousSceneId(store$.value),
        saveId: gameSelectors.saveId(store$.value),
        rotation: (pano && pano.object3D.rotation) || null,
      }

      const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(saveFile),
      )}`
      const downloadAnchorNode = document.createElement('a')
      downloadAnchorNode.setAttribute('href', dataStr)
      downloadAnchorNode.setAttribute('download', 'morpheus.save.json')
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
    })
    .catch(err => ({
      type: SAVE_ERROR,
      payload: err,
    })),
)

export const localLoadEpic = createEpic((action$, store$) =>
  action$
    .ofType(LOCAL_LOAD)
    .mergeMap(
      ({
        payload: { gamestates, currentSceneId, previousSceneId, rotation },
      }) =>
        from([
          gamestateActions.inject(gamestates),
          sceneActions.goToScene(currentSceneId, true, previousSceneId),
        ]),
    )
    .catch(err => ({
      type: 'GAME_LOAD_ERROR',
      payload: err,
    })),
)

export function browserLoad() {
  return dispatch => {
    const payload = storage.get('save')
    dispatch({
      type: BROWSER_LOAD,
      payload,
    })
    return !!payload
  }
}

export const browserLoadEpic = createEpic((action$, store) =>
  action$
    .ofType(BROWSER_LOAD)
    .filter(({ payload: data }) => !!data)
    .mergeMap(
      ({
        payload: { gamestates, currentSceneId, previousSceneId, rotation },
      }) =>
        from([
          gamestateActions.inject(gamestates),
          sceneActions.goToScene(
            currentSceneId,
            true,
            previousSceneId,
            rotation,
          ),
        ]),
    ),
)

export const openSaveEpic = createEpic(action$ =>
  action$.ofType(CLOUD_SAVE_OPEN).map(() => ({
    type: SAVE_LOAD,
  })),
)
