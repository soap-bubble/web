import builder from 'service-builder';
import epics from './epics';
import selectorFactory from './selectors';
import reducer from './reducer';
import actions from './actions';
import PopOver from './containers/PopOver';
import Google from './containers/Google';

const blueprint = builder({
  selectors: rootSelector => selectorFactory(rootSelector),
  epics: $ => $(epics),
  actions: $ => $(actions),
  reducer: () => reducer,
  PopOver: $ => $(PopOver),
  Google: $ => $(Google),
  promiseLoggedIn: loggedInDefer => loggedInDefer.promise,
  loggedInDefer: () => {
    let resolve;
    let reject;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
    return {
      resolve,
      reject,
      promise,
    };
  },
});

export default function ({
  rootSelector,
  googleConfigProvider,
}) {
  return blueprint.construct({
    rootSelector,
    googleConfigProvider,
  });
}
