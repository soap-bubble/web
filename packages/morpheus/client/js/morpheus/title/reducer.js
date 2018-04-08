import createReducer from 'utils/createReducer';
import {
  START,
  DONE,
  LEAVING,
  SET_RENDER_ELEMENTS,
} from './actionTypes';

const reducer = createReducer(
  'title',
  {
    done: true,
    leaving: false,
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
    [LEAVING](title) {
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
