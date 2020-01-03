import createLogger from 'redux-logger';
import {
  mapValues,
  isFunction,
} from 'lodash';

function immutableConverter(state) {
  return mapValues(state, (value) => {
    if (value && isFunction(value.toJS)) {
      return value.toJS();
    }
    return value;
  });
}
//  && (action.type === 'GAMESTATE_UPDATE' || action.type.indexOf('CAST') === 0)
export default createLogger({
  // @ts-ignore
  stateTransformer: immutableConverter,
  // @ts-ignore
  actionTransformer: immutableConverter,
  // @ts-ignore
  errorTransformer: immutableConverter,
  // @ts-ignore
  predicate: (getState, action) => false, // action && action.logging !== false,
});
