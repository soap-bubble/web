import {
  actions as gamestateActions,
} from 'morpheus/gamestate';
import {
  actions as sceneActions,
} from 'morpheus/scene';
import createLogger from 'utils/logger';
const logger = createLogger('scripts:drum');

const NUM_OF_DRUMS = 8;
let numOfBeats = 0;
let lastHotSpot;
let lastDrum = -1;

function reset() {
  numOfBeats = 0;
  lastHotSpot = null;
  lastDrum = -1;
}

export const id = 1007;

export function execute(hotspot, gamestates, isMouseDown = false) {
  return (dispatch, getState) => {
    logger.debug('START');
    // if (!isMouseDown) {
    //   return reset();
    // }
    if (hotspot === lastHotSpot) {
      return null;
    }
    lastHotSpot = hotspot;

    const {
      param1,
      param2,
      param3,
    } = hotspot;
    const currentDrum = param3 - 1;
    if (lastDrum === -1 || currentDrum === (lastDrum + 1) % NUM_OF_DRUMS) {
      logger.debug('Update to curremtDrum', currentDrum);
      lastDrum = currentDrum;
    } else {
      logger.debug('NOPE');
      return null;
    }

    numOfBeats++;
    logger.debug('--------------->', numOfBeats, '<-------------------')
    dispatch(gamestateActions.updateGameState(param1, param3));

    if (numOfBeats > NUM_OF_DRUMS + NUM_OF_DRUMS / 2) {
      logger.debug('SUCCESS');
      if (param2 !== 0) {
        reset();
        dispatch(sceneActions.goToScene(param2, true));
      }
    }
  }
}
