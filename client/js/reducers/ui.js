import {
  without,
  defaults,
} from 'lodash';
import createReducer from './createReducer';
import {
  SCENE_END,
  UI_ADD_ONMOUSEUP,
  UI_ADD_ONMOUSEMOVE,
  UI_ADD_ONMOUSEDOWN,
  UI_ADD_ONTOUCHSTART,
  UI_ADD_ONTOUCHMOVE,
  UI_ADD_ONTOUCHEND,
  UI_ADD_ONTOUCHCANCEL,
} from '../actions/types';

function reducerForType(type) {
  return function (ui, { payload: callback, meta }) {
    let { [type]: handlerList } = ui;
    let { removeOnSceneEnd } = ui;
    const { sceneOnly } = meta;
    if (sceneOnly) {
      removeOnSceneEnd = Object.assign({}, removeOnSceneEnd);
      let removeHandlerList = removeOnSceneEnd[type];
      if(!removeHandlerList) {
        removeHandlerList = [ callback ]
      } else {
        removeHandlerList = removeHandlerList.concat([ callback ]);
      }
      removeOnSceneEnd[type] = removeHandlerList;
    }
    handlerList = handlerList.concat([ callback ]);
    const ret = {
      ...ui,
      [type]: handlerList,
      removeOnSceneEnd,
    };
    return ret;
  }
}

const reducer = createReducer({
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
    let { removeOnSceneEnd } = ui;
    const newUi = { ...ui };
    Object.keys(removeOnSceneEnd).forEach((type) => {
      const stack = ui[type];
      const callbacks = removeOnSceneEnd[type];
      newUi[type] = without.apply(null, stack.concat(callbacks));
    });
    return {
      ...defaults(newUi, ui),
      removeOnSceneEnd: {},
    }
  },
  [UI_ADD_ONMOUSEUP]: reducerForType('onMouseUp'),
  [UI_ADD_ONMOUSEMOVE]: reducerForType('onMouseMove'),
  [UI_ADD_ONMOUSEDOWN]: reducerForType('onMouseDown'),
  [UI_ADD_ONTOUCHSTART]: reducerForType('onTouchStart'),
  [UI_ADD_ONTOUCHMOVE]: reducerForType('onTouchMove'),
  [UI_ADD_ONTOUCHEND]: reducerForType('onTouchEnd'),
  [UI_ADD_ONTOUCHCANCEL]: reducerForType('onTouchCancel')
});

export default reducer;
