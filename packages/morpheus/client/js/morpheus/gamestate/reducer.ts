import {
  omit,
  mapKeys,
} from 'lodash';
import createReducer from 'utils/createReducer';
import Immutable from 'immutable';
import {
  UPDATE,
  LOAD_COMPLETE,
  INJECT,
} from './actionTypes';

const reducer = createReducer('gamestate', Immutable.fromJS({
  idMap: {},
}), {
  [UPDATE](gamestate, { payload: value, meta: gamestateId }) {
    const curValue = gamestate.getIn(['idMap', gamestateId, 'value']);
    if (curValue !== value) {
      return gamestate.setIn(['idMap', gamestateId, 'value'], value);
    }
    return gamestate;
  },
  [LOAD_COMPLETE](gamestate, { payload: gamestates }) {
    return gamestates.reduce((newState: any, gs: any) =>
      newState.setIn(
        ['idMap', gs.stateId],
        // @ts-ignore
        new Immutable.Map(omit(gs, 'stateId')),
      ), gamestate,
    );
  },
  [INJECT](gamestate, { payload }) {
    // @ts-ignore
    const immutablePayload = new Immutable.Map(payload);
    const patchedPayload = immutablePayload
    // @ts-ignore
      .mapEntries(([k, v]) => [parseInt(k, 10), new Immutable.Map(v)]);
    return gamestate.set('idMap', patchedPayload);
  },
});

export default reducer;
