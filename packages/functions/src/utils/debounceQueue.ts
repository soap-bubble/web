/*
 * Converted to Typescript from https://github.com/laggingreflex/debounce-queue
 *
 * LICENSE: The Unlicense (public domain)
 *
 * Modifications:
 *  - Removed sleep option because I didn't understand or need it
 *  - Only supports a single argument (easier to type)
 *  - Converted usage of Date to numeric
 *  - Added promise support to be able to block on when a debounced execution occurs
 *  - Added abort w/ promise for clean shutdown
 *  - Added onEmpty listener for notifying when queue is cleared
 */

export interface DebounceQueueOptions<G> {
  delay?: number
  maxDelay?: number
  maxSize?: number
  onEmpty?: Listener<G>
}

export type Listener<T> = (input: T) => any

type Resolver<T> = (value?: T) => void
type Rejector = (reason?: any) => void
export default function debounceQueue<T, G>(
  callback: (all: T[]) => Promise<G>,
  options?: DebounceQueueOptions<G>,
): [(input: T) => Promise<G>, () => Promise<void>] {
  /*
   * Failfasts
   */
  if (typeof callback !== 'function') {
    throw new Error('Required: the function to debounce')
  }

  /*
   * Options
   */
  const opts = options ? options : {}
  const delay = opts.delay || 100
  const maxSize = opts.maxSize || Infinity
  const maxDelay = opts.maxDelay || Infinity
  const onEmpty = opts.onEmpty || null

  /*
   * Variables
   */
  let queue: [T, Resolver<G>, Rejector][] = [] // A spread of an item of work, and their promise defer
  let working = false // True when work is being performed
  let time = Date.now() // Keeps track of if maxTime is being respected
  let emptyPromise: null | Promise<void> = null
  let emptyDefer: [] | [Resolver<void>, Rejector] = []

  function reset() {
    setNextTimer()
  }

  function debounced(input: T) {
    return new Promise<G>((resolve, reject) => {
      queue.push([input, resolve, reject])
      if (queue.length >= maxSize || time + maxDelay > Date.now()) {
        resetTimeout()
        timeoutFn()
      } else if (!working) {
        reset()
      }
    })
  }

  function timeoutFn() {
    const flush = queue.slice()
    queue = []

    let ret
    if (flush.length) {
      working = true
      const abort = () => {
        if (emptyPromise && emptyDefer.length) {
          const [resolve] = emptyDefer
          emptyDefer = []
          emptyPromise = null
          resolve()
          return true
        }
        return false
      }
      ret = Promise.resolve(callback(flush.map(([t]) => t)))
        .then(async response => {
          if (onEmpty && queue.length === 0) {
            await onEmpty(response)
          }
          return response
        })
        .then(
          result => {
            flush.forEach(([_, resolve]) => abort() || resolve(result))
            return result
          },
          error => {
            flush.forEach(([_, __, reject]) => abort() || reject(error))
            throw error
          },
        )
        .finally(() => {
          // Mark timestamp for checking max delay because maxDelay is the amount of time since last job _finished_
          time = Date.now()
          working = false
          if (queue.length) {
            reset()
          }
        })
    } else {
      working = false
    }

    return ret
  }

  let timer: NodeJS.Timeout | null = null
  const resetTimeout = () => {
    if (!timer) return
    clearTimeout(timer)
    timer = null
  }

  function setNextTimer() {
    resetTimeout()
    timer = setTimeout(timeoutFn, delay)
  }

  function empty() {
    if (!emptyPromise) {
      emptyPromise = new Promise((resolve, reject) => {
        if (queue.length !== 0) {
          resolve()
        } else {
          emptyDefer = [resolve, reject]
        }
      })
    }
    return emptyPromise
  }

  return [debounced, empty]
}
