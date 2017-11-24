import 'rxjs/add/operator/distinct';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/scan';
import { combineEpics, createEpicMiddleware } from 'redux-observable';

export const epics = [];

let _middleware;

export function middleware() {
  if (!_middleware) {
    _middleware = createEpicMiddleware(combineEpics(...epics));
  }
  return _middleware;
}

export default function createEpic(epic) {
  epics.push(epic);
  if (_middleware) {
    _middleware.replaceEpic(combineEpics(...epics));
  }
  return epic;
}
