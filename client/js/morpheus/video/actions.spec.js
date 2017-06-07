import store from 'store';
import * as actions from './actions';

jest.mock('store/logger');

test('sanity', () => {
  const cast = {
    __t: 'Foo',
    looping: false,
  };
  const videoEl = {};
  expect(store.getState().video.foo).toEqual(undefined);
  store.dispatch(actions.videoLoad('foo', cast, videoEl));
  expect(store.getState().video.foo).toEqual({
    url: 'foo',
    el: videoEl,
    state: 'loading',
    type: cast.__t,
    looping: cast.looping,
  });
  store.dispatch(actions.videoLoadComplete('foo', videoEl));
  expect(store.getState().video.foo).toEqual({
    url: 'foo',
    el: videoEl,
    state: 'loaded',
    type: cast.__t,
    looping: cast.looping,
  });
});
