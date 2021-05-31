import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  TextureLoader,
  Vector2,
} from 'three';
import Tween  from '@tweenjs/tween.js';
import { getAssetUrl } from 'service/gamedb';
import renderEvents from 'utils/render';

import {
  leaving,
  done,
} from './actions';
import {
  titleDimensions,
} from './selectors';
import {
  basicVertexShader,
  multiRippleFragmentShader,
} from './shaders';

function createBackground({
  position,
  uniforms,
}) {
  function createGeometry() {
    const size = 1.12;
    const geometry = new PlaneGeometry(size * 4, size * 3, 1, 1);
    return geometry;
  }

  function createMaterial() {
    const material = new ShaderMaterial({
      uniforms,
      vertexShader: basicVertexShader,
      fragmentShader: multiRippleFragmentShader,
    });
    return material;
  }

  function createMesh({ material, geometry }) {
    const mesh = new Mesh(
      geometry,
      material,
    );
    Object.assign(mesh.position, position);
    return mesh;
  }

  return createMesh({
    material: createMaterial(),
    geometry: createGeometry(),
  });
}

export default function factory() {
  return () => {
    let uniforms;
    let backgroundPlane;
    const ripples = [];

    const selfie = {
      start() {
        const v = {
          get fade() {
            return uniforms.fade.value;
          },
          set fade(value) {
            uniforms.fade.value = value;
          },
        };
        for (let i = 0; i < 5; i++) {
          ripples[i].tween = new Tween(ripples[i])
            .to({
              freq: 0.01,
            }, 6000)
            .easing(Tween.Easing.Quadratic.Out)
            .start();
        }
        const fadeTween = new Tween(v)
          .to({
            fade: 1.0,
          }, 2000)
          .easing(Tween.Easing.Sinusoidal.In);

        fadeTween.start();
        const startTime = Date.now();
        renderEvents.onRender(() => {
          const freq = [];
          const center = [];
          ripples.forEach((r, i) => {
            freq[i] = r.freq;
            center[i] = r.pos;
          });
          uniforms.center.value = center;
          uniforms.freq.value = freq;
          uniforms.time.value = (Date.now() - startTime) / 1000;
        });
        renderEvents.onDestroy(() => {
          ripples.forEach(({ tween }) => tween.stop());
        });
      },
      * createObject3D() {
        const textureLoader = new TextureLoader();

        function createTexture() {
          const texture = textureLoader.load(getAssetUrl('GameDB/All/morpheus-background', 'jpg'));
          return texture;
        }
        uniforms = {
          time: { type: 'f', value: 1.0 },
          center: { type: 'fv2', value: [] },
          freq: { type: 'fv1', value: [] },
          opacity: { type: 'f', value: 1.0 },
          fade: { type: 'f', value: 0.0 },
          texture: { type: 't', value: createTexture() },
        };
        for (let i = 0; i < 5; i++) {
          ripples[i] = {
            pos: new Vector2(Math.random(), Math.random()),
            freq: 5 + (Math.random() * 8),
          };
        }
        const freq = [];
        const center = [];
        ripples.forEach((v, i) => {
          freq[i] = v.freq;
          center[i] = v.pos;
        });
        uniforms.center.value = center;
        uniforms.freq.value = freq;
        backgroundPlane = createBackground({
          uniforms,
          position: {
            x: 0,
            y: 0,
            z: -1,
          },
        });
        yield backgroundPlane;
      },
    };
    return selfie;
  };
}
