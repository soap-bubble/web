import createReducer from 'utils/createReducer';
import {
  CLOUD_SAVE_OPEN,
  CLOUD_SAVE_CLOSE,
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
  SAVE_LOAD,
  SAVE_LOAD_SUCCESS,
  SAVE_LOAD_ERROR,
  SET_SAVE_ID,
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
    volume: 20,
    isLoggingIn: false,
    saveOpen: false,
    savesAreLoading: false,
    savesMeta: [],
    saveId: null,
  }, {
    [SET_SAVE_ID](game, { payload: saveId }) {
      return {
        ...game,
        saveId,
      };
    },
    [SAVE_LOAD](game) {
      return {
        ...game,
        savesAreLoading: true,
      };
    },
    [SAVE_LOAD_SUCCESS](game, { payload: savesMeta }) {
      return {
        ...game,
        savesAreLoading: false,
        savesMeta,
      };
    },
    [SAVE_LOAD_ERROR](game, { payload: err }) {
      return {
        ...game,
        savesAreLoading: false,
        savesMeta: err,
      };
    },
    [CLOUD_SAVE_OPEN](game) {
      return {
        ...game,
        saveOpen: true,
      };
    },
    [CLOUD_SAVE_CLOSE](game) {
      return {
        ...game,
        saveOpen: false,
      };
    },
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
    [LOGGED_IN](game, { payload: user }) {
      return {
        ...game,
        isLoginStart: false,
        user,
      };
    },
  },
);

export default reducer;
