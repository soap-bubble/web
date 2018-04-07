import createEpic from 'utils/createEpic';
import socketPromise from 'utils/socket';

import {
  SCENE_DO_ENTER,
} from './actionTypes';

createEpic(action$ => action$
  .ofType(SCENE_DO_ENTER)
  .forEach((action) => {
    socketPromise.then((socket) => {
      if (socket.channel) {
        socket.emit(socket.channel, action);
      }
    });
  }),
);
