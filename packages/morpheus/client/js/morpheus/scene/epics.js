import createEpic from 'utils/createEpic';
import socketPromise from 'utils/socket';
import {
  actions as gameActions,
} from 'morpheus/game';
// import {
//   actions as castActions,
// } from 'morpheus/casts';
// import {
//   fetch,
// }

import {
// CAST_ON_STAGE,
  SCENE_DO_ENTER,
  SCENE_DO_ENTERING,
} from './actionTypes';

createEpic(action$ => action$
  .ofType(SCENE_DO_ENTER)
  .forEach((action) => {
    socketPromise().then((socket) => {
      if (socket.channel) {
        socket.emit(socket.channel, action);
      }
    });
  }),
);

createEpic(action$ => action$
  .ofType(SCENE_DO_ENTERING)
  .filter(({ payload: { sceneId } }) => !!sceneId && sceneId !== 1)
  .map(gameActions.browserSave),
);

// createEpic(action$ => action$
//   .ofType(CAST_ON_STAGE)
//   .forEach(({ meta: { scene }}) => {
//
//   }));
