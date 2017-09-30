import 'rxjs/add/operator/distinct';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/scan';
import { combineEpics } from 'redux-observable';

export const _epics = [];
let accessed = false;

export function epics() {
  accessed = true;
  return combineEpics(..._epics);
}

export default function createEpic(epic) {
  if (!accessed) {
    _epics.push(epic);
    return epic;
  }
  throw new Error('Can not add epics once they have been loaded');
}
