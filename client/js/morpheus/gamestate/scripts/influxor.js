
import {
  actions as gamestateActions,
} from 'morpheus/gamestate';
import {
  actions as sceneActions,
} from 'morpheus/scene';

const LIGHT_IND = 864;
// const SERUM_A = 886;
// const INFLUX_A_NUMS = 887;
// const INFLUX_B_NUMS = 888;
// const INFLUX_C_NUMS = 889;
const INFLUXOR_MOVIE_COUNT = 876;

const EFFECT_TRIGGER = 999;

let numOfIngredients = 0;

export const id = 1001;

export function enabled() {
  return true;
}

export function execute({ param1 }, gamestates) {
  return (dispatch) => {
    const indicatorId = LIGHT_IND + (param1 - 1);
    const indicator = gamestates.byId(indicatorId);

    dispatch(gamestateActions.updateGameState(indicatorId, indicator.value + 1));

    const lightOn = indicator.value + 1 === 1;

    if (lightOn) {
      numOfIngredients++;
    } else {
      numOfIngredients--;
    }

    const effectTrigger = gamestates.byId(EFFECT_TRIGGER);
    dispatch(gamestateActions.updateGameState(EFFECT_TRIGGER, effectTrigger.value + 1));

    if (numOfIngredients === 3) {
      numOfIngredients = 0;
      const movieCount = gamestates.byId(INFLUXOR_MOVIE_COUNT);
      dispatch(gamestateActions.updateGameState(INFLUXOR_MOVIE_COUNT, movieCount.value + 1));

      dispatch(sceneActions.goToScene(306064, false));
    }
  };
}
