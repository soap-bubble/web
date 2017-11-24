import axios from 'axios';
import {
  FETCH,
} from './actionTypes';

export function fetch() {
  return {
    promise: () => axios.get(`${config.authHost}/user/settings`),
    event: FETCH,
  };
}
