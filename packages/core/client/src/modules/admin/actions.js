import {
  BOT_FETCH,
  BOT_SETTINGS_INPUT,
  BOT_SETTINGS_SUBMIT,
  BOT_SETTINGS_CANCEL,
  BOT_RESTART,
} from './actionTypes';

export function fetchBotSettings() {
  return {
    type: BOT_FETCH,
  };
}

export function botSettingsInput(settings) {
  return {
    type: BOT_SETTINGS_INPUT,
    payload: settings,
  };
}

export function botSettingConfirm() {
  return {
    type: BOT_SETTINGS_SUBMIT,
  };
}

export function botSettingsCancel() {
  return {
    type: BOT_SETTINGS_CANCEL,
  };
}

export function botRestart() {
  return {
    type: BOT_RESTART,
  };
}
