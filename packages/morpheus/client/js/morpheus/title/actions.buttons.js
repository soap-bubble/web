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
import newImg from '../../../image/texture/new.png';
import newBump from '../../../image/texture/new-bump.png';


function createGeometry() {
  const geometry = new PlaneGeometry(1, 0.5, 64, 64);
  return geometry;
}

const textureLoader = new TextureLoader();

function createTexture() {
  const texture = textureLoader.load(newImg);
  return texture;
}

function createBumpMap() {
  return textureLoader.load(newBump);
}

function createMaterial() {
  const material = new MeshPhongMaterial({
    map: createTexture(),
    specular: 0x222222,
    shininess: 25,
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
  mesh.position.y = -0.40;
  mesh.position.x = -2;
  return mesh;
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
    let newButton;

    const selfie = {
      start({ camera }) {
        // const newButtonStopWatch = createStopWatch().start();
        let currentClientX = 0;
        let currentClientY = 0;
        const isReturningTween = Symbol('returningTween');
        const mouseIn = {
          newButton: false,
        };
        const clickIn = {
          newButton: false,
        };
        const slideIn = {
          newButton: true,
        };
        const lastClientX = 0;
        const lastClientY = 0;
        let newButtonTween;

        const slideInTween = {
          newButton: new Tween(newButton.position)
            .to({
              x: -0.75,
            }, 5000)
            .easing(Easing.Exponential.InOut)
            .onComplete(() => {
              slideIn.newButton = false;
            }),
        };

        setTimeout(() => slideInTween.newButton.start(), 2500);

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

        function handler(event) {
          updatePositionForEvent(event);
          if (!slideIn.newButton && hitCheck(newButton)) {
            mouseIn.newButton = true;
          } else {
            mouseIn.newButton = false;
            if (!newButtonTween
              || (newButtonTween && !newButtonTween[isReturningTween])) {
              if (newButtonTween && !newButtonTween[isReturningTween]) {
                newButtonTween.stop();
              }
              newButtonTween = new Tween(newButton.position)
                .to({
                  z: 0,
                })
                .easing(Easing.Exponential.Out)
                .start();
              newButtonTween[isReturningTween] = true;
            }
          }
        }

        function handleMouseDown(event) {
          updatePositionForEvent(event);
          if (!slideIn.newButton && hitCheck(newButton)) {
            clickIn.newButton = true;
            mouseIn.newButton = true;
            if (newButtonTween) {
              newButtonTween.stop();
            }
            newButtonTween = new Tween(newButton.position)
              .to({
                z: -0.1,
              })
              .easing(Easing.Exponential.Out)
              .start();
          } else {
            mouseIn.newButton = false;
          }
        }

        function handleMouseUp(event) {
          updatePositionForEvent(event);
          if (!slideIn.newButton && hitCheck(newButton)) {
            if (newButtonTween) {
              newButtonTween.stop();
            }
            newButtonTween = new Tween(newButton.position)
              .to({
                z: 0,
              })
              .easing(Easing.Exponential.Out)
              .start();

            if (clickIn.newButton) {
              newButtonTween.onComplete(() => {
                dispatch(leaving());
              });
            }
            newButtonTween[isReturningTween] = true;
          } else {
            mouseIn.newButton = false;
          }
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
        newButton = createMesh({
          material: createMaterial(),
          geometry: createGeometry(),
        });
        yield newButton;
      },
    };
    return selfie;
  };
}
