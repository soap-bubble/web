import { actions as gamestateActions } from 'morpheus/gamestate'
import { actions as sceneActions } from 'morpheus/scene'
import { Hotspot, Gamestate } from 'morpheus/casts/types'
import { Gamestates } from '../isActive'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

const LIGHT_IND = 864
// const SERUM_A = 886;
// const INFLUX_A_NUMS = 887;
// const INFLUX_B_NUMS = 888;
// const INFLUX_C_NUMS = 889;
const INFLUXOR_MOVIE_COUNT = 876

const EFFECT_TRIGGER = 999

let numOfIngredients = 0

export const id = 1001

function incrementState(gs: Gamestate): number {
  const { maxValue, minValue, stateWraps } = gs
  let { value } = gs
  value += 1
  if (value > maxValue) {
    if (stateWraps) {
      value = minValue
    } else {
      value = maxValue
    }
  }
  return value
}

export type Execute = (
  hotspot: Hotspot,
  gamestates: Gamestates
) => ThunkAction<void, unknown, unknown, Action>;

export const execute: Execute = ({ param1 }, gamestates) => {
  return dispatch => {
    const indicatorId = LIGHT_IND + (param1 - 1)
    const indicator = gamestates.byId(indicatorId)
    const nextIndicatorValue = incrementState(indicator)
    dispatch(gamestateActions.updateGameState(indicatorId, nextIndicatorValue))

    const lightOn = nextIndicatorValue === 1

    if (lightOn) {
      numOfIngredients++
    } else {
      numOfIngredients--
    }

    const effectTrigger = gamestates.byId(EFFECT_TRIGGER)
    dispatch(
      gamestateActions.updateGameState(
        EFFECT_TRIGGER,
        incrementState(effectTrigger),
      ),
    )

    if (numOfIngredients === 3) {
      numOfIngredients = 0
      const movieCount = gamestates.byId(INFLUXOR_MOVIE_COUNT)
      dispatch(
        gamestateActions.updateGameState(
          INFLUXOR_MOVIE_COUNT,
          incrementState(movieCount),
        ),
      )

      dispatch(sceneActions.goToScene(306064, false))
    }
  }
}
