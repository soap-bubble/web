import { CREATE_CANVAS } from './types';

export function createCanvas(canvas) {
  return {
    type: CREATE_CANVAS,
    payload: { canvas }
  };
}
