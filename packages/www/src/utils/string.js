

export function pad(value, length) {
  return (value.toString().length < length) ? pad(`0${value}`, length) : value;
}

export function lint() {}
