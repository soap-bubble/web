import { createSelector } from 'reselect';
import { get } from 'lodash';

export default function (root) {
  const isLoggedIn = createSelector(
    root,
    login => login.loggedIn,
  );

  const isLoginStarted = createSelector(
    root,
    login => login.started,
  );

  const isInit = createSelector(
    root,
    login => login.initStatus && login.initStatus !== 'pending' && login.initStatus !== 'error',
  );

  const isCheckingLogin = createSelector(
    root,
    login => login.initStatus === 'pending',
  );

  const googleClientId = createSelector(
    root,
    login => login.authGoogleClientId,
  );

  const user = createSelector(
    root,
    login => login.user,
  );

  const userName = createSelector(
    user,
    u => get(u, 'displayName', 'Anonymous'),
  );

  return {
    isCheckingLogin,
    isLoggedIn,
    isLoginStarted,
    isInit,
    googleClientId,
    user,
    userName,
  };
}
