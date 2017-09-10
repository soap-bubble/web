import { createSelector } from 'reselect';

export default function (root) {
  const isLoginStarted = createSelector(
    root,
    login => login.started,
  );

  const isInit = createSelector(
    root,
    login => login.initStatus && login.initStatus !== 'pending',
  );

  const googleClientId = createSelector(
    root,
    login => login.authGoogleClientId,
  );

  return {
    isLoginStarted,
    isInit,
    googleClientId,
  };
}
