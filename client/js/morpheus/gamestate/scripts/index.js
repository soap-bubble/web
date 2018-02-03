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
  return scripts.find(({ id }) => id === type) || {
    enabled() { return false; },
  };
}
