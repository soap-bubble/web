import {
  omit,
} from 'lodash';
import createReducer from 'utils/createReducer';
import Immutable from 'immutable';
import {
  UPDATE,
  LOAD_COMPLETE,
} from './actionTypes';

const reducer = createReducer('gamestate', Immutable.fromJS({
  idMap: {},
}), {
  [UPDATE](gamestate, { payload: value, meta: gamestateId }) {
    return gamestate.setIn(['idMap', gamestateId, 'value'], value);
  },
  [LOAD_COMPLETE](gamestate, { payload: gamestates }) {
    return gamestates.reduce((newState, gs) =>
      newState.setIn(
        ['idMap', gs.stateId],
        new Immutable.Map(omit(gs, 'stateId')),
      ), gamestate,
    );
  },
});

export default reducer;
