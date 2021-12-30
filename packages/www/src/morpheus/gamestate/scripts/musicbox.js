
import {
  actions as gamestateActions,
} from 'morpheus/gamestate';

const tube1 = 1041;
const tube2 = 1042;
const tube3 = 1043;
const mbinst1 = 1047;
const mbinst2 = 1048;
const mbinst3 = 1049;
const songLever = 1039;

export const id = 1002;

export function execute({ param1: isStart }, gamestates) {
  return (dispatch) => {
    const { value: instTest1 } = gamestates.byId(mbinst1);
    const { value: instTest2 } = gamestates.byId(mbinst2);
    const { value: instTest3 } = gamestates.byId(mbinst3);
    let { value: incrementer } = gamestates.byId(songLever);

    if (isStart) {
      if (instTest1 === 0) {
        if (incrementer > 9) {
          incrementer = 16 - incrementer;
        }
        dispatch(gamestateActions.updateGameState(tube1, incrementer + 1));
      }

      if (instTest1 === 1) {
        if (incrementer > 8) {
          incrementer = 16 - incrementer;
        }
        dispatch(gamestateActions.updateGameState(tube1, incrementer + 2));
      }

      if (instTest1 === 2) {
        if (incrementer > 7) {
          incrementer = 16 - incrementer;
        }
        dispatch(gamestateActions.updateGameState(tube1, incrementer + 3));
      }

      if (instTest1 === 3) {
        if (incrementer > 6) {
          incrementer = 16 - incrementer;
        }

        if (incrementer > 7) {
          incrementer = 6;
        }
        dispatch(gamestateActions.updateGameState(tube1, incrementer + 4));
      }


      if (instTest2 === 0) {
        if (incrementer > 9) {
          incrementer = 16 - incrementer;
        }
        dispatch(gamestateActions.updateGameState(tube2, incrementer + 1));
      }
      if (instTest2 === 1) {
        if (incrementer > 8) {
          incrementer = 16 - incrementer;
        }
        dispatch(gamestateActions.updateGameState(tube2, incrementer + 2));
      }

      if (instTest2 === 2) {
        if (incrementer > 7) {
          incrementer = 16 - incrementer;
        }
        dispatch(gamestateActions.updateGameState(tube2, incrementer + 3));
      }

      if (instTest2 === 3) {
        if (incrementer > 6) {
          incrementer = 16 - incrementer;
        }

        if (incrementer > 7) {
          incrementer = 6;
        }
        dispatch(gamestateActions.updateGameState(tube2, incrementer + 4));
      }


      if (instTest3 === 0) {
        if (incrementer > 9) {
          incrementer = 16 - incrementer;
        }
        dispatch(gamestateActions.updateGameState(tube3, incrementer + 1));
      }
      if (instTest3 === 1) {
        if (incrementer > 8) {
          incrementer = 16 - incrementer;
        }
        dispatch(gamestateActions.updateGameState(tube3, incrementer + 2));
      }

      if (instTest3 === 2) {
        if (incrementer > 7) {
          incrementer = 16 - incrementer;
        }
        dispatch(gamestateActions.updateGameState(tube3, incrementer + 3));
      }

      if (instTest3 === 3) {
        if (incrementer > 6) {
          incrementer = 16 - incrementer;
        }

        if (incrementer > 7) {
          incrementer = 6;
        }
        dispatch(gamestateActions.updateGameState(tube3, incrementer + 4));
      }
    }
  };
}
