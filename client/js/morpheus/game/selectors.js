import React from 'react';
import storage from 'local-storage';
import { createSelector } from 'reselect';

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
export const menuOpened = createSelector(
  game,
  g => g.menuOpen,
);

export const menuClosed = createSelector(
  game,
  g => !g.menuOpen,
);

export const saveData = () => storage.get('save');

const menuDefinition = createSelector(
  saveData,
  (sd) => {
    const menuData = [{
      key: 'save',
      title: 'Save',
    }];
    if (sd) {
      menuData.push({
        key: 'load',
        title: 'Load',
      });
    }
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
      const { title, key } = md[index];
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
