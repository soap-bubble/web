import store from 'store';
import {
  actions,
} from 'morpheus/casts';
import 'morpheus/scene/reducer';
// eslint-disable-next-line import/no-named-as-default, import/no-named-as-default-member
import mockModules from 'morpheus/casts/modules/index';
// eslint-disable-next-line global-require
jest.mock('morpheus/casts/modules/index', () => require('morpheus/casts/modules/__mocks_/index'));
jest.mock('store/logger');

describe('casts actions', () => {
  afterAll(() => {
    mockModules.reset();
  });
  ['doEnter', 'onStage', 'doExit'].forEach((testAction, index) => {
    describe(testAction, () => {
      it('is only called when applies() => true', () => {
        const enterTestState = {};
        const fakeDelegate = {
          applies: jest.fn(() => true),
          [testAction]: jest.fn(() => () => Promise.resolve(enterTestState)),
        };

        mockModules.default.inject('pano', {
          delegate() {
            return fakeDelegate;
          },
        });
        return store.dispatch(actions.lifecycle[testAction]({
          sceneId: index,
        }))
          .then(() => {
            expect(fakeDelegate.applies).toBeCalled();
            expect(fakeDelegate[testAction]).toBeCalled();
            expect(store.getState().casts.cache[index].pano).toEqual(enterTestState);
          });
      });
      it('is not called when applies() => false', () => {
        const enterTestState = {};
        const fakeDelegate = {
          applies: jest.fn(() => false),
          [testAction]: jest.fn(() => () => Promise.resolve(enterTestState)),
        };

        mockModules.default.inject('hotspot', {
          delegate() {
            return fakeDelegate;
          },
        });
        return store.dispatch(actions.lifecycle[testAction]({
          sceneId: index,
        }))
          .then(() => {
            expect(fakeDelegate.applies).toBeCalled();
            expect(fakeDelegate[testAction]).not.toBeCalled();
            expect(store.getState().casts.cache[index].hotspot).not.toEqual(enterTestState);
          });
      });
    });
  });
});
