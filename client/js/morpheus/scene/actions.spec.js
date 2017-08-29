import 'morpheus/scene';
import store from 'store';
import * as actions from './actions';
import './matchers';
import {
  SCENE_LOAD_START,
  SCENE_SET_CURRENT_SCENE,
} from './actionTypes';
import { scene1010, scene1020, scene101004 } from '../../service/__fixtures__/scenes';

jest.mock('morpheus/casts/modules');
jest.mock('morpheus/game/actions');
jest.mock('store/logger');
jest.mock('service/scene');

const logger = require('store/logger');

describe('#fetchScene', () => {
  afterEach(() => {
    logger.reset();
  });

  test('SCENE_LOAD_START', () => {
    const p = store.dispatch(actions.fetchScene(1010));
    expect(logger.lastActionType()).toEqual(SCENE_LOAD_START);
    expect(logger.actions()).not.toContain(SCENE_SET_CURRENT_SCENE);
    return p
    .then(() => {
      expect(logger.actions()).toContain(SCENE_LOAD_START, SCENE_SET_CURRENT_SCENE);
    });
  });


  test('returns scene data', () => store.dispatch(actions.fetchScene(1010))
    .then((response) => {
      expect(response)
        .toEqual(scene1010);
    }));
});

describe('startAtScene', () => {
  it('returns scene', () => store.dispatch(actions.startAtScene(1010))
    .then((response) => {
      expect(response)
        .toEqual(scene1010);
    }),
  );
});

describe('goToScene', () => {
  it('returns scene', () => store.dispatch(actions.goToScene(1020))
    .then((response) => {
      expect(response)
        .toEqual(scene1020);
    }),
  );
});

test('changeScene', () => {
  it('goes from one scene to another', () =>
    store.dispatch(actions.goToScene(1010))
      .then(store.dispatch(actions.goToScene(101004)))
      .then(() => {
        expect(store.getState().scene).toHaveCurrentScene(scene101004);
        expect(store.getState().scene).toHavePreviousScene(scene1010);
      }));
});
test('exitScene');
test('enterScene');
test('doEntering');
test('doExiting');
test('doOnStageAction');
test('setBackgroundScene');
