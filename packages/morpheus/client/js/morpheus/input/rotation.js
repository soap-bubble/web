import EventEmitter from 'events';
import {
  Vector3,
} from 'three';

// Make a singleton for connecting to device callback
let deviceMotionInstance;
let deviceMotionEvents;
function deviceMotion(callback) {
  if (!deviceMotionInstance) {
    deviceMotionEvents = new EventEmitter();
    const globalListener = (eventData) => {
      deviceMotionEvents.emit('reading', eventData.rotationRate);
    };
    deviceMotionInstance = () => {
      global.removeEventListener('devicemotion', globalListener);
      deviceMotionEvents.off();
    };
  }
  deviceMotionEvents.on('reading', callback);
  return deviceMotionInstance;
}


let gyroscopeInstance;
function supportsGyro() {
  return 'Gyroscope' in global;
}

function createGyro() {
  if (!gyroscopeInstance) {
    gyroscopeInstance = new global.Gyroscope({
      frequency: 60,
    });
    gyroscopeInstance.start();
  }
  return gyroscopeInstance;
}

/*
 * Exports an @type EventEmitter that emits `rotation` events
 */
export default function factory() {
  const events = new EventEmitter();

  if (supportsGyro()) {
    const gyroscope = createGyro();
    gyroscope.addEventListener('reading', () => event.emit(
      'reading',
      {
        x: gyroscope.x,
        y: gyroscope.y,
        z: gyroscope.z,
        alpha: gyroscope.x,
        beta: gyroscope.y,
        gamma: gyroscope.z,
        get vec3() {
          return new Vector3(
            gyroscope.x,
            gyroscope.y,
            gyroscope.z,
          );
        },
      },
    ));
  } else if ('DeviceMotionEvent' in window) {
    deviceMotion(e => event.emit(
      'reading',
      {
        x: e.alpha,
        y: e.beta,
        z: e.gamma,
        alpha: e.alpha,
        beta: e.beta,
        gamma: e.gamma,
        get vec3() {
          return new Vector3(
            e.alpha,
            e.beta,
            e.gamma,
          );
        },
      },
    ));
  } else {
    // No web motion controls supported
  }

  return events;
}
