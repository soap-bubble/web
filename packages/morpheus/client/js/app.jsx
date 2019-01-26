/* eslint-env browser */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import qs from 'query-string';
import keycode from 'keycode';
// Loads all modules
import 'morpheus';

// Then pull out the stuff we need
import {
  selectors as inputSelectors,
  actions as inputActions,
} from 'morpheus/input';
import { actions as castActions } from 'morpheus/casts';
import { selectors as sceneSelectors, actions as sceneActions } from 'morpheus/scene';
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
 } from 'morpheus/gamestate';
import {
  data as titleSceneData,
  actions as titleActions,
} from 'morpheus/title';
import { Game, actions as gameActions } from 'morpheus/game';
import socketPromise from 'utils/socket';
import {
  login,
} from 'soapbubble';
import storeFactory from 'store';

import '@soapbubble/style/dist';
import '../css/main.scss';

const qp = qs.parse(location.search);
const store = storeFactory();

function resizeToWindow() {
  store.dispatch(gameActions.resize({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
}

window.onload = () => {
  store.dispatch(gameActions.resize({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  store.dispatch(gameActions.createUIOverlay());
  store.dispatch(gameActions.setCursor(10000));
  store.dispatch(gamestateActions.fetchInitial())
    .then(() => {
      const savedGame = store.dispatch(gameActions.browserLoad());
      if (qp.scene) {
        store.dispatch(sceneActions.startAtScene(qp.scene));
      } else if (!savedGame) {
        store.dispatch(sceneActions.runScene(titleSceneData))
          .then(() => store.dispatch(titleActions.start()));
      }
    });

  const root = document.getElementById('root');
  render(
    <Provider store={store}>
      <Game className="game" />
    </Provider>,
    root,
  );
  window.addEventListener('resize', resizeToWindow);

  if (qp.channel) {
    socketPromise().then((socket) => {
      socket.emit('letsplay', qp.channel);
      socket.on('CREATE_CHANNEL', (uChannel) => {
        socket.channel = uChannel;
        socket.on(uChannel, (action, cb) => {
          if (typeof cb === 'function') {
            return store.dispatch({
              ...action,
              cb,
            });
          }
          return store.dispatch(action);
        });
      });
    });
  }

  document.addEventListener('keydown', (event) => {
    const keyName = keycode.names[event.which];
    if (!inputSelectors.isKeyPressed(keyName)(store.getState())) {
      store.dispatch(inputActions.keyDown(keyName));
    }
  });

  document.addEventListener('keyup', (event) => {
    store.dispatch(inputActions.keyUp(keycode.names[event.which]));
  });

  store.dispatch(login.actions.init());

  if (process.env.NODE_ENV !== 'production') {
    window.updateGameState = function updateGameState(gamestateId, value) {
      store.dispatch(gamestateActions.updateGameState(gamestateId, value));
    };

    window.getGameState = function getgameState(gamestateId) {
      const state = gamestateSelectors.forState(store.getState()).byId(gamestateId);
      return {
        value: state.value,
        maxValue: state.maxValue,
        minValue: state.minValue,
        stateId: state.stateId,
        stateWraps: state.stateWraps,
      };
    };
  }
};

if (process.env.ELECTRON_ENV) {
  if ('serviceWorker' in navigator) {
    const fileUrl = document.location.href.substring(0, document.location.href.length - 10);
    const swOptions = { scope: './GameDB/' };
    navigator.serviceWorker.register('sw.js', swOptions).then((reg) => {
      if (reg.installing) {
        console.log('Service worker installing');
      } else if (reg.waiting) {
        console.log('Service worker installed');
      } else if (reg.active) {
        console.log('Service worker active');
      }
    }).catch((error) => {
      // registration failed
      console.log(`Registration failed with ${error}`);
    });
  }
}

if (window.hasOwnProperty('cordova')) {
  document.addEventListener('pause', () => {
    const scenes = sceneSelectors.loadedScenes(store.getState());

    scenes.forEach((scene) => {
      store.dispatch(castActions.lifecycle.doPause(scene));
    });
  });
  document.addEventListener('resume', () => {
    const scenes = sceneSelectors.loadedScenes(store.getState());

    scenes.forEach((scene) => {
      store.dispatch(castActions.lifecycle.doResume(scene));
    });
  });
}
