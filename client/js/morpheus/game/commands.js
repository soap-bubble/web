import {
  actions as inputActions,
} from 'morpheus/input';
import {
  menuClosed,
} from './selectors';
import {
  MENU_OPEN,
  MENU_CLOSE,
} from './actionTypes';

export function openMenu() {
  return {
    type: MENU_OPEN,
  };
}

export function closeMenu() {
  return {
    type: MENU_CLOSE,
  };
}

inputActions.inputHandler({
  key: 'esc',
  down(_, store) {
    if (menuClosed(store.getState())) {
      return openMenu();
    }
    return closeMenu();
  },
});
