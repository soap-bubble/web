import { of } from "rxjs";
import { ofType } from "redux-observable";
import { map, mergeMap, filter } from "rxjs/operators";
import createEpic from "utils/createEpic";
import inputObservables from "./inputKeyHandlers";
import { KEY_DOWN, KEY_UP } from "./actionTypes";

export default createEpic((action$, store$) =>
  action$.pipe(
    ofType(KEY_UP, KEY_DOWN),
    mergeMap((action) => {
      if (inputObservables[action.payload]) {
        return of(...inputObservables[action.payload]).pipe(
          map((h) => {
            if (action.type === KEY_DOWN) {
              return h.down;
            }
            return h.up;
          }),
          filter((h) => !!h),
          mergeMap((handler) => of(handler(action, store$)))
        );
      }
      return [];
    }),
    filter((a) => !!a)
  )
);
