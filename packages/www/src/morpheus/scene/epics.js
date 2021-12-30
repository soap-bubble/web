import createEpic from "utils/createEpic";
import { ofType } from "redux-observable";
import { filter, map } from "rxjs/operators";
import socketPromise from "utils/socket";
import { actions as gameActions } from "morpheus/game";
// import {
//   actions as castActions,
// } from 'morpheus/casts';
// import {
//   fetch,
// }

import {
  // CAST_ON_STAGE,
  SCENE_ENTER_DONE,
  SCENE_DO_ENTERING,
} from "./actionTypes";

createEpic((action$) =>
  action$.pipe(ofType(SCENE_ENTER_DONE)).forEach((action) => {
    socketPromise().then((socket) => {
      if (socket.channel) {
        socket.emit(socket.channel, action);
      }
    });
  })
);

createEpic((action$) =>
  action$.pipe(
    ofType(SCENE_DO_ENTERING),
    filter(({ payload: { sceneId } }) => !!sceneId && sceneId !== 1),
    map(gameActions.browserSave)
  )
);

// createEpic(action$ => action$
//   .ofType(CAST_ON_STAGE)
//   .forEach(({ meta: { scene }}) => {
//
//   }));
