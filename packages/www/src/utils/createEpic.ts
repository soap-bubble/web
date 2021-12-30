import { combineEpics, Epic } from "redux-observable";

export const _epics = [] as Epic[];

export function epics() {
  return combineEpics(..._epics);
}

export default function createEpic(epic: Epic) {
  _epics.push(epic);
}
