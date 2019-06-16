import {
  actions as inputActions,
} from 'morpheus/input';
import {
  menuClosed,
  settingsClosed,
  settingsOpened,
  saveClosed,
  saveOpened,
} from './selectors';
import {
  MENU_OPEN,
  MENU_CLOSE,
  SETTINGS_OPEN,
  SETTINGS_CLOSE,
  CLOUD_SAVE_CLOSE,
  CLOUD_SAVE_OPEN,
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

export function openSettings() {
  return {
    type: SETTINGS_OPEN,
  };
}

export function closeSettings() {
  return {
    type: SETTINGS_CLOSE,
  };
}

export function openSave() {
  return {
    type: CLOUD_SAVE_OPEN,
  };
}

export function closeSave() {
  return {
    type: CLOUD_SAVE_CLOSE,
  };
}

export function fullscreen() {
  return (dispatch, getState) => {
    const root = document.getElementById('root');
    if (root.requestFullscreen) {
      root.requestFullscreen();
    } else if (root.webkitRequestFullScreen) {
      root.webkitRequestFullScreen();
      root.style.width = '100%';
      root.style.height = '100%';
    }
  };
}

// Breaks circular dependency :-(
setTimeout(() => {
  inputActions.inputHandler({
    key: 'esc',
    down(_, store$) {
      const state = store$.value;
      if (saveOpened(state)) {
        return closeSave();
      }
      if (settingsOpened(state)) {
        return closeSettings();
      }
      if (menuClosed(state)) {
        return openMenu();
      }
      return closeMenu();
    },
  });

  inputActions.inputHandler({
    key: 'p',
    down(_, store$) {
      if (settingsClosed(store$.value)) {
        return openSettings();
      }
      return closeSettings();
    },
  });

  inputActions.inputHandler({
    key: 's',
    down(_, store$) {
      if (saveClosed(store$.value)) {
        return openSave();
      }
      return closeSave();
    },
  });
});
