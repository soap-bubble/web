import 'rxjs-compat/add/operator/distinct';
import 'rxjs-compat/add/operator/map';
import 'rxjs-compat/add/operator/scan';
import 'rxjs-compat/add/operator/concat';
import 'rxjs-compat/add/operator/mergeMap';
import 'rxjs-compat/add/operator/filter';
import 'rxjs-compat/add/operator/catch';
import 'rxjs-compat/add/operator/takeUntil';
import 'rxjs-compat/add/observable/fromPromise';
import 'rxjs-compat/add/observable/interval';
import 'rxjs-compat/add/operator/take';
import { combineEpics, Epic } from 'redux-observable';

export const _epics = [] as Epic[];

export function epics() {
  return combineEpics(..._epics);
}

export default function createEpic(epic: Epic) {
  _epics.push(epic);
}
