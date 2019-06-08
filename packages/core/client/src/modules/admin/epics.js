import createEpic from 'app/utils/createEpic';
import { login } from 'app/modules/soapbubble';
import axios from 'axios';
import { selectors } from './index';
import {
  BOT_FETCH,
  BOT_FETCH_SUCCESS,
  BOT_FETCH_FAILURE,
  BOT_SETTINGS_SUBMIT,
  BOT_RESTART,
} from './actionTypes';

const fetcBotSettingsResolved = response => ({ type: BOT_FETCH_SUCCESS, payload: response.data });
const fetcBotSettingsRejected = response => ({ type: BOT_FETCH_FAILURE, payload: response.data });

createEpic((action$, { getState }) => action$
  .ofType(BOT_FETCH)
  .mergeMap(() =>
    login.promiseLoggedIn.then(() => axios.get(`${config.authHost}/GetBotSettings`, {
      headers: {
        Authorization: `Bearer ${login.selectors.token(getState())}`,
      },
    })
      .then(fetcBotSettingsResolved, fetcBotSettingsRejected))),
);

createEpic((action$, { getState }) => action$
  .ofType(BOT_SETTINGS_SUBMIT)
  .mergeMap(() => login.promiseLoggedIn
    .then(() => axios.post(`${config.authHost}/SaveBotSettings`, selectors.botCurrentSettings(getState()), {
      headers: {
        Authorization: `Bearer ${login.selectors.token(getState())}`,
      },
    }).then(fetcBotSettingsResolved)),
  ),
);

createEpic((action$, { getState }) => action$
  .ofType(BOT_RESTART)
  .forEach(() => login.promiseLoggedIn
    .then(() => axios.get(`${config.authHost}/RestartBot`, {
      headers: {
        Authorization: `Bearer ${login.selectors.token(getState())}`,
      },
    }))
  ),
);
