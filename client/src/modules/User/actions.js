import axios from 'axios';
import config from '../../config';
import {
  FETCH,
} from './actionTypes';

export function fetch() {
  return {
    promise: () => axios.get(`${config.authServer}/user/settings`),
    event: FETCH,
  };
}
