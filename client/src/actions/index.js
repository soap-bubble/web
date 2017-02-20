import {
  CHANGE_PAGE,
} from './types';

function track(...rest) {
  if (window && window.ga) {
    ga(...rest);
  }
}

export function changePage(route) {
  track('set', 'page', route);
  track('send', 'pageview');
  return {
    type: CHANGE_PAGE,
    payload: route,
  };
}
