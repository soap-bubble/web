import { fetchInitial as fetchInitialGameState } from 'service/gameState';
import {
  actions as castActions,
} from 'morpheus/casts';
import {
  actions as sceneActions,
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as gameStateSelectors,
  isActive,
} from 'morpheus/gamestate';
import {
  actions as gameActions,
} from 'morpheus/game';
import store from 'store';

import {
  API_ERROR,
  LOAD_COMPLETE,
  UPDATE,
} from './actionTypes';
import {
  ACTION_TYPES,
} from '../constants';

export function gameStateLoadComplete(responseData) {
  return {
    type: LOAD_COMPLETE,
    payload: responseData,
  };
}

export function fetchInitial() {
  return dispatch => fetchInitialGameState()
    .then(responseData => dispatch(gameStateLoadComplete(responseData.data)))
    .catch(err => dispatch({ payload: err, type: API_ERROR }));
}

export function updateGameState(gamestateId, value) {
  return {
    type: UPDATE,
    payload: value,
    meta: gamestateId,
  };
}

export function handleMouseOver({ hotspot }) {
  return (dispatch, getState) => {
    const gamestates = gameStateSelectors.gamestates(getState());
    const {
      type,
    } = hotspot;
    if (isActive({ cast: hotspot, gamestates })) {
      if (type >= 5 && type <= 8) {
        dispatch(gameActions.setOpenHandCursor());
        return false;
      }
    }
    return true;
  };
}

export function handleMouseDown({ hotspot }) {
  return (dispatch, getState) => {
    const gamestates = gameStateSelectors.gamestates(getState());
    const {
      type,
    } = hotspot;
    if (isActive({ cast: hotspot, gamestates })) {
      if (type >= 5 && type <= 8) {
        const gs = gamestates[hotspot.param1];
        if (gs) {
          gs.oldValue = gs.value;
        }
      }
    }
    return true;
  };
}

export function handleMouseStillDown({ hotspot, top, left }) {
  return (dispatch, getState) => {
    const gamestates = gameStateSelectors.gamestates(getState());
    const {
      type,
    } = hotspot;
    if (isActive({ cast: hotspot, gamestates })) {
      const actionType = ACTION_TYPES[type];
      if (actionType === 'TwoAxisSlider') {
        const gs = gamestates[hotspot.param1];
        const gsLs = gamestates[hotspot.param2];
        const gsMs = gamestates[hotspot.param3];
        const verticalRatio = Math.floor((gsLs.maxValue + 1) * (top - hotspot.rectTop) / (hotspot.rectBottom - hotspot.rectTop));
        const horizontalRatio = Math.floor((gsMs.maxValue + 1) * (left - hotspot.rectLeft) / (hotspot.rectRight - hotspot.rectLeft));

        if (gs && gsLs && gsMs) {
          const valueLs = gsLs.value;
          const valueMs = gsMs.value;
          const value = (gsMs.maxValue + 1) * verticalRatio + horizontalRatio;
          console.log({ vMax: gsLs.maxValue, hMax: gsLs.maxValue, v: verticalRatio, h: horizontalRatio, value });
          dispatch(updateGameState(hotspot.param1, Math.round(value)));
        }
      } else if (actionType === 'VertSlider') {
        dispatch(gameActions.setCloseHandCursor());
        const gs = gamestates[hotspot.param1];
        const { stateWraps, minValue: min, maxValue: max } = gs;
        const oldValue = gs.oldValue || gs.value;
        const ratio = (top - hotspot.rectTop) / (hotspot.rectBottom - hotspot.rectTop);
        dispatch(updateGameState(hotspot.param1, ratio * max));
        // let rate = hotspot.param2;
        // if (rate === 0) {
        //   rate = max - min;
        // }
        //
        // const delta = (rate * ratio) - 0.95;
        //
        // let value = oldValue + delta;
        // if (value < min) {
        //   if (stateWraps) {
        //     value += max - min;
        //   } else {
        //     value = min;
        //   }
        // }
        // if (value > max) {
        //   if (stateWraps) {
        //     value -= max - min;
        //   } else {
        //     value = max;
        //   }
        // }
        // gs.value = value;
      } else if (actionType === 'HorizSlider') {
        dispatch(gameActions.setCloseHandCursor());
        const gs = gamestates[hotspot.param1];
        const { stateWraps, minValue: min, maxValue: max } = gs;
        const oldValue = gs.oldValue || gs.value;
        const ratio = (left - hotspot.rectLeft) / (hotspot.rectRight - hotspot.rectLeft);
        dispatch(updateGameState(hotspot.param1, ratio * max));
      }
    }
    return true;
  };
}

