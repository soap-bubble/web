import { AxiosResponse } from 'axios'
import bunyan from 'bunyan'

const logger = bunyan.createLogger({ name: 'bot-twitch-utils' })

export function twitchApiV5(path: string) {
  return `https://api.twitch.tv/kraken/${path}`
}

export function twitchApiNew(path: string) {
  return `https://api.twitch.tv/helix/${path}`
}

export function oauth(token: string) {
  return `OAuth ${token}`
}

export function bearer(token: string) {
  return `Bearer ${token}`
}

export async function attemptWithRefreh(
  func: () => Promise<AxiosResponse<any>>,
  provideTwitchToken: { reset: () => void }
) {
  let authorized: boolean = false
  let count = 0
  do {
    try {
      logger.trace('attemptWithRefreh DO...WHILE start')
      const result = await func()
      authorized = true
      logger.trace('attemptWithRefreh DO...WHILE done')
      return result
    } catch (err) {
      logger.trace('attemptWithRefreh DO...WHILE err')
      if (
        err.response &&
        err.response.status === 401 &&
        err.response.data &&
        err.response.data.message === 'invalid oauth token'
      ) {
        provideTwitchToken.reset()
      } else {
        logger.warn('Not a token error', err.response && err.response.data)
        throw err
      }
    }
    count++
  } while (!authorized && count <= 3)
  throw Error('Unable to retry')
}

export function v5AuthorizatedHeaders(twitchClientId: string, token: string) {
  return {
    'Client-ID': twitchClientId,
    Authorization: oauth(token),
    Accept: 'application/vnd.twitchtv.v5+json',
    // Accept: 'application/json; charset=utf-8',
  }
}

export function newAuthorizatedHeaders(token: string) {
  return {
    Authorization: bearer(token),
    // Accept: 'application/json; charset=utf-8',
  }
}

export function clientHeaders(twitchClientId: string) {
  return {
    'Client-ID': twitchClientId,
  }
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// converted to Typescript from: https://davidwalsh.name/javascript-debounce-function
export function debounce(func: Function, wait: number, immediate?: boolean) {
  var timeout: NodeJS.Timeout | null
  return function(...args: any[]) {
    var later = function() {
      timeout = null
      if (!immediate) func(...args)
    }
    var callNow = immediate && !timeout
    if (timeout) global.clearTimeout(timeout)
    timeout = global.setTimeout(later, wait)
    if (callNow) func(...args)
  }
}
