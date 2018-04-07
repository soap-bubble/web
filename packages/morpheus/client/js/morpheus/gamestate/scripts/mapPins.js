
import {
  actions as gamestateActions,
} from 'morpheus/gamestate';

const RED_PUSH_PIN = 2458;
const FUSCIA_PUSH_PIN = 2459;
const GREEN_PUSH_PIN = 2460;
const YELLOW_PUSH_PIN = 2461;
const BLUE_PUSH_PIN = 2462;
const AQUA_PUSH_PIN = 2463;
const EGYPT_PIN = 2464;
const FRANCE_PIN = 2465;
const NY_PIN = 2466;
const ENGLAND_PIN = 2467;
const CHINA_PIN = 2468;
const ROME_PIN = 2469;

export const id = 1006;

export function execute({ param1 }, gamestates) {
  return (dispatch) => {
    const { value: mapTest1 } = gamestates.byId(param1);
    const { value: pinTest1 } = gamestates.byId(RED_PUSH_PIN);
    const { value: pinTest2 } = gamestates.byId(FUSCIA_PUSH_PIN);
    const { value: pinTest3 } = gamestates.byId(GREEN_PUSH_PIN);
    const { value: pinTest4 } = gamestates.byId(YELLOW_PUSH_PIN);
    const { value: pinTest5 } = gamestates.byId(BLUE_PUSH_PIN);
    const { value: pinTest6 } = gamestates.byId(AQUA_PUSH_PIN);

    if (mapTest1 === 0) {
      if (pinTest1 === 1) {
        dispatch(gamestateActions.updateGameState(RED_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 1));
      }
      if (pinTest2 === 1) {
        dispatch(gamestateActions.updateGameState(FUSCIA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 2));
      }
      if (pinTest3 === 1) {
        dispatch(gamestateActions.updateGameState(GREEN_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 3));
      }
      if (pinTest4 === 1) {
        dispatch(gamestateActions.updateGameState(YELLOW_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 4));
      }
      if (pinTest5 === 1) {
        dispatch(gamestateActions.updateGameState(BLUE_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 5));
      }
      if (pinTest6 === 1) {
        dispatch(gamestateActions.updateGameState(AQUA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 6));
      }
    }

    if (mapTest1 === 1) {
      dispatch(gamestateActions.updateGameState(param1, 0));
      if (pinTest2 === 1) {
        dispatch(gamestateActions.updateGameState(FUSCIA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 2));
      }
      if (pinTest3 === 1) {
        dispatch(gamestateActions.updateGameState(GREEN_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 3));
      }
      if (pinTest4 === 1) {
        dispatch(gamestateActions.updateGameState(YELLOW_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 4));
      }
      if (pinTest5 === 1) {
        dispatch(gamestateActions.updateGameState(BLUE_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 5));
      }
      if (pinTest6 === 1) {
        dispatch(gamestateActions.updateGameState(AQUA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 6));
      }
      dispatch(gamestateActions.updateGameState(RED_PUSH_PIN, 1));
    }

    if (mapTest1 === 2) {
      dispatch(gamestateActions.updateGameState(param1, 0));
      if (pinTest1 === 1) {
        dispatch(gamestateActions.updateGameState(RED_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 1));
      }
      if (pinTest3 === 1) {
        dispatch(gamestateActions.updateGameState(GREEN_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 3));
      }
      if (pinTest4 === 1) {
        dispatch(gamestateActions.updateGameState(YELLOW_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 4));
      }
      if (pinTest5 === 1) {
        dispatch(gamestateActions.updateGameState(BLUE_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 5));
      }
      if (pinTest6 === 1) {
        dispatch(gamestateActions.updateGameState(AQUA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 6));
      }
      dispatch(gamestateActions.updateGameState(FUSCIA_PUSH_PIN, 1));
    }

    if (mapTest1 === 3) {
      dispatch(gamestateActions.updateGameState(param1, 0));
      if (pinTest1 === 1) {
        dispatch(gamestateActions.updateGameState(RED_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 1));
      }
      if (pinTest3 === 1) {
        dispatch(gamestateActions.updateGameState(FUSCIA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 2));
      }
      if (pinTest4 === 1) {
        dispatch(gamestateActions.updateGameState(YELLOW_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 4));
      }
      if (pinTest5 === 1) {
        dispatch(gamestateActions.updateGameState(BLUE_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 5));
      }
      if (pinTest6 === 1) {
        dispatch(gamestateActions.updateGameState(AQUA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 6));
      }
      dispatch(gamestateActions.updateGameState(GREEN_PUSH_PIN, 1));
    }

    if (mapTest1 === 4) {
      dispatch(gamestateActions.updateGameState(param1, 0));
      if (pinTest1 === 1) {
        dispatch(gamestateActions.updateGameState(RED_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 1));
      }
      if (pinTest2 === 1) {
        dispatch(gamestateActions.updateGameState(FUSCIA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 2));
      }
      if (pinTest3 === 1) {
        dispatch(gamestateActions.updateGameState(GREEN_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 3));
      }
      if (pinTest5 === 1) {
        dispatch(gamestateActions.updateGameState(BLUE_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 5));
      }
      if (pinTest6 === 1) {
        dispatch(gamestateActions.updateGameState(AQUA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 6));
      }
      dispatch(gamestateActions.updateGameState(YELLOW_PUSH_PIN, 1));
    }

    if (mapTest1 === 5) {
      dispatch(gamestateActions.updateGameState(param1, 0));
      if (pinTest1 === 1) {
        dispatch(gamestateActions.updateGameState(RED_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 1));
      }
      if (pinTest2 === 1) {
        dispatch(gamestateActions.updateGameState(FUSCIA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 2));
      }
      if (pinTest3 === 1) {
        dispatch(gamestateActions.updateGameState(GREEN_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 3));
      }
      if (pinTest4 === 1) {
        dispatch(gamestateActions.updateGameState(YELLOW_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 4));
      }
      if (pinTest6 === 1) {
        dispatch(gamestateActions.updateGameState(AQUA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 6));
      }
      dispatch(gamestateActions.updateGameState(BLUE_PUSH_PIN, 1));
    }

    if (mapTest1 === 6) {
      dispatch(gamestateActions.updateGameState(param1, 0));
      if (pinTest1 === 1) {
        dispatch(gamestateActions.updateGameState(RED_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 1));
      }
      if (pinTest2 === 1) {
        dispatch(gamestateActions.updateGameState(FUSCIA_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 2));
      }
      if (pinTest3 === 1) {
        dispatch(gamestateActions.updateGameState(GREEN_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 3));
      }
      if (pinTest4 === 1) {
        dispatch(gamestateActions.updateGameState(YELLOW_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 4));
      }
      if (pinTest5 === 1) {
        dispatch(gamestateActions.updateGameState(BLUE_PUSH_PIN, 2));
        dispatch(gamestateActions.updateGameState(param1, 5));
      }
      dispatch(gamestateActions.updateGameState(AQUA_PUSH_PIN, 1));
    }
  };
}
