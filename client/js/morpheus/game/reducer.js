import createReducer from 'utils/createReducer';
import {
  GAME_SET_VOLUME,
  GAME_SET_CURSOR,
  DIMENSIONS_RESIZE,
  CREATE_CANVAS,
  MENU_OPEN,
  MENU_CLOSE,
  LOGGED_IN,
  LOGIN_START,
  SETTINGS_OPEN,
  SETTINGS_CLOSE,
} from './actionTypes';


const reducer = createReducer(
  'game',
  {
    canvas: null,
    cursor: null,
    cursorImg: null,
    width: 800,
    height: 480,
    location: { x: 0, y: 0 },
    menuOpen: false,
    settingsOpen: false,
    volume: 100,
  }, {
    [MENU_OPEN](game) {
      return {
        ...game,
        menuOpen: true,
      };
    },
    [MENU_CLOSE](game) {
      return {
        ...game,
        menuOpen: false,
      };
    },
    [SETTINGS_OPEN](game) {
      return {
        ...game,
        settingsOpen: true,
      };
    },
    [SETTINGS_CLOSE](game) {
      return {
        ...game,
        settingsOpen: false,
      };
    },
    [CREATE_CANVAS](game, { payload: canvas }) {
      return {
        ...game,
        canvas,
      };
    },
    [DIMENSIONS_RESIZE](game, { payload }) {
      const { width, height, location } = payload;
      return {
        ...game,
        width,
        height,
        location,
      };
    },
    [GAME_SET_VOLUME](game, { payload: volume }) {
      return {
        ...game,
        volume,
      };
    },
    [GAME_SET_CURSOR](game, { payload: { cursor, cursorImg } }) {
      return {
        ...game,
        cursor,
        cursorImg,
      };
    },
    [LOGIN_START](game) {
      return {
        ...game,
        isLoginStart: true,
      };
    },
    [LOGGED_IN](game) {
      return {
        ...game,
        isLoginStart: false,
      };
    },
  },
);

export default reducer;
