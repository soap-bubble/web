import 'morpheus/scene'
import 'morpheus/game'
import storeFactory from 'store'
import * as actions from './actions'
import './__fixtures__/matchers'
import { SCENE_LOAD_START, SCENE_SET_CURRENT_SCENE } from './actionTypes'
import {
  scene1010,
  scene1020,
  scene101004,
  scene5555,
  scene6666,
} from '../../service/__fixtures__/scenes'

jest.mock('morpheus/casts/modules')
jest.mock('morpheus/game/actions')
jest.mock('store/logger')
jest.mock('service/scene')
jest.mock('soapbubble/login')

const logger = require('store/logger')

const store = storeFactory()

describe('#fetchScene', () => {
  afterEach(() => {
    logger.reset()
  })

  test('SCENE_LOAD_START', () => {
    const p = store.dispatch(actions.fetchScene(1010))
    expect(logger.lastActionType()).toEqual(SCENE_LOAD_START)
    expect(logger.actions()).not.toContain(SCENE_SET_CURRENT_SCENE)
    return p.then(() => {
      expect(logger.actions()).toContain(
        SCENE_LOAD_START,
        SCENE_SET_CURRENT_SCENE,
      )
    })
  })

  test('returns scene data', () =>
    store.dispatch(actions.fetchScene(1010)).then(response => {
      expect(response).toEqual(scene1010)
    }))
})

describe('startAtScene', () => {
  it('returns scene', () =>
    store.dispatch(actions.startAtScene(1010)).then(response => {
      expect(response).toEqual(scene1010)
    }))
})

describe('goToScene', () => {
  beforeEach(() => {
    store.dispatch({ type: 'reset' })
  })

  it('returns scene', () =>
    store.dispatch(actions.goToScene(1020)).then(response => {
      expect(response).toEqual(scene1020)
    }))

  it('goes from one scene to another', () =>
    store
      .dispatch(actions.startAtScene(1010))
      .then(() => store.dispatch(actions.goToScene(101004)))
      .then(() => {
        expect(store.getState().scene).toHaveCurrentScene(scene101004)
        expect(store.getState().scene).toHavePreviousScene(scene1010)
      }))

  it('has up to three active scenes', () =>
    store
      .dispatch(actions.startAtScene(1010))
      .then(() => expect(store.getState().scene).toHaveActiveScenes(1))
      .then(() => store.dispatch(actions.goToScene(101004)))
      .then(() => expect(store.getState().scene).toHaveActiveScenes(2))
      .then(() => store.dispatch(actions.goToScene(1020)))
      .then(() => expect(store.getState().scene).toHaveActiveScenes(3))
      .then(() => store.dispatch(actions.goToScene(2270)))
      .then(() => expect(store.getState().scene).toHaveActiveScenes(4))
      .then(() => store.dispatch(actions.goToScene(5555)))
      .then(() => expect(store.getState().scene).toHaveActiveScenes(5))
      .then(() => store.dispatch(actions.goToScene(6666)))
      .then(() => expect(store.getState().scene).toHaveActiveScenes(5)))
})
