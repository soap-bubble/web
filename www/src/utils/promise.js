import { once } from 'lodash';

export function defer() {
  let resolve;
  let reject;

  const promise = new Promise((_resolve, _reject) => {
    resolve = once(_resolve);
    reject = once(_reject);
  });
  return {
    resolve,
    reject,
    promise,
  };
}

export function lint() {}
