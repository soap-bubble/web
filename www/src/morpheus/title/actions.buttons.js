import {
  DoubleSide,
  Mesh,
  PlaneGeometry,
  MeshPhongMaterial,
  TextureLoader,
  Raycaster,
  Vector2,
} from "three";
import { selectors as gameSelectors } from "morpheus/game";
import { Tween, Easing } from "@tweenjs/tween.js";
import renderEvents from "utils/render";

import { singleRippleVertexShader } from "./shaders";
import { titleDimensions } from "./selectors";
const newMap = "/image/texture/new.png";
const newBumpMap = "/image/texture/new-bump.png";
const settingsMap = "/image/texture/settings.png";
const settingsBumpMap = "/image/texture/settings-bump.png";
const exitMap = "/image/texture/exit.png";
const exitBumpMap = "/image/texture/exit-bump.png";
const contMap = "/image/texture/cont.png";
const contBumpMap = "/image/texture/cont-bump.png";

const textureLoader = new TextureLoader();

function createTexture(map) {
  return new Promise((resolve, reject) => {
    textureLoader.load(map, resolve, null, reject);
  });
}

function createButton({ map, bumpMap, uniforms, position }) {
  function createGeometry() {
    const geometry = new PlaneGeometry(1, 0.5, 1, 1);
    return geometry;
  }

  function createBumpMap() {
    return textureLoader.load(bumpMap);
  }

  function createMaterial() {
    const material = new MeshPhongMaterial(
      Object.assign(
        {
          map,
          specular: 0x222222,
          shininess: 5,
          side: DoubleSide,
          transparent: true,
          vertexShader: singleRippleVertexShader,
          uniforms,
        },
        !window.hasOwnProperty("cordova")
          ? {
              bumpMap,
              bumpScale: 0.1,
            }
          : {}
      )
    );
    return material;
  }

  function createMesh({ material, geometry }) {
    const mesh = new Mesh(geometry, material);
    mesh.scale.set(1, 0.85 * 0.66, 1);
    Object.assign(mesh.position, position);
    return mesh;
  }

  return createMesh({
    material: createMaterial(),
    geometry: createGeometry(),
  });
}

