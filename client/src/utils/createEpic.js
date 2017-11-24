import 'rxjs/add/operator/distinct';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/take';
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
