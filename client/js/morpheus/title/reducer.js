import createReducer from 'utils/createReducer';
import {
  SET_RENDER_ELEMENTS,
} from './actionTypes';

const reducer = createReducer(
  'title',
  {},
  {
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
