import createReducer from 'utils/createReducer';
import {
  DONE,
  MOUSE_CLICK,
  SET_RENDER_ELEMENTS,
} from './actionTypes';

const reducer = createReducer(
  'title',
  {},
  {
    [DONE](title) {
      return {
        ...title,
        done: true,
      };
    },
    [MOUSE_CLICK](title) {
      return {
        ...title,
        leaving: true,
      };
    },
    [SET_RENDER_ELEMENTS](title, { payload: { camera, renderer } }) {
      return {
        ...title,
        camera,
        renderer,
      };
    },
  },
);

export default reducer;
