import {
  CHANGE_PAGE,
} from './types';
import { browserHistory } from 'react-router';

export function changePage(route) {
  //browserHistory.push(`/${route}`);
  return {
    type: CHANGE_PAGE,
    payload: route,
  };
}
