export function singleton(provider) {
  let instance;
  return function singletonProvider() {
    if (!instance) {
      instance = provider();
    }
    return instance;
  }
}
