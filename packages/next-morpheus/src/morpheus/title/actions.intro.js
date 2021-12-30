import {
  CanvasTexture,
  Mesh,
  NearestFilter,
  PlaneGeometry,
  ShaderMaterial,
  VideoTexture,
  Vector2,
} from "three";
import { selectors as gameSelectors } from "morpheus/game";
import { Tween, Easing } from "@tweenjs/tween.js";
import { getAssetUrl } from "service/gamedb";
import renderEvents from "utils/render";
import { createVideo } from "utils/video";
import { titleDone } from "./actions";
import { basicVertexShader, rippleDissolveFragmentShader } from "./shaders";

function createGeometry() {
  const geometry = new PlaneGeometry(1, 1, 1, 1);
  return geometry;
}

function createMaterial({ uniforms }) {
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: basicVertexShader,
    fragmentShader: rippleDissolveFragmentShader,
    transparent: true,
  });
  return material;
}

function createMesh({ material, geometry, position }) {
  const mesh = new Mesh(geometry, material);
  Object.assign(mesh.position, position);
  return mesh;
}

function createObject({ uniforms, position, aspectRatio }) {
  const obj = createMesh({
    material: createMaterial({
      uniforms,
    }),
    geometry: createGeometry({
      aspectRatio,
    }),
    position,
  });
  obj.scale.set(2.22, 1.45, 1);
  return obj;
}

export default function factory({ canvas: sourceCanvas }) {
  return (dispatch, getState) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const aspectRatio = sourceCanvas.width / sourceCanvas.height;
    const texture = new CanvasTexture(canvas);
    const video = createVideo(getAssetUrl("GameDB/Deck1/introMOV"));
    video.volume = gameSelectors.htmlVolume(getState());
    const videoTexture = new VideoTexture(video);
    videoTexture.minFilter = NearestFilter;
    const uniforms = {
      time: { type: "f", value: 1.0 },
      center: { type: "fv2", value: new Vector2(0.0, 0.0) },
      freq: { type: "fv1", value: 0.0 },
      dissolve: { type: "f", value: 0.0 },
      textureIn: { type: "t", value: texture },
      textureOut: { type: "t", value: videoTexture },
    };
    let object3D;

    const selfie = {
      *createObject3D() {
        object3D = createObject({
          uniforms,
          aspectRatio,
          position: {
            x: 0,
            y: 0,
            z: -2,
          },
        });
        yield object3D;
      },
      activate({ screen }) {
        object3D.position.z = 0.5;
        const { x, y } = screen;
        uniforms.center.value = new Vector2((x + 1) / 2, (y + 1) / 2);
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          sourceCanvas,
          0,
          0,
          sourceCanvas.width,
          sourceCanvas.height,
          0,
          0,
          1024,
          1024
        );

        texture.needsUpdate = true;
        const v = {
          get dissolve() {
            return uniforms.dissolve.value;
          },
          set dissolve(value) {
            uniforms.dissolve.value = value;
          },
          get freq() {
            return uniforms.freq.value;
          },
          set freq(value) {
            uniforms.freq.value = value;
          },
        };
        let rippleTween = new Tween(v)
          .to(
            {
              freq: 3.0,
            },
            2000
          )
          .easing(Easing.Exponential.Out)
          .onComplete(() => {
            video.play();
            rippleTween = new Tween(v)
              .to(
                {
                  freq: 0.0,
                },
                2000
              )
              .easing(Easing.Exponential.Out);
            rippleTween.start();
          })
          .start();
        const dissolveTween = new Tween(v)
          .to(
            {
              dissolve: 1.0,
            },
            4000
          )
          .easing(Easing.Sinusoidal.InOut);

        rippleTween.start();
        dissolveTween.start();

        const startTime = Date.now();
        renderEvents.onRender(() => {
          uniforms.time.value = (Date.now() - startTime) / 1000;
        });
        renderEvents.onDestroy(() => {
          rippleTween.stop();
          dissolveTween.stop();
        });

        let wasMouseDowned = false;
        function handleMouseDown() {
          wasMouseDowned = true;
        }

        function handleTouchStart(touchEvent) {
          touchEvent.preventDefault();
          touchEvent.stopPropagation();
          handleMouseDown();
        }

        let allDone;

        function handleMouseUp() {
          if (wasMouseDowned) {
            allDone();
          }
        }

        function handleTouchMove(touchEvent) {
          touchEvent.preventDefault();
          touchEvent.stopPropagation();
        }

        allDone = () => {
          video.pause();
          window.document.removeEventListener("mousedown", handleMouseDown);
          window.document.removeEventListener("mouseup", handleMouseUp);
          window.document.removeEventListener("touchstart", handleTouchStart);
          window.document.removeEventListener("touchmove", handleTouchMove);
          window.document.removeEventListener("touchend", handleMouseUp);
          dispatch(titleDone());
        };

        video.addEventListener("ended", function videoEnded() {
          video.removeEventListener("ended", videoEnded);
          allDone();
        });

        window.document.addEventListener("mousedown", handleMouseDown);
        window.document.addEventListener("mouseup", handleMouseUp);
        window.document.addEventListener("touchstart", handleTouchStart, {
          passive: false,
        });
        window.document.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
        window.document.addEventListener("touchend", handleMouseUp);
      },
    };
    return selfie;
  };
}
