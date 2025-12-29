import { of } from 'rxjs'
import { filter, mergeMap } from 'rxjs/operators'
import createEpic from 'utils/createEpic'
import inputObservables from './inputKeyHandlers'
import { KEY_DOWN, KEY_UP } from './actionTypes'

export default createEpic((action$, store$) =>
  action$
    // .ofType(KEY_UP, KEY_DOWN)
    .pipe(
      filter((action) => action.type === KEY_UP || action.type === KEY_DOWN),
      mergeMap((action) => {
        if (inputObservables[action.payload]) {
          return of(...inputObservables[action.payload])
            .map((h) => {
              if (action.type === KEY_DOWN) {
                return h.down
              }
              return h.up
            })
            .filter((h) => h)
            .mergeMap((handler) => of(handler(action, store$)))
        }
        return EMPTY
      })
    )
)
