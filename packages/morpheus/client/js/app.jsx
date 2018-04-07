/* eslint-env browser */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import qs from 'query-string';
import keycode from 'keycode';
import Tween from 'tween';

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
  actions as titleActions,
} from 'morpheus/title';
import { Game, actions as gameActions } from 'morpheus/game';
import socketPromise from 'utils/socket';
import {
  login,
} from 'soapbubble';
import storeFactory from 'store';

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
  store.dispatch(gameActions.setCursor(0));
  if (qp.scene) {
    store.dispatch(gamestateActions.fetchInitial())
      .then(() => store.dispatch(sceneActions.startAtScene(qp.scene)));
  } else {
    store.dispatch(titleActions.start());
  }
  render(
    <Provider store={store}>
      <Game />
    </Provider>,
    document.getElementById('root'),
  );
  window.addEventListener('resize', () => {
    resizeToWindow();
  });

  if (qp.channel) {
    socketPromise.then((socket) => {
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
      const scene = sceneSelectors.currentSceneData(store.getState());
      store.dispatch(castActions.forScene(scene).special.update(scene));
      store.dispatch(castActions.forScene(scene).controlledMovie.update(scene));
    };

    window.getGameState = function getgameState(gamestateId) {
      const state = gamestateSelectors.forState(store.getState()).byId(gamestateId);
      return {
        vale: state.value,
        maxValue: state.maxValue,
        minValue: state.minValue,
        stateId: state.stateId,
        stateWraps: state.stateWraps,
      };
    };
  }
};
