import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/catch';
import { Observable } from 'rxjs/Observable';
import createEpic from 'utils/createEpic';
import inputObservables from './handlers';
import {
  KEY_DOWN,
  KEY_UP,
} from './actionTypes';

export default createEpic((action$, store) => action$
      .ofType(KEY_UP, KEY_DOWN)
      .mergeMap((action) => {
        if (inputObservables[action.payload]) {
          return Observable.of(...inputObservables[action.payload])
            .map((h) => {
              if (action.type === KEY_DOWN) {
                return h.down;
              }
              return h.up;
            })
            .filter(h => h)
            .mergeMap(handler => Observable.of(handler(action, store)));
        }
        return [];
      })
      .filter(a => !!a),
);
