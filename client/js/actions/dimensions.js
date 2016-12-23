import { DIMENSIONS_RESIZE } from './types';

export function resize({ width, height }) {
  return {
    type: DIMENSIONS_RESIZE,
    payload: {
      width,
      height,
    },
  };
}

export function lint() {}
