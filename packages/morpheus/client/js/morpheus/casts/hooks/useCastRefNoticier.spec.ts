import { TestScheduler } from 'rxjs/testing'
import { eventStream } from './useCastRefNoticer'

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected)
})

describe('#useCastRefNoticer', () => {
  it('returns an observable', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers
      const e1 = cold('-a--b--c---|')
      const subs = '^----------!'
      const expected = '-a-----c---|'

      expectObservable(e1.pipe(eventStream(testScheduler))).toBe(expected)
      expectSubscriptions(e1.subscriptions).toBe(subs)
    })
  })
})
