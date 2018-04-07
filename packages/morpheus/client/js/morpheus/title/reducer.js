import createReducer from 'utils/createReducer';
import {
  START,
  DONE,
  MOUSE_CLICK,
  SET_RENDER_ELEMENTS,
} from './actionTypes';

const reducer = createReducer(
  'title',
  {
    done: true,
  },
  {
    [START](title) {
      return {
        ...title,
        done: false,
      };
    },
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
