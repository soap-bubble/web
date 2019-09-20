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
  stateTransformer: immutableConverter,
  actionTransformer: immutableConverter,
  errorTransformer: immutableConverter,
  predicate: (getState, action) => false, // action && action.logging !== false,
});
