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

export default createLogger({
  stateTransformer: immutableConverter,
  actionTransformer: immutableConverter,
  errorTransformer: immutableConverter,
});
