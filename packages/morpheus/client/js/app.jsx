/* eslint-env browser */
import React from 'react'
import { initializeApp } from 'firebase/app'
import 'firebase/auth'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { once } from 'lodash'
import qs from 'query-string'
import keycode from 'keycode'
// Loads all modules
import 'morpheus'

// Then pull out the stuff we need
import {
  selectors as inputSelectors,
  actions as inputActions,
} from 'morpheus/input'
import { actions as castActions } from 'morpheus/casts'
import {
  selectors as sceneSelectors,
  actions as sceneActions,
} from 'morpheus/scene'
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate'
import { data as titleSceneData, actions as titleActions } from 'morpheus/title'
import { Game, actions as gameActions } from 'morpheus/game'
import socketPromise from 'utils/socket'
import storeFactory from 'store'
import '../css/main.scss'

const qp = qs.parse(location.search)
const store = storeFactory()

function resizeToWindow() {
  store.dispatch(
    gameActions.resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }),
  )
}

window.onload = () => {
  function init() {
    store.dispatch(
      gameActions.resize({
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    )
    store.dispatch(gameActions.createUIOverlay())
    store.dispatch(gameActions.setCursor(10000))
    store.dispatch(gamestateActions.fetchInitial()).then(() => {
      let savedGame
      if (qp.reload && !qp.scene) {
        savedGame = store.dispatch(gameActions.browserLoad())
      }
      if (!qp.reload && qp.scene) {
        store.dispatch(sceneActions.startAtScene(qp.scene))
      }
      if (!qp.scene && !savedGame) {
        store
          .dispatch(sceneActions.runScene(titleSceneData))
          .then(() => store.dispatch(titleActions.start()))
      }
    })

    const root = document.getElementById('root')
    window.addEventListener('resize', resizeToWindow)
    render(
      <Provider store={store}>
        <Game className="game" />
      </Provider>,
      root,
    )

    if (qp.channel) {
      socketPromise().then(socket => {
        socket.emit('letsplay', qp.channel)
        socket.on('CREATE_CHANNEL', uChannel => {
          socket.channel = uChannel
          socket.on(uChannel, (action, cb) => {
            if (typeof cb === 'function') {
              return store.dispatch({
                ...action,
                cb,
              })
            }
            return store.dispatch(action)
          })
        })
      })
    }

    document.addEventListener('keydown', event => {
      const keyName = keycode.names[event.which]
      if (!inputSelectors.isKeyPressed(keyName)(store.getState())) {
        store.dispatch(inputActions.keyDown(keyName))
      }
    })

    document.addEventListener('keyup', event => {
      store.dispatch(inputActions.keyUp(keycode.names[event.which]))
    })

    if (process.env.NODE_ENV !== 'production') {
      window.updateGameState = function updateGameState(gamestateId, value) {
        store.dispatch(gamestateActions.updateGameState(gamestateId, value))
      }

      window.getGameState = function getgameState(gamestateId) {
        const state = gamestateSelectors
          .forState(store.getState())
          .byId(gamestateId)
        return {
          value: state.value,
          maxValue: state.maxValue,
          minValue: state.minValue,
          stateId: state.stateId,
          stateWraps: state.stateWraps,
        }
      }
    }
  }
  let isInit = false
  let triedAnonymousLogin = false
  firebase.auth().onAuthStateChanged(async user => {
    if (user) {
      store.dispatch(gameActions.loggedIn(user))
      if (!isInit) {
        isInit = true
        init()
      }
    } else if (!triedAnonymousLogin) {
      triedAnonymousLogin = true
      try {
        await firebase.auth().signInAnonymously()
      } catch (error) {
        triedAnonymousLogin = false
        console.error(error)
      }
    }
  })
}

if (window.hasOwnProperty('cordova')) {
  document.addEventListener('pause', () => {
    const scenes = sceneSelectors.loadedScenes(store.getState())

    scenes.forEach(scene => {
      store.dispatch(castActions.lifecycle.doPause(scene))
    })
  })
  document.addEventListener('resume', () => {
    const scenes = sceneSelectors.loadedScenes(store.getState())

    scenes.forEach(scene => {
      store.dispatch(castActions.lifecycle.doResume(scene))
    })
  })
}
