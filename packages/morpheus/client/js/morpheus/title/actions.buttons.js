import {
  DoubleSide,
  Mesh,
  PlaneGeometry,
  MeshPhongMaterial,
  TextureLoader,
  Raycaster,
} from 'three';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  Tween,
  Easing,
} from 'tween';
import renderEvents from 'utils/render';

import {
  leaving,
  done,
} from './actions';
import {
  titleDimensions,
} from './selectors';
import newMap from '../../../image/texture/new.png';
import newBumpMap from '../../../image/texture/new-bump.png';
import settingsMap from '../../../image/texture/settings.png';
import settingBumpMap from '../../../image/texture/settings-bump.png';


function createButton({
  map,
  bumpMap,
  position,
}) {
  function createGeometry() {
    const geometry = new PlaneGeometry(1, 0.5, 1, 1);
    return geometry;
  }

  const textureLoader = new TextureLoader();

  function createTexture() {
    const texture = textureLoader.load(map);
    return texture;
  }

  function createBumpMap() {
    return textureLoader.load(bumpMap);
  }

  function createMaterial() {
    const material = new MeshPhongMaterial({
      map: createTexture(),
      specular: 0x222222,
      shininess: 5,
      bumpMap: createBumpMap(),
      bumpScale: 0.1,
      side: DoubleSide,
      transparent: true,
    });
    return material;
  }

  function createMesh({ material, geometry }) {
    const mesh = new Mesh(
      geometry,
      material,
    );
    mesh.scale.set(1, 0.85 * 0.66, 1);
    Object.assign(mesh.position, position);
    // mesh.position.y = -0.40;
    // mesh.position.x = -2;
    return mesh;
  }

  return createMesh({
    material: createMaterial(),
    geometry: createGeometry(),
  });
}


// function createStopWatch() {
//   let lastStoppedTime = Date.now();
//   let startTime = lastStoppedTime;
//   let isRunning = false;
//   const selfie = {
//     start() {
//       if (!isRunning) {
//         startTime = Date.now() - selfie.value;
//         isRunning = true;
//       }
//       return selfie;
//     },
//     stop() {
//       if (isRunning) {
//         isRunning = false;
//         lastStoppedTime = Date.now();
//       }
//       return selfie;
//     },
//     get fakeTime() {
//       if (isRunning) {
//         return Date.now();
//       }
//       return lastStoppedTime;
//     },
//     get value() {
//       return selfie.fakeTime - startTime;
//     },
//   };
//   return selfie;
// }

export default function factory() {
  return (dispatch, getState) => {
    const raycaster = new Raycaster();
    const objects = {
      newButton: null,
      settingsButton: null,
    };

    const selfie = {
      start({ camera }) {
        // const newButtonStopWatch = createStopWatch().start();
        let currentClientX = 0;
        let currentClientY = 0;
        const isReturningTween = Symbol('returningTween');
        const buttonActions = {
          newButton() {
            dispatch(leaving());
          },
        };
        const mouseIn = {
          newButton: false,
          settingsButton: false,
        };
        const clickIn = {
          newButton: false,
          settingsButton: false,
        };
        const slideIn = {
          newButton: false,
          settingsButton: false,
        };
        const tweens = {
          newButton: null,
        };

        const slideInTween = {
          newButton: new Tween(objects.newButton.position)
            .to({
              x: -0.75,
            }, 5000)
            .easing(Easing.Exponential.InOut)
            .onComplete(() => {
              slideIn.newButton = false;
            }),

          settingsButton: new Tween(objects.settingsButton.position)
            .to({
              x: 0.75,
            }, 5000)
            .easing(Easing.Exponential.InOut)
            .onComplete(() => {
              slideIn.settingsButton = false;
            }),
        };

        setTimeout(() => slideInTween.newButton.start(), 5000);
        setTimeout(() => slideInTween.settingsButton.start(), 5000);

        function updatePositionForEvent(e) {
          const location = gameSelectors.location(getState());
          currentClientX = e.clientX - location.x;
          currentClientY = e.clientY - location.y;
        }

        function hitCheck(object3D) {
          const { width, height } = titleDimensions(getState());
            // Convert mouse coordinates to x, y clamped between -1 and 1.  Also invert y
          const y = (((height - currentClientY) / height) * 2) - 1;
          const x = (((currentClientX - width) / width) * 2) + 1;
          raycaster.setFromCamera({ x, y }, camera);
          const intersects = raycaster.intersectObject(object3D);
          const isInstersected = !!intersects.length;
          return isInstersected;
        }

        function mouseMoveHandlerForButton(name) {
          const button = objects[name];
          if (!slideIn[name] && hitCheck(button)) {
            mouseIn[name] = true;
          } else {
            mouseIn[name] = false;
            if (!tweens[name]
              || (tweens[name] && !tweens[name][isReturningTween])) {
              if (tweens[name] && !tweens[name][isReturningTween]) {
                tweens[name].stop();
              }
              tweens[name] = new Tween(button.position)
                .to({
                  z: 0,
                })
                .easing(Easing.Exponential.Out)
                .start();
              tweens[name][isReturningTween] = true;
            }
          }
        }

        function mouseDownHandlerForButton(name) {
          const button = objects[name];
          if (!slideIn[name] && hitCheck(button)) {
            clickIn[name] = true;
            mouseIn[name] = true;
            if (tweens[name]) {
              tweens[name].stop();
            }
            tweens[name] = new Tween(button.position)
              .to({
                z: -0.1,
              })
              .easing(Easing.Exponential.Out)
              .start();
          } else {
            mouseIn[name] = false;
          }
        }

        function mouseUpHandlerForButton(name) {
          const button = objects[name];
          if (!slideIn[name] && hitCheck(button)) {
            if (tweens[name]) {
              tweens[name].stop();
            }
            tweens[name] = new Tween(button.position)
              .to({
                z: 0,
              })
              .easing(Easing.Exponential.Out)
              .start();

            if (clickIn[name]) {
              tweens[name].onComplete(() => {
                if (buttonActions[name]) {
                  buttonActions[name]();
                }
              });
            }
            tweens[name][isReturningTween] = true;
          } else {
            mouseIn[name] = false;
          }
        }

        function handler(event) {
          updatePositionForEvent(event);
          ['newButton', 'settingsButton'].forEach(mouseMoveHandlerForButton);
        }

        function handleMouseDown(event) {
          updatePositionForEvent(event);
          ['newButton', 'settingsButton'].forEach(mouseDownHandlerForButton);
        }

        function handleMouseUp(event) {
          updatePositionForEvent(event);
          ['newButton', 'settingsButton'].forEach(mouseUpHandlerForButton);
        }
        window.document.addEventListener('mousemove', handler);
        window.document.addEventListener('mousedown', handleMouseDown);
        window.document.addEventListener('mouseup', handleMouseUp);
        renderEvents.onRender(() => {

        });
        renderEvents.onDestroy(() => {
          window.document.removeEventListener('mousemove', handler);
          window.document.removeEventListener('mousedown', handleMouseDown);
          window.document.removeEventListener('mouseup', handleMouseUp);
        });
      },
      * createObject3D() {
        objects.newButton = createButton({
          map: newMap,
          bumpMap: newBumpMap,
          position: {
            x: -2.0,
            y: -0.4,
          },
        });
        yield objects.newButton;
        objects.settingsButton = createButton({
          map: settingsMap,
          bumpMap: settingBumpMap,
          position: {
            x: 2,
            y: -0.4,
          },
        });
        yield objects.settingsButton;
      },
    };
    return selfie;
  };
}
