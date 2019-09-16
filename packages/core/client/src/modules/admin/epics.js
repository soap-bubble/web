import createEpic from 'app/utils/createEpic'
import axios from 'axios'
import { selectors } from './index'
import {
  BOT_FETCH,
  BOT_FETCH_SUCCESS,
  BOT_FETCH_FAILURE,
  BOT_SETTINGS_SUBMIT,
  BOT_RESTART,
} from './actionTypes'

const fetcBotSettingsResolved = response => ({
  type: BOT_FETCH_SUCCESS,
  payload: response.data,
})
const fetcBotSettingsRejected = response => ({
  type: BOT_FETCH_FAILURE,
  payload: response.data,
})

// createEpic((action$, store$) => action$
//   .ofType(BOT_FETCH)
//   .mergeMap(() =>
//     login.promiseLoggedIn.then(() => axios.get(`${config.authHost}/GetBotSettings`, {
//       headers: {
//         Authorization: `Bearer ${login.selectors.token(store$.value)}`,
//       },
//     })
//       .then(fetcBotSettingsResolved, fetcBotSettingsRejected))),
// );

// createEpic((action$, store$) => action$
//   .ofType(BOT_SETTINGS_SUBMIT)
//   .mergeMap(() => login.promiseLoggedIn
//     .then(() => axios.post(`${config.authHost}/SaveBotSettings`, selectors.botCurrentSettings(store$.value), {
//       headers: {
//         Authorization: `Bearer ${login.selectors.token(store$.value)}`,
//       },
//     }).then(fetcBotSettingsResolved)),
//   ),
// );

// createEpic((action$, store$) => action$
//   .ofType(BOT_RESTART)
//   .forEach(() => login.promiseLoggedIn
//     .then(() => axios.get(`${config.authHost}/RestartBot`, {
//       headers: {
//         Authorization: `Bearer ${login.selectors.token(store$.value)}`,
//       },
//     }))
//   ),
// );
