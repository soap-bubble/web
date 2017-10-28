import { createSelector } from 'reselect';
import { get } from 'lodash';

export default ['root', function module(root) {
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

  const gapiConfig = createSelector(
    root,
    login => ({
      ...login.gapiConfig,
      scope: 'email profile',
      ux_mode: 'popup',
    }),
  );

  const token = createSelector(
    root,
    login => get(login, 'googleProfile.tokenId', ''),
  );

  return {
    isCheckingLogin,
    isLoggedIn,
    isLoginStarted,
    isInit,
    googleClientId,
    gapiConfig,
    user,
    userName,
    token,
  };
}];
