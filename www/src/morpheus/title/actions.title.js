import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  TextureLoader,
  Vector2,
} from "three";
import { Tween, Easing } from "@tweenjs/tween.js";
import renderEvents from "utils/render";
import { getAssetUrl } from "service/gamedb";
import {
  basicVertexShader as vertexShader,
  multiRippleFragmentShader,
} from "./shaders";

function createGeometry() {
  const geometry = new PlaneGeometry(1, 0.5, 64, 64);
  return geometry;
}

function createMaterial({ uniforms }) {
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: multiRippleFragmentShader,
    transparent: true,
  });
  return material;
}

const textureLoader = new TextureLoader();

function createTexture() {
  const texture = textureLoader.load(
    getAssetUrl("GameDB/All/morpheus-title", "png")
  );
  return texture;
}

function createMesh({ material, geometry }) {
  const mesh = new Mesh(geometry, material);
  const size = 1 / 1.8;
  mesh.scale.set(3 * size, 2 * size, 1);
  mesh.position.y = 0.5;
  window.titleMesh = mesh;
  return mesh;
}

export default function factory() {
  return (/* dispatch, getState */) => {
    let uniforms;
    let object3D;
    const ripples = [];

    function updateRipples() {
      const freq = [];
      const center = [];
      ripples.forEach((v, i) => {
        freq[i] = v.freq;
        center[i] = v.pos;
      });
      uniforms.center.value = center;
      uniforms.freq.value = freq;
    }

    const selfie = {
      start() {
        const v = {
          get opacity() {
            return uniforms.opacity.value;
          },
          set opacity(value) {
            uniforms.opacity.value = value;
          },
        };
        for (let i = 0; i < 5; i++) {
          ripples[i].tween = new Tween(ripples[i])
            .to(
              {
                freq: 0.001,
              },
              7000
            )
            .easing(Easing.Exponential.Out)
            .start();
        }
        const opacityTween = new Tween(v)
          .to(
            {
              opacity: 1,
            },
            7000
          )
          .easing(Easing.Sinusoidal.In);

        opacityTween.start();

        const startTime = Date.now();
        const update = () => {
          updateRipples();
          uniforms.time.value = (Date.now() - startTime) / 1000;
        };
        renderEvents.onRender(update);
        renderEvents.onDestroy(() => {
          opacityTween.stop();
          ripples.forEach(({ tween }) => tween.stop());
        });
      },
      *createObject3D() {
        uniforms = {
          time: { type: "f", value: 1.0 },
          center: { type: "fv2", value: [] },
          freq: { type: "fv1", value: [] },
          opacity: { type: "f", value: 0.0 },
          tex: { type: "t", value: createTexture() },
        };
        for (let i = 0; i < 5; i++) {
          ripples[i] = {
            pos: new Vector2(Math.random(), Math.random()),
            freq: 2 + Math.random() * 3,
          };
        }
        updateRipples();
        object3D = createMesh({
          material: createMaterial({
            uniforms,
          }),
          geometry: createGeometry(),
        });
        yield object3D;
      },
    };
    return selfie;
  };
}
