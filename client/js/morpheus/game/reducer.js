import {
  without,
  defaults,
} from 'lodash';
import createReducer from 'utils/createReducer';
import {
  GAME_SET_VOLUME,
  GAME_SET_CURSOR,
  DIMENSIONS_RESIZE,
  ADD_ONMOUSEUP,
  ADD_ONMOUSEMOVE,
  ADD_ONMOUSEDOWN,
  ADD_ONTOUCHSTART,
  ADD_ONTOUCHMOVE,
  ADD_ONTOUCHEND,
  ADD_ONTOUCHCANCEL,
  SCENE_END,
} from './actionTypes';

function reducerForType(type) {
  return function reducer(ui, { payload: callback, meta }) {
    let { [type]: handlerList } = ui;
    let { removeOnSceneEnd } = ui;
    const { sceneOnly } = meta;
    if (sceneOnly) {
      removeOnSceneEnd = Object.assign({}, removeOnSceneEnd);
      let removeHandlerList = removeOnSceneEnd[type];
      if (!removeHandlerList) {
        removeHandlerList = [callback];
      } else {
        removeHandlerList = removeHandlerList.concat([callback]);
      }
      removeOnSceneEnd[type] = removeHandlerList;
    }
    handlerList = handlerList.concat([callback]);
    const ret = {
      ...ui,
      [type]: handlerList,
      removeOnSceneEnd,
    };
    return ret;
  };
}

const reducer = createReducer(
  'game',
  {
    volume: 1,
    cursor: 10001,
    width: 800,
    height: 480,
    removeOnSceneEnd: {},
    onMouseUp: [],
    onMouseMove: [],
    onMouseDown: [],
    onTouchStart: [],
    onTouchMove: [],
    onTouchEnd: [],
    onTouchCancel: [],
  }, {
    [SCENE_END](ui) {
      const { removeOnSceneEnd } = ui;
      const newUi = { ...ui };
      Object.keys(removeOnSceneEnd).forEach((type) => {
        const stack = ui[type];
        const callbacks = removeOnSceneEnd[type];
        newUi[type] = without(...stack.concat(callbacks));
      });
      return {
        ...defaults(newUi, ui),
        removeOnSceneEnd: {},
      };
    },
    [ADD_ONMOUSEUP]: reducerForType('onMouseUp'),
    [ADD_ONMOUSEMOVE]: reducerForType('onMouseMove'),
    [ADD_ONMOUSEDOWN]: reducerForType('onMouseDown'),
    [ADD_ONTOUCHSTART]: reducerForType('onTouchStart'),
    [ADD_ONTOUCHMOVE]: reducerForType('onTouchMove'),
    [ADD_ONTOUCHEND]: reducerForType('onTouchEnd'),
    [ADD_ONTOUCHCANCEL]: reducerForType('onTouchCancel'),
    [DIMENSIONS_RESIZE](windowState, { payload }) {
      const { width, height } = payload;
      return {
        ...windowState,
        width,
        height,
      };
    },
    [GAME_SET_VOLUME](game, { payload: volume }) {
      return {
        ...game,
        volume,
      };
    },
    [GAME_SET_CURSOR](game, { payload: morpheusCursor }) {
      return {
        ...game,
        cursor: morpheusCursor,
      };
    },
  },
);

export default reducer;
