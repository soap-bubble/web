import axios from 'axios';
import config from '../../config';
import {
  INIT,
  START,
  SUCCESS,
  FAILURE,
} from './actionTypes';

export function init() {
  return {
    promise: () => axios.get(`${config.authServer}/token/google`),
    event: INIT,
  };
}

export function googleLogin() {
  return (dispatch) => {
    dispatch({
      type: START,
    });
  };
}
