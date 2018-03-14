export function or(...matchers) {
  return state => matchers.some(matcher => matcher(state));
}

export function and(...matchers) {
  return state => matchers.every(matcher => matcher(state));
}

export function not(matcher) {
  return state => !matcher(state);
}
