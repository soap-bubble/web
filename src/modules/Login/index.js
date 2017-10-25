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
});

export default function ({
  rootSelector,
}) {
  return blueprint.construct({
    rootSelector,
  });
}
