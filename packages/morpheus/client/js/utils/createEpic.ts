import 'rxjs-compat/add/operator/distinct'
import 'rxjs-compat/add/operator/map'
import 'rxjs-compat/add/operator/scan'
import 'rxjs-compat/add/operator/concat'
import 'rxjs-compat/add/operator/mergeMap'
import 'rxjs-compat/add/operator/filter'
import 'rxjs-compat/add/operator/catch'
import 'rxjs-compat/add/operator/takeUntil'
import 'rxjs-compat/add/observable/fromPromise'
import 'rxjs-compat/add/observable/interval'
import 'rxjs-compat/add/operator/take'
import { Action, AnyAction } from 'redux'
import { combineEpics, Epic } from 'redux-observable'

export const _epics: Epic<Action<any>, Action<any>, void, any>[] = []

export function epics() {
  return combineEpics(..._epics)
}

export default function createEpic<A extends Action>(
  epic: Epic<A, A, void, any>
) {
  _epics.push(epic as unknown as Epic<Action, Action, void, any>)
}
