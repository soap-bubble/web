import builder from 'service-builder';
import selectorFactory from './selectors';
import reducer from './reducer';
import actions from './actions';
import PopOver from './containers/PopOver';
import Google from './containers/Google';

const blueprint = builder({
  actions: $ => $(actions),
  reducer: () => reducer,
  PopOver: $ => $(PopOver),
  Google: $ => $(Google),
});

export default function ({
  rootSelector,
}) {
  return blueprint.construct({
    selectors: selectorFactory(rootSelector),
  });
}
