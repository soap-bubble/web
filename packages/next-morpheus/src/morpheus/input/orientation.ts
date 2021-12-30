import {
  Vector2,
  Vector3,
} from 'three';
import createRotation from './rotation';


export function prepare(context: any, rot: any) {
  context.startingRotation = context.startingRotation || rot.rot3;
  context.rotSpeed = context.rotSpeed || new Vector3();
  // context.deltaRotation = rot.vec3.sub(context.startingRotation);
}

const locationBias = 0.01;

export function updateDirection(context: any, rot: any) {
  context.direction.add(new Vector2(rot.y, rot.x));
}

export function updateRotationSpeed(context: any, rot: any) {
  context.rotSpeed.add(rot.rot3.multiplyScalar(0.25));
}

export function updateSpeed(context: any, rot: any) {
  const loc3 = new Vector3(
    0,
    rot.x,
    -rot.y,
  );
  const length = loc3.length();
  if (length !== 0) {
    loc3.multiplyScalar(Math.PI / (2 * length));
  }

  const rot3 =
    context.speed.lerp(
      loc3,
      locationBias,
    );
  context.speed.add(rot3);
}

const SPEED_MAX = 0.1;

export function dampenSpeed(context: any) {
  context.rotSpeed.lerp(new Vector3(), 0.005).clampLength(0, SPEED_MAX);
}

export function applySpeed(context: any) {
  context.result = context.rotSpeed;
}

export function createUpdater(context: any, callbacks: any[]) {
  return (rot: any) => {
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

export function createContext(): any {
  const context = {
    speed: new Vector3(),
    rotSpeed: new Vector3(),
    direction: new Vector2(),
  };
  return context;
}

export default function factory(callback: (rot: any) => any) {
  const rotationSensor = createRotation();
  // Save off rotation state here
  const context = createContext();
  const update = createUpdater(context, [
    prepare,
    updateRotationSpeed,
    updateSpeed,
    dampenSpeed,
    applySpeed,
  ]);
  const sensorCallback = (rot: any) => {
    update(rot);
    callback(context.result);
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
