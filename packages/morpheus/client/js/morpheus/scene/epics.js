import createEpic from 'utils/createEpic'
import { filter, map, tap } from 'rxjs/operators'
import socketPromise from 'utils/socket'
import { actions as gameActions } from 'morpheus/game'
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
} from './actionTypes'

createEpic((action$) =>
  action$.pipe(
    filter((action) => action.type === SCENE_ENTER_DONE),
    tap((action) => {
      socketPromise().then((socket) => {
        if (socket.channel) {
          socket.emit(socket.channel, action)
        }
      })
    })
  )
)

createEpic((action$) =>
  action$.pipe(
    filter((action) => action.type === SCENE_DO_ENTERING),
    filter(({ payload: { sceneId } }) => !!sceneId && sceneId !== 1),
    map(gameActions.browserSave)
  )
)

// createEpic(action$ => action$
//   .ofType(CAST_ON_STAGE)
//   .forEach(({ meta: { scene }}) => {
//
//   }));
