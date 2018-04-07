import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  TextureLoader,
} from 'three';
import {
  Tween,
  Easing,
} from 'tween';
import renderEvents from 'utils/render';
import {
  getAssetUrl,
} from 'service/gamedb';
import {
  basicVertexShader as vertexShader,
  titleFragmentShader,
} from './shaders';

function createGeometry() {
  const geometry = new PlaneGeometry(1, 0.5, 64, 64);
  return geometry;
}

function createMaterial({ uniforms }) {
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: titleFragmentShader,
    transparent: true,
  });
  return material;
}

const textureLoader = new TextureLoader();

function createTexture() {
  const texture = textureLoader.load(getAssetUrl('GameDB/All/morpheus-title', 'png'));
  return texture;
}

function createMesh({ material, geometry }) {
  const mesh = new Mesh(
    geometry,
    material,
  );
  mesh.scale.set(3, 2, 1);
  mesh.position.y = 0.5;
  window.titleMesh = mesh;
  return mesh;
}

export default function factory() {
  return (/* dispatch, getState */) => {
    let uniforms;
    let object3D;

    const selfie = {
      start() {
        const v = {
          get amplitude() {
            return uniforms.amplitude.value;
          },
          set amplitude(value) {
            uniforms.amplitude.value = value;
          },
          get intensity() {
            return uniforms.intensity.value;
          },
          set intensity(value) {
            uniforms.intensity.value = value;
          },
          get opacity() {
            return uniforms.opacity.value;
          },
          set opacity(value) {
            uniforms.opacity.value = value;
          },
        };
        const opacityTween = new Tween(v)
          .to({
            opacity: 1,
          }, 10000)
          .easing(Easing.Sinusoidal.In);

        const amplitudeTween = new Tween(v)
          .to({
            amplitude: 0,
          }, 10000)
          .easing(Easing.Quintic.In);

        opacityTween.start();
        amplitudeTween.start();

        const startTime = Date.now();
        const update = () => {
          uniforms.time.value = (Date.now() - startTime) / 1000;
        };
        renderEvents.onRender(update);
        renderEvents.onDestroy(() => {
          opacityTween.stop();
          amplitudeTween.stop();
        });
      },
      createObject3D() {
        uniforms = {
          time: { type: 'f', value: 1.0 },
          amplitude: { type: 'f', value: 0.25 },
          intensity: { type: 'f', value: 15 },
          opacity: { type: 'f', value: 0 },
          texture: { type: 't', value: createTexture() },
        };
        object3D = createMesh({
          material: createMaterial({
            uniforms,
          }),
          geometry: createGeometry(),
        });
        return object3D;
      },
    };
    return selfie;
  };
}
