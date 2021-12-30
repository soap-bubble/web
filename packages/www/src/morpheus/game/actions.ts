import { from, of } from "rxjs";
import { map, mergeMap, filter, catchError } from "rxjs/operators";
import * as storage from "local-storage";
import createEpic from "utils/createEpic";

import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from "morpheus/scene";
import { selectors as castSelectors } from "morpheus/casts";
import { selectors as gameSelectors } from "morpheus/game";
import {
  actions as inputActions,
  selectors as inputSelectors,
} from "morpheus/input";
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
} from "morpheus/gamestate";
// @ts-ignore
import { selectors as titleSelectors } from "morpheus/title";
import { loadAsImage } from "service/image";

import { MORPHEUS_TO_CURSOR, CURSOR_NAMES } from "./cursors";
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
} from "./actionTypes";
import { ActionCreator, Action } from "redux";
import { ThunkAction } from "redux-thunk";
import { ofType } from "redux-observable";

function createCanvas({ width, height }: { width: number; height: number }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

const loadedCursors = {} as { [key: number]: Promise<HTMLImageElement> };
export function promiseCursor(id: number) {
  const realId = id;
  if (realId && !loadedCursors[realId]) {
    // @ts-ignore
    loadedCursors[realId] = loadAsImage(MORPHEUS_TO_CURSOR[realId]);
  }
  return loadedCursors[realId] || Promise.resolve(null);
}

export function loginAction() {
  return {
    type: LOGIN_START,
  };
}

export function logoutAction() {
  return {
    type: LOGOUT_START,
  };
}

export function loggedIn(user: any) {
  return {
    type: LOGGED_IN,
    payload: user,
  };
}

export function createUIOverlay(canvas: any) {
  return {
    type: CREATE_CANVAS,
    payload: canvas,
  };
}

export function setVolume(volume: any) {
  return {
    type: GAME_SET_VOLUME,
    payload: volume,
  };
}

export const setCursor: ActionCreator<
  ThunkAction<Promise<any>, any, any, Action>
> = (cursor) => {
  return (dispatch, getState) => {
    const currentCursor = gameSelectors.morpheusCursor(getState());
    if (cursor !== 0 && currentCursor !== cursor) {
      return promiseCursor(cursor).then((cursorImg) =>
        dispatch({
          type: GAME_SET_CURSOR,
          payload: {
            name: CURSOR_NAMES[cursor],
            cursor,
            cursorImg,
          },
        })
      );
    }
    return Promise.resolve();
  };
};

export const setPointerCursor: ActionCreator<
  ThunkAction<void, any, any, Action>
> = () => {
  return (dispatch) => dispatch(setCursor(10002));
};

export const setOpenHandCursor: ActionCreator<
  ThunkAction<void, any, any, Action>
> = () => {
  return (dispatch) => dispatch(setCursor(10008));
};

export const setCloseHandCursor: ActionCreator<
  ThunkAction<void, any, any, Action>
> = () => {
  return (dispatch) => dispatch(setCursor(10009));
};

// dispatch(inputActions.cursorSetPosition(screenPos));
export const drawCursor: ActionCreator<ThunkAction<void, any, any, Action>> =
  () => {
    return (dispatch, getState) => {
      const canvas = gameSelectors.canvas(getState());
      const cursor = gameSelectors.cursorImg(getState());
      if (cursor) {
        const cursorPos = inputSelectors.cursorPosition(getState());
        const screenPos = {
          x: cursorPos.left || 0 - cursor.width / 2,
          y: cursorPos.top || 0 - cursor.height / 2,
        };
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          cursor,
          0,
          0,
          cursor.width,
          cursor.height,
          screenPos.x,
          screenPos.y,
          cursor.width,
          cursor.height
        );
      }
    };
  };

export const setCursorLocationFromPage: ActionCreator<
  ThunkAction<void, any, any, Action>
> = ({ pageX, pageY }: any) => {
  return (dispatch, getState) => {
    const location = gameSelectors.location(getState());
    const top = pageY - location.y;
    const left = pageX - location.x;
    dispatch(
      inputActions.cursorSetPosition({
        top,
        left,
      })
    );
  };
};

const ORIGINAL_HEIGHT = 400;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