// Rotate
// CCast::DoMouseStillDown	(	inWhere	);
//
// switch (	mType	) {
//
// case Rotate:
//   {
//     SB_Types::Point mousePt 		= inWhere;
//     CPanoCast::WindowToPano	(	mousePt	);
//
//     CGameState *	gameStateVar 	= CGameState::FindByID(mParam1);
//
//     if (	gameStateVar != nil	) {
//
//       SB_Types::Int32 min = gameStateVar->GetMin();
//       SB_Types::Int32	max	= gameStateVar->GetMax();
//       double centerX 		= (mRect.right + mRect.left) / 2;
//       double centerY 		= (mRect.bottom + mRect.top) / 2;
//       double angle 		= atan2 (	mousePt.h - centerX,
//                       centerY - mousePt.v	);
//       angle 				= 180 * angle/Pi - mParam2;
//       while (	angle < 0	) {
//         angle += 360;
//       }
//
//       if (	angle > mParam3 - mParam2	) {
//
//         angle = 360 - angle > angle - mParam3 ?
//               mParam3 - mParam2 :
//               0;
//       }
//
//       double currAngle =	double(mParam3 - mParam2)*(gameStateVar->GetState() - min) /
//                 (max - min);
//
//       if (	angle - currAngle < 90 && angle - currAngle > -90	) {
//
//         double 			ratio	= angle / (mParam3 - mParam2);
//         SB_Types::Int32 value	= SB_Types::Int32
//                       ( min + (max - min)*ratio + .5 );
//         gameStateVar->SetState(value);
//       }
//     }
//   }

export function handleHotspot({ hotspot }) {
  return (dispatch, getState) => {
    const gamestates = gameStateSelectors.gamestates(getState());
    const {
      type,
      dissolveToNextScene,
    } = hotspot;

    if (isActive({ cast: hotspot, gamestates })) {
      const actionType = ACTION_TYPES[type];
      switch (actionType) {
        case 'GoBack': {
          const prevSceneId = sceneSelectors.previousSceneId(getState());
          dispatch(sceneActions.goToScene(prevSceneId));
          break;
        }
        case 'DissolveTo':
        case 'ChangeScene': {
          const { defaultPass, param1: nextSceneId } = hotspot;
          if (nextSceneId) dispatch(sceneActions.goToScene(nextSceneId), dissolveToNextScene);
          return defaultPass;
        }
        case 'IncrementState': {
          const { defaultPass, param1: gamestateId } = hotspot;
          const gs = gameStateSelectors.gamestates(getState())[gamestateId];
          const {
            maxValue,
            minValue,
            stateWraps,
          } = gs;
          let { value } = gs;
          value += 1;
          if (value > maxValue) {
            if (stateWraps) {
              value = minValue;
            } else {
              value = maxValue;
            }
          }
          dispatch(updateGameState(gamestateId, value));
          return defaultPass;
        }
        case 'DecrementState': {
          const { defaultPass, param1: gamestateId } = hotspot;
          const gs = gameStateSelectors.gamestates(getState())[gamestateId];
          const {
            maxValue,
            minValue,
            stateWraps,
          } = gs;
          let { value } = gs;
          value -= 1;
          if (value < minValue) {
            if (stateWraps) {
              value = maxValue;
            } else {
              value = minValue;
            }
          }
          dispatch(updateGameState(gamestateId, value));
          return defaultPass;
        }
        case 'SetStateTo': {
          const { defaultPass, param1: gamestateId, param2: value } = hotspot;
          dispatch(updateGameState(gamestateId, value));
          return defaultPass;
        }

        // case ExchangeState:
        //   {
        //     CGameState *	stateVariable2 = CGameState::FindByID (	mParam2	);
        //     if (	stateVariable2 != nil	) {
        //       SB_Types::Int32 value1 = stateVariable->GetState ();
        //       SB_Types::Int32 value2 = stateVariable2->GetState ();
        //       stateVariable->SetState(value2);
        //       stateVariable2->SetState(value1);
        //     }
        //   }
        //   break;
        // case CopyState:
        //   {
        //     CGameState *	stateVariable2 = CGameState::FindByID (	mParam2	);
        //     if (	stateVariable2 != nil	) {
        //       SB_Types::Int32 value = stateVariable2->GetState ();
        //       stateVariable->SetState(value);
        //     }
        //   }
        //   break;
        // }

        default:
          break;
      }
    }
    return true;
  };
}

window.updategs = (gamestateId, value) => {
  store.dispatch(updateGameState(gamestateId, value));
  store
    .dispatch(
      castActions.forScene(
        sceneSelectors.currentSceneData(
          store.getState(),
        ),
      )
      .special
      .update(),
    );
};

window.getgs = gamestateId => gameStateSelectors.gamestates(store.getState())[gamestateId];
