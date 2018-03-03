import bunyan from 'bunyan';
import { createSelector } from 'reselect';

const logger = bunyan.createLogger({ name: 'soapbubble-bot-actions' });

const notBotSelector = message => !message.author.bot;
const contentSelector = message => message.content;
const contentIncludes = text => message => message.content.includes(text);
const numberFromContent = createSelector(
  contentSelector,
  content => {
    const num = content.match(/[0-9]+/);
    if (num) return Number(num[0]);
    return -1;
  },
);

const numbersFromContent = createSelector(
  contentSelector,
  content => {
    const num = content.match(/[0-9]+/g);
    if (num) return num.map(n => Number(n));
    return [];
  },
);

const line = num => createSelector(
  contentSelector,
  content => content.split('\n')[num],
);

export const hotspotLook = {
  selector: createSelector(
    contentIncludes('look'),
    (notBot, look) => notBot && look,
  ),
  action(message, socket, cb) {
    socket.emit({
      type: 'AUTO_HOTSPOT_LOOK',
      payload: numberFromContent(message),
    }, cb);
  }
};

export const hotspotGo = {
  selector: createSelector(
    notBotSelector,
    contentIncludes('go'),
    (notBot, go) => notBot && go,
  ),
  action(message, socket, cb) {
    socket.emit({
      type: 'AUTO_HOTSPOT_GO',
      payload: numberFromContent(message),
    }, cb);
  },
};

export const gamestateSave = {
  selector: createSelector(
    notBotSelector,
    contentIncludes('save'),
    (notBot, save) => notBot && save,
  ),
  action(message, socket, cb) {
    socket.emit({
      type: 'AUTO_SAVE',
    }, cb);
  }
};

export const gamestateLoad = {
  selector: createSelector(
    notBotSelector,
    contentIncludes('load'),
    (notBot, load) => notBot && load,
  ),
  action(message, socket, cb) {
    socket.emit({
      type: 'AUTO_LOAD',
      payload: JSON.parse(line(1)(message)),
    }, cb);
  }
};

export const sceneWait = {
  selector: createSelector(
    notBotSelector,
    contentIncludes('wait'),
    (notBot, wait) => notBot && wait,
  ),
  action(message, socket, cb) {
    socket.emit({
      type: 'AUTO_SCENE_WAIT',
      payload: numberFromContent(message),
    }, cb);
  }
}

export const gamestateUpdate = {
  selector: createSelector(
    notBotSelector,
    contentIncludes('update'),
    (notBot, wait) => notBot && wait,
  ),
  action(message, socket, cb) {
    const [ stateId, value ] = numbersFromContent(message);
    socket.emit({
      type: 'AUTO_GAMESTATE_UPDATE',
      payload: {
        stateId,
        value,
      },
    }, cb);
  }
}

export const slide = {
  selector: createSelector(
    notBotSelector,
    contentIncludes('slide'),
    (notBot, slide) => notBot && slide,
  ),
  action(message, socket, cb) {
    const [ targetState, targetValue ] = numbersFromContent(message);
    socket.emit({
      type: 'AUTO_SLIDE',
      payload: {
        targetState,
        targetValue,
      },
    }, cb);
  }
}

export const pingPong = {
  selector(message) {
    return message.content === 'ping';
  },
  action(message, socket, cb) {
    message.reply('pong');
    cb();
  },
};

export default function (socket) {
  return (message, cb) => {
    [
      hotspotLook,
      hotspotGo,
      gamestateSave,
      gamestateLoad,
      sceneWait,
      slide,
      gamestateUpdate,
      pingPong,
    ].forEach(({ selector, action }) => {
      if (selector(message)) {
        action(message, socket, (...args) => {
          if (cb) cb(...args);
        });
      }
    });
  };
}