export const resize: ActionCreator<ThunkAction<void, any, any, Action>> = ({
  width: reqWidth = null,
  height: reqHeight = null,
}: any = {}) => {
  let horizontalPadding = 0;
  let verticalPadding = 0;
  let width = reqWidth || window.innerWidth;
  let height = reqHeight || window.innerHeight;
  if (width / height > ORIGINAL_ASPECT_RATIO) {
    // Need to add padding to sides
    const widthOffset = width - height * ORIGINAL_ASPECT_RATIO;
    width -= widthOffset;
    horizontalPadding = widthOffset / 2;
  } else {
    // Need to add padding to top and bottom
    const heightOffset = height - width / ORIGINAL_ASPECT_RATIO;
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
    function setSize({ camera, renderer, dimensionSelector }: any) {
      if (camera && renderer) {
        const { width: w, height: h } = dimensionSelector
          ? dimensionSelector(getState())
          : { width, height };
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }

    if (
      sceneSelectors.currentSceneData(getState()) &&
      titleSelectors.isDone(getState())
    ) {
      sceneSelectors.currentScenesData(getState()).forEach((scene: any) => {
        const canvas = gameSelectors.canvas(getState());
        const sceneSelectors = castSelectors.forScene(scene).cache();

        const panoWebgl =
          sceneSelectors && sceneSelectors.pano && sceneSelectors.pano.webgl;
        if (panoWebgl) {
          setSize({
            ...panoWebgl,
            canvas,
          });
        }

        const hotspotWebgl =
          sceneSelectors &&
          sceneSelectors.hotspot &&
          sceneSelectors.hotspot.webgl;
        if (hotspotWebgl) {
          setSize({
            ...hotspotWebgl,
            canvas,
          });
        }

        const specialCanvas =
          sceneSelectors &&
          sceneSelectors.special &&
          sceneSelectors.special.canvas;
        if (specialCanvas) {
          setSize({
            canvas: specialCanvas,
          });
        }
      });
    } else {
      setSize(titleSelectors.renderElements(getState()));
    }
  };
};

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

export function cloudLoad(saveId: string) {
  return {
    type: CLOUD_LOAD,
    payload: saveId,
  };
}

export function localSave() {
  return {
    type: LOCAL_SAVE,
  };
}

export function localLoad(payload: string) {
  return {
    type: LOCAL_LOAD,
    payload,
  };
}

export function openSave() {
  return {
    type: CLOUD_SAVE_OPEN,
  };
}

export const loginEpic = createEpic((action$) =>
  action$.pipe(
    filter((action) => action.type === LOGIN_START),
    mergeMap(() =>
      from(
        firebase.default
          .auth()
          .signInWithPopup(new firebase.default.auth.GoogleAuthProvider())
          .then(({ user }: any) => user)
      )
    ),
    catchError((err: any) =>
      of({
        type: SAVE_ERROR,
        payload: err,
      })
    ),
    map((user) => ({ type: LOGGED_IN, payload: user }))
  )
);

export const logoutEpic = createEpic((action$) =>
  action$.pipe(
    filter((action) => action.type === LOGOUT_START),
    mergeMap(() => from(firebase.default.auth().signOut())),
    map((user) => ({ type: LOGGED_IN, payload: user }))
  )
);

export const newSaveGameEpic = createEpic((action$, state$) =>
  action$.pipe(
    filter(({ type }) => type === CLOUD_SAVE_NEW),
    mergeMap(async () => {
      try {
        const user = firebase.default.auth().currentUser;
        if (user) {
          const { uid } = user;
          const db = firebase.default.firestore();
          const saveRef = db.collection("saves");
          const saveData = {
            gamestates:
              gamestateSelectors.gamestates(state$.value).toJS() || [],
            currentSceneId: sceneSelectors.currentSceneId(state$.value) || null,
            previousSceneId:
              sceneSelectors.previousSceneId(state$.value) || null,
            createdAt: firebase.default.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.default.firestore.FieldValue.serverTimestamp(),
          };

          const response = await saveRef.add({
            ...saveData,
            roles: {
              [uid]: "owner",
            },
          });
          const { id } = response;
          return {
            type: SET_SAVE_ID,
            payload: id,
          };
        }
        return {
          type: SAVE_ERROR,
          payload: "User not logged in",
        };
      } catch (err) {
        return {
          type: SAVE_ERROR,
          payload: err,
        };
      }
    })
  )
);

export const cloudSaveEpic = createEpic((action$, state$) =>
  action$.pipe(
    filter(({ type }) => type === CLOUD_SAVE),
    mergeMap(async () => {
      try {
        const db = firebase.default.firestore();
        const id = gameSelectors.saveId(state$.value);
        const saveRef = db.collection("saves").doc(id);
        const saveData = {
          gamestates: gamestateSelectors.gamestates(state$.value).toJS() || [],
          currentSceneId: sceneSelectors.currentSceneId(state$.value) || null,
          previousSceneId: sceneSelectors.previousSceneId(state$.value) || null,
          updatedAt: firebase.default.firestore.FieldValue.serverTimestamp(),
        };
        await saveRef.set(saveData, { merge: true });
        return {
          type: SET_SAVE_ID,
          payload: id,
        };
      } catch (err) {
        return {
          type: SAVE_ERROR,
          payload: err,
        };
      }
    })
  )
);

export const loadSavesEpic = createEpic((action$, state$) =>
  action$.pipe(
    filter(({ type }) => type === SAVE_LOAD),
    mergeMap(async () => {
      try {
        const user = firebase.default.auth().currentUser;
        if (user) {
          const { uid } = user;
          const db = firebase.default.firestore();
          const saveDocs = await db
            .collection("saves")
            .where(`roles.${uid}`, "==", "owner")
            .get();
          return {
            type: SAVE_LOAD_SUCCESS,
            payload: saveDocs.docs.map((doc: any) => {
              const { updatedAt } = doc.data();
              return {
                saveId: doc.id,
                timestamp: updatedAt.toDate(),
              };
            }),
          };
        }
        return {
          type: SAVE_LOAD_ERROR,
          payload: "User not logged in",
        };
      } catch (err) {
        return {
          type: SAVE_LOAD_ERROR,
          payload: err,
        };
      }
    })
  )
);

export const loadGameEpic = createEpic((action$, state$) =>
  action$.pipe(
    filter(({ type }) => type === CLOUD_LOAD),
    mergeMap(async ({ payload: saveId }) => {
      try {
        const db = firebase.default.firestore();
        const saveDoc = await db
          .collection("saves")
          .doc(saveId || gameSelectors.saveId(state$.value))
          .get();
        const data = saveDoc.data();
        if (data) {
          const { currentSceneId, previousSceneId, gamestates } = data;
          return of([
            {
              type: SET_SAVE_ID,
              payload: saveDoc.id,
            },
            gamestateActions.inject(gamestates),
            sceneActions.goToScene(currentSceneId, true, previousSceneId),
          ]);
        }
        return of({
          type: "GAME_LOAD_ERROR",
          payload: "User not logged in",
        });
      } catch (err) {
        return of({
          type: "GAME_LOAD_ERROR",
          payload: err,
        });
      }
    }),
    mergeMap(from)
  )
);

export const browserSaveEpic = createEpic((action$, store$) =>
  // @ts-ignore
  action$
    .pipe(ofType(BROWSER_SAVE))
    .forEach(() => {
      const pano = (
        castSelectors.forScene(
          sceneSelectors.currentSceneData(store$.value)
        ) as any
      ).pano;
      storage.set("save", {
        gamestates: gamestateSelectors.gamestates(store$.value).toJS(),
        currentSceneId: sceneSelectors.currentSceneId(store$.value),
        previousSceneId: sceneSelectors.previousSceneId(store$.value),
        saveId: gameSelectors.saveId(store$.value),
        rotation: (pano && pano.object3D.rotation) || null,
      });
    })
    .catch((err: any) =>
      of({
        type: SAVE_ERROR,
        payload: err,
      })
    )
);

export const localSaveEpic = createEpic((action$, store$) =>
  // @ts-ignore
  action$
    .pipe(ofType(LOCAL_SAVE))
    .forEach(() => {
      const pano = (
        castSelectors.forScene(
          sceneSelectors.currentSceneData(store$.value)
        ) as any
      ).pano;
      const saveFile = {
        gamestates: gamestateSelectors.gamestates(store$.value).toJS(),
        currentSceneId: sceneSelectors.currentSceneId(store$.value),
        previousSceneId: sceneSelectors.previousSceneId(store$.value),
        saveId: gameSelectors.saveId(store$.value),
        rotation: (pano && pano.object3D.rotation) || null,
      };

      const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(saveFile)
      )}`;
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "morpheus.save.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    })
    .catch((err) =>
      of({
        type: SAVE_ERROR,
        payload: err,
      })
    )
);

export const localLoadEpic = createEpic((action$, store$) =>
  action$.pipe(
    ofType(LOCAL_LOAD),
    mergeMap(
      ({
        payload: { gamestates, currentSceneId, previousSceneId, rotation },
      }) =>
        from([
          gamestateActions.inject(gamestates),
          sceneActions.goToScene(currentSceneId, true, previousSceneId),
        ])
    ),
    catchError((err) =>
      of({
        type: "GAME_LOAD_ERROR",
        payload: err,
      })
    )
  )
);

export const browserLoad: ActionCreator<
  ThunkAction<boolean, any, any, Action>
> = () => {
  return (dispatch) => {
    // @ts-ignore
    const payload = storage.get("save");
    dispatch({
      type: BROWSER_LOAD,
      payload,
    });
    return !!payload;
  };
};

export const browserLoadEpic = createEpic((action$) =>
  action$.pipe(
    ofType(BROWSER_LOAD),
    filter(({ payload: data }) => !!data),
    mergeMap(
      ({
        payload: { gamestates, currentSceneId, previousSceneId, rotation },
      }) =>
        from([
          gamestateActions.inject(gamestates),
          sceneActions.goToScene(
            currentSceneId,
            true,
            previousSceneId,
            rotation
          ),
        ])
    )
  )
);

export const openSaveEpic = createEpic((action$) =>
  action$.pipe(
    ofType(CLOUD_SAVE_OPEN),
    map(() => ({
      type: SAVE_LOAD,
    }))
  )
);
