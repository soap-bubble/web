
import {
  actions as gamestateActions,
} from 'morpheus/gamestate';

const RED_PUSH_PIN = 2458;
const FUSCIA_PUSH_PIN = 2459;
const GREEN_PUSH_PIN = 2460;
const YELLOW_PUSH_PIN = 2461;
const BLUE_PUSH_PIN = 2462;
const AQUA_PUSH_PIN = 2463;

export const id = 1005;

function pushPin(dispatch, param, gamestateId, value) {
  if (param !== gamestateId) {
    if (value === 1) {
      dispatch(gamestateActions.updateGameState(gamestateId, 0));
    }
  } else {
    if (value !== 2) {
      dispatch(gamestateActions.updateGameState(gamestateId, 1));
    }
    if (value === 1) {
      dispatch(gamestateActions.updateGameState(gamestateId, 0));
    }
  }
}

export function execute({ param1 }, gamestates) {
  return (dispatch) => {
    const { value: pinRed } = gamestates.byId(RED_PUSH_PIN);
    const { value: pinFuscia } = gamestates.byId(FUSCIA_PUSH_PIN);
    const { value: pinGreen } = gamestates.byId(GREEN_PUSH_PIN);
    const { value: pinYellow } = gamestates.byId(YELLOW_PUSH_PIN);
    const { value: pinBlue } = gamestates.byId(BLUE_PUSH_PIN);
    const { value: pinAqua } = gamestates.byId(AQUA_PUSH_PIN);

    pushPin(dispatch, param1, RED_PUSH_PIN, pinRed);
    pushPin(dispatch, param1, FUSCIA_PUSH_PIN, pinFuscia);
    pushPin(dispatch, param1, GREEN_PUSH_PIN, pinGreen);
    pushPin(dispatch, param1, YELLOW_PUSH_PIN, pinYellow);
    pushPin(dispatch, param1, BLUE_PUSH_PIN, pinBlue);
    pushPin(dispatch, param1, AQUA_PUSH_PIN, pinAqua);
  };
}
