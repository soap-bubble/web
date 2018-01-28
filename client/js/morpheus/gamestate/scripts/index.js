import * as tapestry from './tapestry';

const scripts = [
  tapestry,
];

export default function (type) {
  return scripts.find(({ id }) => id === type) || {
    enabled() { return false; },
  };
}
