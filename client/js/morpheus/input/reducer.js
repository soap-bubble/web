import {
  without,
  defaults,
} from 'lodash';
import createReducer from 'utils/createReducer';
import {
  ADD_ONMOUSEUP,
  ADD_ONMOUSEMOVE,
  ADD_ONMOUSEDOWN,
  ADD_ONTOUCHSTART,
  ADD_ONTOUCHMOVE,
  ADD_ONTOUCHEND,
  ADD_ONTOUCHCANCEL,
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
  'input',
  {
    onMouseUp: [],
    onMouseMove: [],
    onMouseDown: [],
    onTouchStart: [],
    onTouchMove: [],
    onTouchEnd: [],
    onTouchCancel: [],
  }, {
    [ADD_ONMOUSEUP]: reducerForType('onMouseUp'),
    [ADD_ONMOUSEMOVE]: reducerForType('onMouseMove'),
    [ADD_ONMOUSEDOWN]: reducerForType('onMouseDown'),
    [ADD_ONTOUCHSTART]: reducerForType('onTouchStart'),
    [ADD_ONTOUCHMOVE]: reducerForType('onTouchMove'),
    [ADD_ONTOUCHEND]: reducerForType('onTouchEnd'),
    [ADD_ONTOUCHCANCEL]: reducerForType('onTouchCancel'),
  },
);

export default reducer;
