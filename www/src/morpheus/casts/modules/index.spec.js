import {
  actions,
} from 'morpheus/casts';
import {
  actions as sceneActions,
} from 'morpheus/scene';
import 'morpheus/scene/reducer';
import storeFactory from 'store';

jest.mock('store/logger');
jest.mock('service/scene');
jest.mock('utils/video');
jest.mock('service/image');
jest.mock('utils/canvas');

const store = storeFactory();

describe('sanity', () => {
  beforeAll(() => {
    store.dispatch({ type: 'reset' });
  });
  it('enter scenes', () => store.dispatch(sceneActions.fetchScene(1010))
      .then((scene) => {
        store.dispatch({
          type: 'SCENE_DO_ENTERING',
          payload: scene,
        });
        return store.dispatch(actions.lifecycle.doEnter(scene));
      })
      .then(() => {
        expect(Object.keys(store.getState().casts.cache[1010])).toEqual(expect.arrayContaining(['pano', 'hotspot']));
      }));
});
