import EventEmitter from 'events';
import {
  Vector3,
} from 'three';

// Make a singleton for connecting to device callback
let deviceMotionInstance: () => void;
let deviceMotionEvents: EventEmitter;
function deviceMotion(callback: (e: DeviceMotionEvent) => any) {
  if (!deviceMotionInstance) {
    deviceMotionEvents = new EventEmitter();
    const globalListener = (eventData: DeviceMotionEvent) => {
      deviceMotionEvents.emit('reading', eventData);
    };
    deviceMotionInstance = () => {
      window.removeEventListener('devicemotion', globalListener);
      deviceMotionEvents.removeAllListeners();
    };
  }
  deviceMotionEvents.on('reading', callback);
  return deviceMotionInstance;
}


let gyroscopeInstance: Gyroscope;
let accelerometerInstance: Accelerometer;
function supportsMotion() {
  return 'Gyroscope' in window && 'Accelerometer' in window;
}

function createGyro() {
  if (!gyroscopeInstance) {
    try {
      gyroscopeInstance = new Gyroscope({
        frequency: 60,
      });
      gyroscopeInstance.start();
    } catch (e) {
      console.error('Gyroscope not supported', e);
    }
  }
  return gyroscopeInstance;
}

function createAccel() {
  if (!accelerometerInstance) {
    try {
      accelerometerInstance = new Accelerometer({
        frequency: 60,
      });
      accelerometerInstance.start();
    } catch (e) {
      console.error('Accelerometer not supported', e);
    }
  }
  return accelerometerInstance;
}

function createCallbackContext({
  x,
  y,
  z,
  alpha,
  beta,
  gamma,
}: { x?: number; y?: number; z?: number; alpha?: number; beta?: number; gamma?: number}) {
  return {
    x,
    y,
    z,
    alpha,
    beta,
    gamma,
    get loc3() {
      return new Vector3(
        x,
        y,
        z,
      );
    },
    get rot3() {
      return new Vector3(
       alpha,
       beta,
       gamma,
     );
    },
  };
}

/*
 * Exports an @type EventEmitter that emits `rotation` events
 */
export default function factory() {
  const events = new EventEmitter();

  if (supportsMotion()) {
    const accl = createAccel();
    if (!accl) return events;
    const gyroscope = createGyro();
    if (!gyroscope) return events;

    let timestamp: number|undefined;
    const bias = 0.98;

    const onGyro = () => {
      if (gyroscope.timestamp && accl.x && accl.y && accl.z && gyroscope.x && gyroscope.y && gyroscope.z) {
        const dt = timestamp ? (gyroscope.timestamp - timestamp) / 1000 : 0;
        timestamp = gyroscope.timestamp;
  
         // Treat the acceleration vector as an orientation vector by normalizing it.
         // Keep in mind that the if the device is flipped, the vector will just be
         // pointing in the other direction, so we have no way to know from the
         // accelerometer data which way the device is oriented.
        const norm = Math.sqrt((accl.x ** 2) + (accl.y ** 2) + (accl.z ** 2));
  
         // As we only can cover half (PI rad) of the full spectrum (2*PI rad) we multiply
         // the unit vector with values from [-1, 1] with PI/2, covering [-PI/2, PI/2].
        const scale = Math.PI / 2;
  
        const x = accl.x * dt;
        const y = accl.y * dt;
        const z = accl.z * dt;
        const alpha = gyroscope.x * dt;
        // alpha = bias * (alpha + (gyroscope.z * dt));
        // beta = (bias * (beta + (gyroscope.x * dt))) + ((1.0 - bias) * (accl.x * (scale / norm)));
        // gamma = (bias * (gamma + (gyroscope.y * dt))) + ((1.0 - bias) * (accl.y * (-scale / norm)));
        const beta = gyroscope.y * dt;
        const gamma = gyroscope.z * dt;
         // Do something with Euler angles (alpha, beta, gamma).
        events.emit(
          'reading',
          createCallbackContext({
            x,
            y,
            z,
            alpha,
            beta,
            gamma,
          }),
        );
      }
    };
    gyroscope.addEventListener('reading', onGyro);
  } else if ('DeviceMotionEvent' in window) {
    try {
      deviceMotion((e: DeviceMotionEvent) => events.emit(
        'reading',
        createCallbackContext({
          x: e.acceleration && e.acceleration.x || undefined,
          y: e.acceleration && e.acceleration.y || undefined,
          z: e.acceleration && e.acceleration.z || undefined,
          alpha: e.rotationRate && e.rotationRate.alpha || undefined,
          beta: e.rotationRate && e.rotationRate.beta || undefined,
          gamma: e.rotationRate && e.rotationRate.gamma || undefined,
        }),
      ));
    } catch (e) {
      console.error('DeviceMotionEvent not supported', e);
    }
  }

  return events;
}
