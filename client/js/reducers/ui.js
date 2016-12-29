import createReducer from './createReducer';
import {
  UI_ADD_ONMOUSEUP,
  UI_ADD_ONMOUSEMOVE,
  UI_ADD_ONMOUSEDOWN,
} from '../actions/types';

const reducer = createReducer({
  onMouseUp: [],
  onMouseMove: [],
  onMouseDown: [],
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
  }
});

export default reducer;
