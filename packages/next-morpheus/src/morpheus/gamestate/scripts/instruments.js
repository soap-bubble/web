import { actions as gamestateActions } from "morpheus/gamestate";

const MARACAS_MSC = 2100;
const GONG_MSC = 2106;
const DRUMS_MSC = 2107;
const CASTINET_MSC = 2108;
const PUNJI_MSC = 2109;
const MANDOLIN_MSC = 2099;

export const id = 1009;

export function execute({ param1, param2 }, gamestates) {
  return (dispatch) => {
    let instrumentTest1 = 0;
    let instrumentTest2 = 0;
    let instrumentTest3 = 0;
    let instrumentTest4 = 0;
    let instrumentTest5 = 0;
    let instrumentTest6 = 0;

    if (param2 === 1) {
      if (param1 === GONG_MSC) {
        instrumentTest1 = 1;
      }
      if (param1 === DRUMS_MSC) {
        instrumentTest2 = 1;
      }

      if (param1 === MARACAS_MSC) {
        instrumentTest3 = 1;
      }

      if (param1 === MANDOLIN_MSC) {
        instrumentTest4 = 1;
      }

      if (param1 === PUNJI_MSC) {
        instrumentTest5 = 1;
      }

      if (param1 === CASTINET_MSC) {
        instrumentTest6 = 1;
      }
    }

    dispatch(gamestateActions.updateGameState(GONG_MSC, instrumentTest1));
    dispatch(gamestateActions.updateGameState(DRUMS_MSC, instrumentTest2));
    dispatch(gamestateActions.updateGameState(MARACAS_MSC, instrumentTest3));
    dispatch(gamestateActions.updateGameState(MANDOLIN_MSC, instrumentTest4));
    dispatch(gamestateActions.updateGameState(PUNJI_MSC, instrumentTest5));
    dispatch(gamestateActions.updateGameState(CASTINET_MSC, instrumentTest6));
  };
}