export default function factory() {
  return (dispatch, getState) => {
    const raycaster = new Raycaster();
    let cleanUp = () => {};
    const objects = {
      newButton: null,
      settingsButton: null,
      exitButton: null,
      contButton: null,
    };
    const textures = {};
    const selfie = {
      start({ camera, buttonCallback }) {
        // const newButtonStopWatch = createStopWatch().start();
        let currentClientX = 0;
        let currentClientY = 0;
        const isReturningTween = Symbol("returningTween");
        const buttonActions = {
          newButton(screen) {
            buttonCallback({
              name: "newButton",
              screen,
            });
          },
          contButton(screen) {
            buttonCallback({
              name: "contButton",
              screen,
            });
          },
          exitButton(screen) {
            buttonCallback({
              name: "exitButton",
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
            .to(
              {
                x: -0.75,
              },
              SLIDE_IN_TIME
            )
            .easing(Easing.Exponential.InOut)
            .onComplete(() => {
              slideIn.newButton = false;
            }),

          settingsButton: new Tween(objects.settingsButton.position)
            .to(
              {
                x: 0.75,
              },
              SLIDE_IN_TIME
            )
            .easing(Easing.Exponential.InOut)
            .onComplete(() => {
              slideIn.settingsButton = false;
            }),

          exitButton: new Tween(objects.exitButton.position)
            .to(
              {
                x: 0.75,
              },
              SLIDE_IN_TIME
            )
            .easing(Easing.Exponential.InOut)
            .onComplete(() => {
              slideIn.exitButton = false;
            }),

          contButton: new Tween(objects.contButton.position)
            .to(
              {
                x: -0.75,
              },
              SLIDE_IN_TIME
            )
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
          const y = ((height - currentClientY) / height) * 2 - 1;
          const x = ((currentClientX - width) / width) * 2 + 1;
          raycaster.setFromCamera({ x, y }, camera);
          const intersects = raycaster.intersectObject(object3D);
          const isInstersected = !!intersects.length;
          return isInstersected
            ? {
                screen: { x, y },
                camera,
                ...intersects[0],
              }
            : null;
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
          ["newButton", "settingsButton", "exitButton", "contButton"].forEach(
            mouseMoveHandlerForButton
          );
        }

        function handleMouseDown(event) {
          updatePositionForEvent(event);
          ["newButton", "settingsButton", "exitButton", "contButton"].forEach(
            mouseDownHandlerForButton
          );
        }

        function handleMouseUp(event) {
          updatePositionForEvent(event);
          ["newButton", "settingsButton", "exitButton", "contButton"].forEach(
            mouseUpHandlerForButton
          );
        }

        function onTouchStart(touchEvent) {
          const { touches } = touchEvent;
          touchEvent.preventDefault();
          touchEvent.stopPropagation();
          if (touches.length) {
            updatePositionForEvent(touches[0]);
            ["newButton", "settingsButton", "exitButton", "contButton"].forEach(
              mouseDownHandlerForButton
            );
          }
        }

        function onTouchMove(touchEvent) {
          const { touches } = touchEvent;
          touchEvent.preventDefault();
          touchEvent.stopPropagation();
          if (touches.length) {
            updatePositionForEvent(touches[0]);
            ["newButton", "settingsButton", "exitButton", "contButton"].forEach(
              mouseMoveHandlerForButton
            );
          }
        }

        function onTouchEnd({ changedTouches: touches }) {
          if (touches.length) {
            updatePositionForEvent(touches[0]);
            ["newButton", "settingsButton", "exitButton", "contButton"].forEach(
              mouseUpHandlerForButton
            );
          }
        }

        function onTouchCancel() {
          ["newButton", "settingsButton", "exitButton", "contButton"].forEach(
            mouseUpHandlerForButton
          );
        }

        window.document.addEventListener("mousemove", handler);
        window.document.addEventListener("mousedown", handleMouseDown);
        window.document.addEventListener("mouseup", handleMouseUp);
        window.document.addEventListener("touchstart", onTouchStart, {
          passive: false,
        });
        window.document.addEventListener("touchmove", onTouchMove, {
          passive: false,
        });
        window.document.addEventListener("touchend", onTouchEnd);
        window.document.addEventListener("touchcancel", onTouchCancel);
        cleanUp = () => {
          window.document.removeEventListener("mousemove", handler);
          window.document.removeEventListener("mousedown", handleMouseDown);
          window.document.removeEventListener("mouseup", handleMouseUp);
          window.document.removeEventListener("touchstart", onTouchStart);
          window.document.removeEventListener("touchmove", onTouchMove);
          window.document.removeEventListener("touchend", onTouchEnd);
          window.document.removeEventListener("touchcancel", onTouchCancel);
        };
        renderEvents.onDestroy(cleanUp);
      },
      load() {
        return Promise.all([
          createTexture(newMap).then((map) => (textures.newMap = map)),
          createTexture(newBumpMap).then((map) => (textures.newBumpMap = map)),
          createTexture(settingsMap).then(
            (map) => (textures.settingsMap = map)
          ),
          createTexture(settingsBumpMap).then(
            (map) => (textures.settingsBumpMap = map)
          ),
          createTexture(exitMap).then((map) => (textures.exitMap = map)),
          createTexture(exitBumpMap).then(
            (map) => (textures.exitBumpMap = map)
          ),
          createTexture(contMap).then((map) => (textures.contMap = map)),
          createTexture(contBumpMap).then(
            (map) => (textures.contBumpMap = map)
          ),
        ]);
      },
      *createObject3D() {
        objects.newButton = createButton({
          map: textures.newMap,
          bumpMap: textures.newBumpMap,
          position: {
            x: -2.5,
            y: -0.3,
          },
        });
        yield objects.newButton;
        objects.settingsButton = createButton({
          map: textures.settingsMap,
          bumpMap: textures.settingsBumpMap,
          position: {
            x: 2.5,
            y: -0.3,
          },
        });
        yield objects.settingsButton;
        objects.exitButton = createButton({
          map: textures.exitMap,
          bumpMap: textures.exitBumpMap,
          position: {
            x: 2.5,
            y: -0.7,
          },
        });
        yield objects.exitButton;
        objects.contButton = createButton({
          map: textures.contMap,
          bumpMap: textures.contBumpMap,
          position: {
            x: -2.5,
            y: -0.7,
          },
        });
        yield objects.contButton;
      },
      stop() {
        cleanUp();
      },
    };
    return selfie;
  };
}
