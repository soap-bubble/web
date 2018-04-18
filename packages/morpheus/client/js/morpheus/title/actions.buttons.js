import {
  DoubleSide,
  Mesh,
  PlaneGeometry,
  MeshPhongMaterial,
  TextureLoader,
  Raycaster,
  Vector2,
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
  singleRippleVertexShader,
} from './shaders';
import {
  leaving,
} from './actions';
import {
  titleDimensions,
} from './selectors';
import newMap from '../../../image/texture/new.png';
import newBumpMap from '../../../image/texture/new-bump.png';
import settingsMap from '../../../image/texture/settings.png';
import settingBumpMap from '../../../image/texture/settings-bump.png';
import exitMap from '../../../image/texture/exit.png';
import exitBumpMap from '../../../image/texture/exit-bump.png';
import contMap from '../../../image/texture/cont.png';
import contBumpMap from '../../../image/texture/cont-bump.png';


function createButton({
  map,
  bumpMap,
  uniforms,
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
      vertexShader: singleRippleVertexShader,
      uniforms,
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
      exitButton: null,
      contButton: null,
    };
    const selfie = {
      start({ camera, buttonCallback }) {
        // const newButtonStopWatch = createStopWatch().start();
        let currentClientX = 0;
        let currentClientY = 0;
        const isReturningTween = Symbol('returningTween');
        const buttonActions = {
          newButton(screen) {
            buttonCallback({
              name: 'newButton',
              screen,
            });
          },
        };
        const mouseIn = {
          newButton: false,
          settingsButton: false,
          exitButton: false,
          contButton: false,
        };
        const clickIn = {
          newButton: false,
          settingsButton: false,
          exitButton: false,
          contButton: false,
        };
        const slideIn = {
          newButton: false,
          settingsButton: false,
          exitButton: false,
          contButton: false,
        };
        const tweens = {
          newButton: null,
          settingsButton: null,
          exitButton: null,
          contButton: null,
        };

        const WAIT_TIME = 4000;
        const SLIDE_IN_TIME = 3000;
        const slideInTween = {
          newButton: new Tween(objects.newButton.position)
            .to({
              x: -0.75,
            }, SLIDE_IN_TIME)
            .easing(Easing.Exponential.InOut)
            .onComplete(() => {
              slideIn.newButton = false;
            }),

          settingsButton: new Tween(objects.settingsButton.position)
            .to({
              x: 0.75,
            }, SLIDE_IN_TIME)
            .easing(Easing.Exponential.InOut)
            .onComplete(() => {
              slideIn.settingsButton = false;
            }),

          exitButton: new Tween(objects.exitButton.position)
            .to({
              x: 0.75,
            }, SLIDE_IN_TIME)
            .easing(Easing.Exponential.InOut)
            .onComplete(() => {
              slideIn.exitButton = false;
            }),

          contButton: new Tween(objects.contButton.position)
            .to({
              x: -0.75,
            }, SLIDE_IN_TIME)
            .easing(Easing.Exponential.InOut)
            .onComplete(() => {
              slideIn.contButton = false;
            }),
        };

        setTimeout(() => slideInTween.newButton.start(), WAIT_TIME);
        setTimeout(() => slideInTween.settingsButton.start(), WAIT_TIME);
        setTimeout(() => slideInTween.exitButton.start(), WAIT_TIME);
        setTimeout(() => slideInTween.contButton.start(), WAIT_TIME);

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
          return isInstersected ? {
            screen: { x, y },
            camera,
            ...intersects[0],
          } : null;
        }

        function mouseMoveHandlerForButton(name) {
          const button = objects[name];
          if (!slideIn[name] && hitCheck(button)) {
            mouseIn[name] = true;
          } else {
            mouseIn[name] = false;
          }
        }

        function mouseDownHandlerForButton(name) {
          const button = objects[name];
          if (!slideIn[name] && hitCheck(button)) {
            clickIn[name] = true;
            mouseIn[name] = true;
          } else {
            mouseIn[name] = false;
          }
        }

        function mouseUpHandlerForButton(name) {
          const button = objects[name];
          const intersection = hitCheck(button);
          if (!slideIn[name] && intersection) {
            if (clickIn[name]) {
              if (buttonActions[name]) {
                buttonActions[name](intersection);
              }
            }
          } else {
            mouseIn[name] = false;
          }
        }

        function handler(event) {
          updatePositionForEvent(event);
          ['newButton', 'settingsButton', 'exitButton', 'contButton'].forEach(mouseMoveHandlerForButton);
        }

        function handleMouseDown(event) {
          updatePositionForEvent(event);
          ['newButton', 'settingsButton', 'exitButton', 'contButton'].forEach(mouseDownHandlerForButton);
        }

        function handleMouseUp(event) {
          updatePositionForEvent(event);
          ['newButton', 'settingsButton', 'exitButton', 'contButton'].forEach(mouseUpHandlerForButton);
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
            y: -0.3,
          },
        });
        yield objects.newButton;
        objects.settingsButton = createButton({
          map: settingsMap,
          bumpMap: settingBumpMap,
          position: {
            x: 2,
            y: -0.3,
          },
        });
        yield objects.settingsButton;
        objects.exitButton = createButton({
          map: exitMap,
          bumpMap: exitBumpMap,
          position: {
            x: 2.0,
            y: -0.7,
          },
        });
        yield objects.exitButton;
        objects.contButton = createButton({
          map: contMap,
          bumpMap: contBumpMap,
          position: {
            x: -2,
            y: -0.7,
          },
        });
        yield objects.contButton;
      },
    };
    return selfie;
  };
}
