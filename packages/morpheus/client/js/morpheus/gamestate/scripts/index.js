import {
  isCastActive,
} from 'morpheus/gamestate';

import * as tapestry from './tapestry';
import * as influxor from './influxor';
import * as instruments from './instruments';
import * as musicbox from './musicbox';
import * as pins from './pins';
import * as mapPins from './mapPins';

const scripts = [
  tapestry,
  influxor,
  instruments,
  musicbox,
  pins,
  mapPins,
];

export default function (type) {
  const script = scripts.find(({ id }) => id === type);
  if (script) {
    return Object.assign({
      enabled(cast, gamestates) {
        return isCastActive({ cast, gamestates });
      },
    }, script);
  }
  return null;
}
