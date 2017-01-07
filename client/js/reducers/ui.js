import createReducer from './createReducer';
import {
  UI_ADD_ONMOUSEUP,
  UI_ADD_ONMOUSEMOVE,
  UI_ADD_ONMOUSEDOWN,
  UI_ADD_ONTOUCHSTART,
  UI_ADD_ONTOUCHMOVE,
  UI_ADD_ONTOUCHEND,
  UI_ADD_ONTOUCHCANCEL,
} from '../actions/types';

const reducer = createReducer({
  onMouseUp: [],
  onMouseMove: [],
  onMouseDown: [],
  onTouchStart: [],
  onTouchMove: [],
  onTouchEnd: [],
  onTouchCancel: [],
}, {
  [UI_ADD_ONMOUSEUP](ui, { payload: callback }) {
    let { onMouseUp } = ui;
    onMouseUp = onMouseUp.concat([ callback ]);
    return {
      ...ui,
      onMouseUp,
    };
  },
  [UI_ADD_ONMOUSEMOVE](ui, { payload: callback }) {
    let { onMouseMove } = ui;
    onMouseMove = onMouseMove.concat([ callback ]);
    return {
      ...ui,
      onMouseMove,
    };
  },
  [UI_ADD_ONMOUSEDOWN](ui, { payload: callback }) {
    let { onMouseDown } = ui;
    onMouseDown = onMouseDown.concat([ callback ]);
    return {
      ...ui,
      onMouseDown,
    };
  },
  [UI_ADD_ONTOUCHSTART](ui, { payload: callback }) {
    let { onTouchStart } = ui;
    onTouchStart = onTouchStart.concat([ callback ]);
    return {
      ...ui,
      onTouchStart,
    };
  },
  [UI_ADD_ONTOUCHMOVE](ui, { payload: callback }) {
    let { onTouchMove } = ui;
    onTouchMove = onTouchMove.concat([ callback ]);
    return {
      ...ui,
      onTouchMove,
    };
  },
  [UI_ADD_ONTOUCHEND](ui, { payload: callback }) {
    let { onTouchEnd } = ui;
    onTouchEnd = onTouchEnd.concat([ callback ]);
    return {
      ...ui,
      onTouchEnd,
    };
  },
  [UI_ADD_ONTOUCHCANCEL](ui, { payload: callback }) {
    let { onTouchCancel } = ui;
    onTouchCancel = onTouchCancel.concat([ callback ]);
    return {
      ...ui,
      onTouchCancel,
    };
  }
});

export default reducer;
