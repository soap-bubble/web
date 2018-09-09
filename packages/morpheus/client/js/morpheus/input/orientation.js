import createRotation from './rotation';
import {
  Vector3,
} from 'three';

export function prepare(context, rot) {
  context.nRotation = rot.vec3.normalize();
  context.rotation = rot.vec3;
}

export function createUpdater(context, callbacks) {
  return (rot) => {
    callbacks.forEach(c => c(context, rot));
  };
}

// sumation stuff, ignore for now
// values: [],
// get sum() {
//   const values = context.values;
//   const total = values.reduce((sum, v) => {
//     sum.x += v.x;
//     sum.y += v.y;
//     return sum;
//   }, {
//     x: 0,
//     y: 0,
//   });
//   return {
//     x: total.x / values.length,
//     y: total.y / values.length,
//   };
// },

export function createContext() {
  const context = {


  };
  return context;
}

export default function factory(callback) {
  const rotationSensor = createRotation();
  // Save off rotation state here
  const context = createContext();
  const update = createUpdater(context, [
    prepare,
  ]);
  const sensorCallback = (rot) => {
    update(rot);
    callback(context.rotation);
  };

  const selfie = {
    on() {
      rotationSensor.on('reading', sensorCallback);
    },
    off() {
      rotationSensor.removeListener('reading', sensorCallback);
    },
  };

  selfie.on();

  return selfie;
}
