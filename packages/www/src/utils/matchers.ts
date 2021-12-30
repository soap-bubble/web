export type Matcher<T> = (t: T) => boolean

export function or<T>(...matchers: Matcher<T>[]) {
  return (state: T) => matchers.some(matcher => matcher(state))
}

export function and<T>(...matchers: Matcher<T>[]) {
  return (state: T) => matchers.every(matcher => matcher(state))
}

export function not<T>(matcher: Matcher<T>) {
  return (state: T) => !matcher(state)
}
