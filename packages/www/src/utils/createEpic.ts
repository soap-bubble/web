import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';

export const _epics = [] as Epic[];

export function epics() {
  return combineEpics(..._epics);
}

export default function createEpic<
  Input extends Action<any> = any,
  Output extends Input = Input,
  State = any,
  Dependencies = any,
>(epic: Epic<Input, Output, State, Dependencies>) {
  _epics.push(epic);
}
