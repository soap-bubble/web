import 'rxjs-compat/add/operator/distinct';
import 'rxjs-compat/add/operator/map';
import 'rxjs-compat/add/operator/scan';
import 'rxjs-compat/add/operator/concat';
import 'rxjs-compat/add/operator/mergeMap';
import 'rxjs-compat/add/operator/catch';
import 'rxjs-compat/add/operator/takeUntil';
import 'rxjs-compat/add/observable/fromPromise';
import 'rxjs-compat/add/observable/interval';
import 'rxjs-compat/add/operator/take';
import { combineEpics, createEpicMiddleware } from 'redux-observable';

export const epics = [];

let epicMiddleware;

export function middleware() {
  if (!epicMiddleware) {
    epicMiddleware = createEpicMiddleware(combineEpics(...epics));
  }
  return epicMiddleware;
}

export default function createEpic(epic) {
  epics.push(epic);
  if (epicMiddleware) {
    epicMiddleware.replaceEpic(combineEpics(...epics));
  }
  return epic;
}
