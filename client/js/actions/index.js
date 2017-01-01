import {
  CHANGE_PAGE,
} from './types';

export function changePage(pageName) {
  return {
    type: CHANGE_PAGE,
    payload: pageName,
  };
}
