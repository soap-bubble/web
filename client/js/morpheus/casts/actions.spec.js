import store from 'store';
import {
  actions,
} from 'morpheus/casts';
import {
  actions as sceneActions,
} from 'morpheus/scene';

jest.mock('store/logger');
jest.mock('service/scene');
jest.mock('utils/video');

describe('sanity', () => {
  it('enter scenes', () => {
    return store.dispatch(sceneActions.fetchScene(1010))
      .then(scene => {
        store.dispatch({
          type: 'SCENE_DO_ENTERING',
          payload: scene,
        });
        return store.dispatch(actions.doEnter(scene))
      })
      .then(() => {
        expect(Object.keys(store.getState().casts.cache[1010])).toEqual(expect.arrayContaining(['pano', 'hotspot']));
      });
  });
});
