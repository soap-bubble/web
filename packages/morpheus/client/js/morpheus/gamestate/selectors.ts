import { createSelector } from 'reselect'
import { TEST_TYPES } from '../constants'
import { Gamestate } from 'morpheus/casts/types'

export const root = (state: any) => state.gamestate
export const gamestates = createSelector(
  root,
  r => r.get('idMap'),
)

export function castEnabled({ comparators }: any) {
  return createSelector(
    gamestates,
    _gamestates =>
      comparators.every(({ gameStateId, testType, value }: any) => {
        const gs = _gamestates.get(gameStateId)
        const gsValue = gs.get('value')

        switch (TEST_TYPES[testType]) {
          case 'EqualTo':
            return value === gsValue
          case 'NotEqualTo':
            return value !== gsValue
          case 'GreaterThan':
            return value > gsValue
          case 'LessThan':
            return value < gsValue
          default:
            return false
        }
      }),
  )
}

const gamestateMap = (state: any) => state.gamestate.get('idMap')
export const forState = createSelector(
  gamestateMap,
  gs => ({
    byId(id: number) {
      const gamestate = gs.get(id)

      if (!gamestate) {
        throw new Error(`VariableNotFound ${id}`)
      }

      return {
        get value() {
          return gamestate.get('value')
        },
        get maxValue() {
          return gamestate.get('maxValue')
        },
        get minValue() {
          return gamestate.get('minValue')
        },
        get stateWraps() {
          return gamestate.get('stateWraps')
        },
        get stateId() {
          return id
        },
      } as Gamestate
    },
  }),
)
