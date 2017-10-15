import React from 'react';
import storage from 'local-storage';
import { createSelector } from 'reselect';
import { login } from 'soapbubble';
import VolumeSlider from './containers/VolumeSlider';

export const game = state => state.game;
export const morpheusCursor = createSelector(
  game,
  _game => _game.cursor,
);
export const cursorImg = createSelector(
  game,
  _game => _game.cursorImg,
);
export const canvas = createSelector(
  game,
  _game => _game.canvas,
);
export const width = createSelector(
  game,
  _game => _game.width,
);
export const height = createSelector(
  game,
  _game => _game.height,
);
export const location = createSelector(
  game,
  _game => _game.location,
);
export const volume = createSelector(
  game,
  _game => _game.volume,
);
export const style = createSelector(
  width,
  height,
  location,
  (w, h, l) => ({
    width: `${w}px`,
    height: `${h}px`,
    left: `${l.x}px`,
    top: `${l.y}px`,
  }),
);
export const dimensions = createSelector(
  width,
  height,
  (_width, _height) => ({
    width: _width,
    height: _height,
  }),
);

export const isLoggingIn = createSelector(
  game,
  g => g.isLoginStart,
);

export const menuOpened = createSelector(
  game,
  g => g.menuOpen,
);

export const menuClosed = createSelector(
  game,
  g => !g.menuOpen,
);

export const settingsClosed = createSelector(
  game,
  g => !g.settingsOpen,
);

export const settingsOpened = createSelector(
  game,
  g => g.settingsOpen,
);

export const saveData = () => storage.get('save');

const menuDefinition = createSelector(
  saveData,
  login.selectors.isLoggedIn,
  (sd, isLoggedIn) => {
    const menuData = [];
    if (!isLoggedIn) {
      menuData.push({
        key: 'login',
        title: 'Login',
      });
    }
    menuData.push({
      key: 'save',
      title: 'Save',
    });
    if (sd) {
      menuData.push({
        key: 'load',
        title: 'Load',
      });
    }
    menuData.push({
      key: 'settings',
      title: 'Settings',
    });
    return menuData;
  },
);

export const menuSize = createSelector(
  menuDefinition,
  md => md.length,
);

export const menuDelegate = createSelector(
  menuDefinition,
  md => (index) => {
    const item = md[index];
    const { title, key } = item;
    const content = (
      <div className="menuListItem">
        {title}
      </div>
    );
    return {
      key,
      content,
    };
  },
);
