import { actions as gamestateActions } from 'morpheus/gamestate'
import { Hotspot } from 'morpheus/casts/types'
import { Gamestates } from '../isActive'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

const TAP_ONE = 2123
const TAP_FRAME_1 = 2111
const TAP_HELP = 2110
const FRAME_INC = 2122

export const id = 1000

function getGamestateId(param1: number): number {
  return TAP_ONE + param1 - 1
}

export function enabled({ param1 }: Hotspot, gamestates: Gamestates): boolean {
  const tapOnWallState = gamestates.byId(getGamestateId(param1))

  const { value } = tapOnWallState

  return value !== 0
}

export type Execute = (
  hotspot: Hotspot,
  gamestates: Gamestates
) => ThunkAction<void, unknown, unknown, Action>

export const execute: Execute = ({ param1 }, gamestates) => {
  return dispatch => {
    const tapOnWallState = gamestates.byId(getGamestateId(param1))
    dispatch(gamestateActions.updateGameState(tapOnWallState.stateId, 0))

    const frameIncVar = gamestates.byId(FRAME_INC)
    const nextFrame = frameIncVar.value
    dispatch(gamestateActions.updateGameState(FRAME_INC, nextFrame + 1))

    const tapFrameVar = gamestates.byId(TAP_FRAME_1 + nextFrame)
    dispatch(gamestateActions.updateGameState(tapFrameVar.stateId, param1))
  }
}
