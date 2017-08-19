export function logAccess(object, logger, level) {
  const selfie = {};
  Object.defineProperties(selfie, Object.keys(object).reduce((memo, key) => {
    memo[key] = {
      get() {
        const value = object[key];
        logger[level]({
          key,
          value,
        }, `GET ${key} = ${value}`);
        return value;
      },
    };
    return memo;
  }, {}));
  return selfie;
}

export function singleton(provider) {
  let instance;
  return function singletonProvider() {
    if (!instance) {
      instance = provider();
    }
    return instance;
  };
}
