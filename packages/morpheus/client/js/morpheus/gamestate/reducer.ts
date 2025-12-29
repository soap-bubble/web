import { omit, mapKeys } from 'lodash'
import createReducer from 'utils/createReducer'
import Immutable from 'immutable'
import { UPDATE, LOAD_COMPLETE, INJECT } from './actionTypes'

const reducer = createReducer(
  'gamestate',
  Immutable.fromJS({
    idMap: {},
  }),
  {
    [UPDATE](gamestate, { payload: value, meta: gamestateId }) {
      const curValue = gamestate.getIn(['idMap', gamestateId, 'value'])
      if (curValue !== value) {
        return gamestate.setIn(['idMap', gamestateId, 'value'], value)
      }
      return gamestate
    },
    [LOAD_COMPLETE](gamestate, { payload: gamestates }) {
      return gamestates.reduce(
        (newState: any, gs: any) =>
          newState.setIn(
            ['idMap', gs.stateId],
            Immutable.Map(omit(gs, 'stateId'))
          ),
        gamestate
      )
    },
    [INJECT](gamestate, { payload }) {
      const immutablePayload = Immutable.Map<
        number,
        Immutable.Map<string, any>
      >(payload)
      const patchedPayload = immutablePayload.mapEntries(([k, v]) => [
        parseInt(k.toString(), 10),
        Immutable.Map(v),
      ])
      return gamestate.set('idMap', patchedPayload as any)
    },
  }
)

export default reducer
