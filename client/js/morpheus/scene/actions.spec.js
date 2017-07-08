import store from 'store';
import * as actions from './actions';
import {
  SCENE_LOAD_START,
  SCENE_SET_CURRENT_SCENE,
} from './actionTypes';
import { scene1010 } from '../../service/__fixtures__/scenes';

jest.mock('store/logger');
jest.mock('service/scene');

const logger = require('store/logger');

describe('#fetchScene', () => {
  afterEach(() => {
    logger.reset();
  });

  test('returns scene data', () => store.dispatch(actions.fetchScene(1010))
    .then((response) => {
      expect(response)
        .toEqual(scene1010);
    }));

  test('SCENE_LOAD_START', () => {
    const p = store.dispatch(actions.fetchScene(1010));
    expect(logger.lastActionType()).toEqual(SCENE_LOAD_START);
    return p;
  });

  test('SCENE_SET_CURRENT_SCENE', () => {
    const p = store.dispatch(actions.fetchScene(1010))
      .then(() => {
        expect(logger.actions()).toContain(SCENE_SET_CURRENT_SCENE);
      });
    expect(logger.actions()).not.toContain(SCENE_SET_CURRENT_SCENE);
    return p;
  });
});

test('changeScene');
test('exitScene');
test('enterScene');
test('doEntering');
test('doExiting');
test('doOnStageAction');
test('setBackgroundScene');
