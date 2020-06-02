import debounceQueue, { DebounceQueueOptions } from './debounceQueue'
import { register as registerCleanup } from './cleanup'

/**
 * Creates a scheduler that accepts work.
 *
 * Feeds a debounced queue and registeres with cleanup to abort queued-but-not-started work
 *
 * @param work Accepts a batch of work and returns results
 * @param debounceOptions options provided to debouce
 */
export default function createSchedule<T, G>(
  work: (input: T[]) => Promise<G>,
  debounceOptions?: DebounceQueueOptions<G>,
) {
  // The doer and the stoper
  const [schedule, abort] = debounceQueue<T, G>(work, debounceOptions)

  // We make sure to ask for cleanup (too important to expect clients to do this)
  registerCleanup(abort)

  // Return the doer, which is clients want
  return schedule
}
